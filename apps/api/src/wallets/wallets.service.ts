import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import {
  buildVnpayPaymentUrl,
  verifyVnpaySignature,
  type VnpayCallbackQuery,
} from '../payments/vnpay.util';

type Tx = Prisma.TransactionClient;

export type WalletDirection = 'CREDIT' | 'DEBIT';
export type WalletEntryType = 'TOPUP' | 'PAYMENT' | 'REFUND' | 'CASHBACK';

interface ApplyEntry {
  userId: string;
  /** Số tiền luôn DƯƠNG — chiều biến động do direction quyết định. */
  amount: number;
  direction: WalletDirection;
  type: WalletEntryType;
  refType: string;
  refId: string;
}

/** txnRef nạp tiền giữ nguyên shape "<id>.<TYPE>.<rand>" như Payment (quy ước bất di bất dịch). */
function makeTopupTxnRef(topupId: string): string {
  const short = Math.random().toString(36).slice(2, 6);
  return topupId + '.TOPUP.' + short;
}

function parseTopupTxnRef(txnRef: string): string | null {
  const parts = txnRef.split('.');
  if (parts.length !== 3) return null;
  const [id, type] = parts;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  if (type !== 'TOPUP') return null;
  return id;
}

/**
 * Ví nội bộ (F6) — WalletLedger append-only là NGUỒN SỰ THẬT số dư.
 * wallet_balances chỉ là hàng khoá/cache đồng bộ trong cùng tx để:
 *  - tính balanceAfter nhất quán (khoá dòng user bằng SELECT ... FOR UPDATE),
 *  - chặn trừ âm ví khi hai giao dịch chi chạy đồng thời.
 * Mọi ghi ledger đều qua applyInTx() trong transaction NGẮN; luồng đang giữ lock
 * dài (confirm/cancel booking) phải gọi SAU KHI COMMIT giao dịch chính.
 */
@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * PROD-READY: prod mặc định vnpay; PAYMENT_MODE=mock phải opt-in tường minh
   * (demo local). Đối chiếu PaymentsService.resolveMode — luôn giữ 2 file đồng bộ.
   */
  private static resolveMode(): 'mock' | 'vnpay' {
    const explicitMock = process.env.PAYMENT_MODE === 'mock';
    if (process.env.NODE_ENV === 'production') return explicitMock ? 'mock' : 'vnpay';
    return explicitMock || process.env.PAYMENT_MODE === undefined ? 'mock' : 'vnpay';
  }

  private env(key: string, fallback = ''): string {
    return process.env[key] ?? fallback;
  }

  private requireEnv(key: string): string {
    const v = process.env[key];
    if (!v) throw new Error(`Thiếu biến môi trường ${key}`);
    return v;
  }

  /**
   * Ghi một dòng ledger + cập nhật hàng ví, trong transaction đang mở.
   * INSERT ... ON CONFLICT DO NOTHING rồi SELECT ... FOR UPDATE: tuần tự hoá mọi
   * biến động theo user ở tầng DB -> không thể âm ví, balanceAfter không tách rời.
   */
  /**
   * Public cho các service cần ghi ví trong CÙNG transaction nghiệp vụ (M2 fix:
   * đóng quỹ đội atomic). Giữ nguyên hợp đồng: caller phải là tx đang mở và chịu
   * trách nhiệm commit/rollback toàn bộ.
   */
  async applyInTx(tx: Tx, entry: ApplyEntry): Promise<{ balanceAfter: number }> {
    await tx.$executeRaw`INSERT INTO "wallet_balances" ("userId", "balance", "updatedAt")
      VALUES (${entry.userId}::uuid, 0, NOW())
      ON CONFLICT ("userId") DO NOTHING`;

    const rows: Array<{ balance: number }> =
      await tx.$queryRaw`SELECT balance FROM "wallet_balances"
        WHERE "userId" = ${entry.userId}::uuid FOR UPDATE`;
    const current = Number(rows[0]?.balance ?? 0);

    const delta = entry.direction === 'CREDIT' ? entry.amount : -entry.amount;
    if (current + delta < 0) {
      throw new ConflictException({
        message: 'Số dư ví không đủ',
        code: 'WALLET_INSUFFICIENT_FUNDS',
      });
    }
    const balanceAfter = current + delta;

    await tx.$executeRaw`UPDATE "wallet_balances" SET "balance" = ${balanceAfter},
      "updatedAt" = NOW() WHERE "userId" = ${entry.userId}::uuid`;

    await tx.walletLedger.create({
      data: {
        userId: entry.userId,
        direction: entry.direction,
        type: entry.type,
        amount: entry.amount,
        refType: entry.refType,
        refId: entry.refId,
        balanceAfter,
      },
    });
    return { balanceAfter };
  }

  /** Cộng tiền vào ví (topup/hoàn). Ném P2002 nếu (refType, refId, type) đã tồn tại — chống hoàn kép. */
  async credit(entry: Omit<ApplyEntry, 'direction'>): Promise<{ balanceAfter: number }> {
    return this.prisma.$transaction((tx) => this.applyInTx(tx, { ...entry, direction: 'CREDIT' }));
  }

  /** Trừ tiền ví (thanh toán bằng ví). Chặn âm ví ngay trong tx. */
  async debit(entry: Omit<ApplyEntry, 'direction'>): Promise<{ balanceAfter: number }> {
    return this.prisma.$transaction((tx) => this.applyInTx(tx, { ...entry, direction: 'DEBIT' }));
  }

  /**
   * Tạo yêu cầu nạp (PENDING) — KHÔNG tạo bản ghi Payment vì Payment.bookingId NOT NULL.
   * Phase 2: PAYMENT_MODE=vnpay -> trả URL cổng VNPay thật (ký HMAC-SHA512 theo pattern
   * payments.service createCheckout); vnp_ReturnUrl per-request trỏ callback riêng của ví,
   * tái dùng VNPAY_TMN_CODE/VNPAY_HASH_SECRET — không thêm biến env mới. Mock giữ nguyên.
   */
  async createTopup(user: { id: string }, dto: { amount: number }) {
    const mode = WalletsService.resolveMode();

    const topupId = randomUUID();
    const txnRef = makeTopupTxnRef(topupId);
    const topup = await this.prisma.walletTopup.create({
      data: { id: topupId, userId: user.id, amount: dto.amount, txnRef },
    });

    const port = process.env.PORT ?? '4000';
    if (mode === 'mock') {
      const paymentUrl =
        `http://localhost:${port}/api/v1/wallet/mock/callback?txnRef=` +
        encodeURIComponent(txnRef) +
        `&amount=${topup.amount}`;
      return { txnRef: topup.txnRef, amount: topup.amount, mode: 'mock', paymentUrl };
    }

    const paymentUrl = buildVnpayPaymentUrl({
      baseUrl: this.env('VNPAY_SANDBOX_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
      tmnCode: this.requireEnv('VNPAY_TMN_CODE'),
      hashSecret: this.requireEnv('VNPAY_HASH_SECRET'),
      txnRef,
      amountVnd: topup.amount,
      orderInfo: `Nap tien vi SanGo ${txnRef}`,
      returnUrl: `${this.env('APP_URL', `http://localhost:${port}`)}/api/v1/wallet/vnpay/callback`,
      ipAddr: '127.0.0.1',
    });
    return { txnRef: topup.txnRef, amount: topup.amount, mode: 'vnpay', paymentUrl };
  }

  /**
   * Callback giả lập nạp ví — tái dụng pattern handleMockCallback của payments:
   * gate PAYMENT_MODE -> txnRef bắt buộc -> đối chiếu amount BẮT BUỘC ->
   * đánh dấu PAID + ghi ledger TOPUP trong MỘT tx ngắn; replay trả SUCCESS (idempotent).
   */
  async handleMockCallback(params: { txnRef?: string; amount?: string }) {
    if (WalletsService.resolveMode() !== 'mock') {
      throw new ForbiddenException({
        message: 'Mock callback chỉ khả dụng khi PAYMENT_MODE=mock',
        code: 'PAYMENT_MOCK_DISABLED',
      });
    }
    const txnRef = params.txnRef ?? '';
    const topupId = parseTopupTxnRef(txnRef);
    if (!topupId) {
      throw new BadRequestException({ message: 'txnRef không hợp lệ', code: 'WALLET_BAD_TXNREF' });
    }

    const topup = await this.prisma.walletTopup.findUnique({ where: { txnRef } });
    if (!topup || topup.id !== topupId) {
      throw new NotFoundException({
        message: 'Không tìm thấy yêu cầu nạp tiền',
        code: 'WALLET_TOPUP_NOT_FOUND',
      });
    }
    if (topup.status === PaymentStatus.PAID) {
      return this.redirect('SUCCESS', { txnRef }); // retry callback vẫn thành công
    }

    // Đối chiếu amount bắt buộc (bài học S0): thiếu/sai là chặn, không mặc định tin.
    if (
      params.amount === undefined ||
      params.amount === '' ||
      Number(params.amount) !== topup.amount
    ) {
      throw new BadRequestException({
        message: 'Số tiền callback không khớp yêu cầu nạp',
        code: 'WALLET_AMOUNT_MISMATCH',
      });
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // Update có điều kiện: hai callback đồng thời chỉ một thắng, phần kia coi như đã xử lý.
        const updated = await tx.walletTopup.updateMany({
          where: { id: topup.id, status: PaymentStatus.PENDING },
          data: { status: PaymentStatus.PAID, paidAt: new Date(), rawPayload: { mock: true } },
        });
        if (updated.count === 0) return; // đã được xác nhận trước đó
        await this.applyInTx(tx, {
          userId: topup.userId,
          amount: topup.amount,
          direction: 'CREDIT',
          type: 'TOPUP',
          refType: 'TOPUP',
          refId: txnRef, // txnId riêng — UNIQUE(refType, refId, type) chống ghi đôi
        });
      });
    } catch (e) {
      // UNIQUE ledger trúng (retry chen nhau): giữ kết quả SUCCESS như payments flow.
      if ((e as Prisma.PrismaClientKnownRequestError).code !== 'P2002') throw e;
      this.logger.warn('Topup ' + txnRef + ' ghi ledger trùng (race) — giữ SUCCESS');
    }
    return this.redirect('SUCCESS', { txnRef });
  }

  /**
   * Phase 2: callback thật từ cổng VNPay (GET /wallet/vnpay/callback). Tái dụng đuôi
   * handleMockCallback: txnRef bắt buộc -> đối chiếu amount (vnp_Amount tính bằng XU)
   * BẮT BUỘC khớp -> đánh dấu PAID + ghi ledger TOPUP trong MỘT tx; replay idempotent.
   * Chữ ký HMAC-SHA512 xác minh bằng vnpay.util; sai chữ ký/amount -> 400, không ghi tiền.
   */
  async handleVnpayCallback(query: VnpayCallbackQuery) {
    const secret = process.env.VNPAY_HASH_SECRET;
    if (!secret) {
      throw new ForbiddenException({
        message: 'VNPay chưa được cấu hình (VNPAY_HASH_SECRET)',
        code: 'PAYMENT_VNPAY_DISABLED',
      });
    }

    // Chữ ký bắt buộc: mọi tham số vnp_* được cổng ký, sửa giá trị nào cũng vỡ hash.
    if (!verifyVnpaySignature(query, secret)) {
      throw new BadRequestException({
        message: 'Chữ ký callback VNPay không hợp lệ',
        code: 'WALLET_BAD_SIGNATURE',
      });
    }

    const txnRef = query.vnp_TxnRef ?? '';
    const topupId = parseTopupTxnRef(txnRef);
    if (!topupId) {
      throw new BadRequestException({ message: 'txnRef không hợp lệ', code: 'WALLET_BAD_TXNREF' });
    }

    const topup = await this.prisma.walletTopup.findUnique({ where: { txnRef } });
    if (!topup || topup.id !== topupId) {
      throw new NotFoundException({
        message: 'Không tìm thấy yêu cầu nạp tiền',
        code: 'WALLET_TOPUP_NOT_FOUND',
      });
    }
    if (topup.status === PaymentStatus.PAID) {
      return this.redirect('SUCCESS', { txnRef }); // retry callback vẫn thành công
    }

    // Đối chiếu amount bắt buộc (bài học S0): vnp_Amount là số XU (= đồng * 100).
    const vnpAmount = Number(query.vnp_Amount);
    if (!Number.isFinite(vnpAmount) || vnpAmount / 100 !== topup.amount) {
      throw new BadRequestException({
        message: 'Số tiền callback không khớp yêu cầu nạp',
        code: 'WALLET_AMOUNT_MISMATCH',
      });
    }

    // FIX F2: CHỈ credit + mark PAID khi vnp_ResponseCode === '00' CHÍNH XÁC.
    // Mã khác '00' (user huỷ/ngân hàng từ chối) lẫn field THIẾU (undefined — callback
    // dở dang/không chuẩn) đều coi là thất bại: không ghi tiền, topup giữ PENDING.
    if (query.vnp_ResponseCode !== '00') {
      return this.redirect('FAIL', { txnRef });
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // Update có điều kiện: hai callback đồng thời chỉ một thắng, phần kia coi như đã xử lý.
        const updated = await tx.walletTopup.updateMany({
          where: { id: topup.id, status: PaymentStatus.PENDING },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
            rawPayload: {
              vnp_TxnRef: txnRef,
              vnp_ResponseCode: query.vnp_ResponseCode ?? null,
              vnp_TransactionNo: query.vnp_TransactionNo ?? null,
              vnp_BankCode: query.vnp_BankCode ?? null,
            },
          },
        });
        if (updated.count === 0) return; // đã được xác nhận trước đó
        await this.applyInTx(tx, {
          userId: topup.userId,
          amount: topup.amount,
          direction: 'CREDIT',
          type: 'TOPUP',
          refType: 'TOPUP',
          refId: txnRef, // txnId riêng — UNIQUE(refType, refId, type) chống ghi đôi
        });
      });
    } catch (e) {
      // UNIQUE ledger trúng (retry chen nhau): giữ kết quả SUCCESS như payments flow.
      if ((e as Prisma.PrismaClientKnownRequestError).code !== 'P2002') throw e;
      this.logger.warn('Topup ' + txnRef + ' ghi ledger trùng (race) — giữ SUCCESS');
    }
    return this.redirect('SUCCESS', { txnRef });
  }

  /** Số dư + lịch sử phân trang (đọc trực tiếp ledger — nguồn sự thật). */
  async getMyWallet(user: { id: string }, q: { page: number; pageSize: number }) {
    const rows: Array<{ balance: number }> = await this.prisma
      .$queryRaw`SELECT balance FROM "wallet_balances" WHERE "userId" = ${user.id}::uuid`;
    const balance = Number(rows[0]?.balance ?? 0);

    const [total, items] = await this.prisma.$transaction([
      this.prisma.walletLedger.count({ where: { userId: user.id } }),
      this.prisma.walletLedger.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        select: {
          id: true,
          direction: true,
          type: true,
          amount: true,
          refType: true,
          refId: true,
          balanceAfter: true,
          createdAt: true,
        },
      }),
    ]);

    return { balance, page: q.page, pageSize: q.pageSize, total, items };
  }

  private redirect(status: 'SUCCESS' | 'FAIL', detail: Record<string, string>) {
    const qs = new URLSearchParams(detail).toString();
    const base = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    return { redirectUrl: base + '/wallet?topup=' + status + '&' + qs };
  }
}
