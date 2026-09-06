/**
 * Integration test Wallets (F6) — Postgres thật, tự bỏ qua khi không có DB.
 * Chứng minh:
 *  - Nạp tiền mock: callback khớp amount mới cộng ví; replay callback idempotent.
 *  - UNIQUE(refType, refId, type) trên ledger chặn hoàn kép khi retry/crash.
 *  - Hai giao dịch chi ĐỒNG THỜI không thể âm ví (FOR UPDATE theo user).
 *  - GET /wallet/me đọc số dư + lịch sử ledger phân trang.
 */
import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaClient, type User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PrismaModule } from '../../src/prisma/prisma.module';
import { WalletsModule } from '../../src/wallets/wallets.module';
import { WalletsService } from '../../src/wallets/wallets.service';
import { buildSignData, signHmacSha512, verifyVnpaySignature } from '../../src/payments/vnpay.util';

const SUFFIX = Date.now().toString(36);

/** Ký query callback VNPay đúng chuẩn (dùng trong test để tự dựng callback hợp lệ). */
const signCallback = (params: Record<string, string>, secret: string) => ({
  ...params,
  vnp_SecureHash: signHmacSha512(buildSignData(params), secret),
});

/** Chạy 1 khối với PAYMENT_MODE=vnpay + credentials VNPay test, trả env như cũ. */
const withVnpayMode = async <T>(fn: () => Promise<T>): Promise<T> => {
  const prev: Array<[string, string | undefined]> = [
    ['PAYMENT_MODE', process.env.PAYMENT_MODE],
    ['VNPAY_TMN_CODE', process.env.VNPAY_TMN_CODE],
    ['VNPAY_HASH_SECRET', process.env.VNPAY_HASH_SECRET],
  ];
  process.env.PAYMENT_MODE = 'vnpay';
  process.env.VNPAY_TMN_CODE = 'SANGOTEST';
  process.env.VNPAY_HASH_SECRET = 'test-hash-secret-' + SUFFIX;
  try {
    return await fn();
  } finally {
    for (const [key, value] of prev) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

describe('Wallets service (integration)', () => {
  let prisma: PrismaClient;
  let wallets: WalletsService;
  let dbUp = false;

  let u1!: User; // luồng topup
  let u2!: User; // hoàn kép
  let u3!: User; // chi đồng thời + phân trang

  beforeAll(async () => {
    prisma = new PrismaClient();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbUp = true;
    } catch {
      console.warn('[integration] Không có Postgres -> bỏ qua wallets integration');
      return;
    }
    const hash = await bcrypt.hash('IntegrationPass1!', 4);
    const mkUser = (email: string) =>
      prisma.user.create({
        data: { email, passwordHash: hash, fullName: 'Wallet User', role: 'CUSTOMER' },
      });
    [u1, u2, u3] = await Promise.all([
      mkUser(`itwal-a-${SUFFIX}@sango.vn`),
      mkUser(`itwal-b-${SUFFIX}@sango.vn`),
      mkUser(`itwal-c-${SUFFIX}@sango.vn`),
    ]);

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, WalletsModule],
    }).compile();
    wallets = moduleRef.get(WalletsService);
  });

  afterAll(async () => {
    if (dbUp) await prisma.$disconnect();
  });

  it('F6: nạp mock -> PAID + ledger CREDIT/TOPUP + balanceAfter đúng', async () => {
    if (!dbUp) return;
    const res = await wallets.createTopup(u1, { amount: 200_000 });
    expect(res.mode).toBe('mock');
    expect(res.paymentUrl).toContain('/api/v1/wallet/mock/callback');

    await wallets.handleMockCallback({ txnRef: res.txnRef, amount: '200000' });

    const topup = await prisma.walletTopup.findUnique({ where: { txnRef: res.txnRef } });
    expect(topup?.status).toBe('PAID');
    const entry = await prisma.walletLedger.findFirst({
      where: { userId: u1.id, type: 'TOPUP' },
    });
    expect(entry).toMatchObject({
      direction: 'CREDIT',
      refType: 'TOPUP',
      refId: res.txnRef,
      amount: 200_000,
      balanceAfter: 200_000,
    });

    // KHÔNG được tạo Payment cho topup (Payment gắn bookingId NOT NULL)
    expect(await prisma.payment.count({ where: { txnRef: res.txnRef } })).toBe(0);
  });

  it('F6: replay callback -> SUCCESS idempotent, không ghi thêm ledger', async () => {
    if (!dbUp) return;
    const res = await wallets.createTopup(u1, { amount: 50_000 });
    await wallets.handleMockCallback({ txnRef: res.txnRef, amount: '50000' });
    const before = await prisma.walletLedger.count({ where: { userId: u1.id } });

    const replay = await wallets.handleMockCallback({ txnRef: res.txnRef, amount: '50000' });
    expect(replay.redirectUrl).toContain('topup=SUCCESS');
    expect(await prisma.walletLedger.count({ where: { userId: u1.id } })).toBe(before);
  });

  it('F6: callback thiếu/sai amount bị chặn (bài học S0)', async () => {
    if (!dbUp) return;
    const res = await wallets.createTopup(u1, { amount: 120_000 });
    await expect(wallets.handleMockCallback({ txnRef: res.txnRef })).rejects.toMatchObject({
      response: { code: 'WALLET_AMOUNT_MISMATCH' },
    });
    await expect(
      wallets.handleMockCallback({ txnRef: res.txnRef, amount: '999' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(await prisma.walletTopup.findUnique({ where: { txnRef: res.txnRef } })).toMatchObject({
      status: 'PENDING',
    });
  });

  it('F6: hoàn 2 lần cùng (refType, refId, type) -> lần 2 văng P2002 (chặn hoàn kép)', async () => {
    if (!dbUp) return;
    const entry = {
      userId: u2.id,
      amount: 80_000,
      type: 'REFUND' as const,
      refType: 'PAYMENT',
      refId: `fake-payment-${SUFFIX}`,
    };
    await wallets.credit(entry);
    await expect(wallets.credit(entry)).rejects.toMatchObject({ code: 'P2002' });
    expect(await prisma.walletLedger.count({ where: { userId: u2.id } })).toBe(1);
  });

  it('F6: hai giao dịch chi đồng thời -> đúng một thắng, ví không âm', async () => {
    if (!dbUp) return;
    await wallets.credit({
      userId: u3.id,
      amount: 100_000,
      type: 'TOPUP',
      refType: 'TOPUP',
      refId: `seed-${SUFFIX}`,
    });

    const entry = {
      userId: u3.id,
      amount: 80_000,
      type: 'PAYMENT' as const,
      refType: 'BOOKING',
      refId: `bk-${SUFFIX}`,
    };
    const results = await Promise.allSettled([wallets.debit(entry), wallets.debit(entry)]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(ConflictException);

    const me = await wallets.getMyWallet(u3, { page: 1, pageSize: 10 });
    expect(me.balance).toBe(20_000);
  });

  it('F6: getMyWallet lịch sử mới nhất lên đầu + phân trang', async () => {
    if (!dbUp) return;
    const page1 = await wallets.getMyWallet(u3, { page: 1, pageSize: 1 });
    const page2 = await wallets.getMyWallet(u3, { page: 2, pageSize: 1 });
    expect(page1.items.length).toBe(1);
    expect(page2.items.length).toBe(1);
    expect(page1.total).toBe(page2.total);
    // Mới nhất lên đầu: hai dòng ghi trong cùng ms nên so mốc thời gian thay vì đợi thứ tự cố định
    expect(page1.items[0]!.createdAt.getTime()).toBeGreaterThanOrEqual(
      page2.items[0]!.createdAt.getTime(),
    );
    const dirs = [page1.items[0]!.direction, page2.items[0]!.direction].sort();
    expect(dirs).toEqual(['CREDIT', 'DEBIT']);
  });

  it('VNPay-1 (Phase 2): PAYMENT_MODE=vnpay -> paymentUrl VNPay ký đúng + vnp_ReturnUrl callback ví; mock giữ nguyên', async () => {
    if (!dbUp) return;
    await withVnpayMode(async () => {
      const secret = process.env.VNPAY_HASH_SECRET!;
      const res = await wallets.createTopup(u1, { amount: 200_000 });
      expect(res.mode).toBe('vnpay');
      expect(res.paymentUrl).toContain('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?');
      expect(res.paymentUrl).toContain('vnp_TmnCode=SANGOTEST');
      expect(res.paymentUrl).toContain(encodeURIComponent(res.txnRef));

      // Đổi ngược query string -> xác minh chữ ký bằng chính util của dự án (P2.1).
      const qs = res.paymentUrl.split('?')[1]!;
      const params: Record<string, string> = {};
      for (const part of qs.split('&')) {
        const [k, v] = part.split('=');
        params[decodeURIComponent(k!)] = decodeURIComponent(v ?? '');
      }
      expect(verifyVnpaySignature(params, secret)).toBe(true);
      expect(params.vnp_Amount).toBe('20000000'); // đồng * 100
      expect(params.vnp_TxnRef).toBe(res.txnRef);
      // P2.3: vnp_ReturnUrl per-request trỏ callback riêng của ví, không thêm env mới.
      expect(params.vnp_ReturnUrl!.endsWith('/api/v1/wallet/vnpay/callback')).toBe(true);
    });

    // Trả env xong — mock mode giữ hành vi cũ nguyên vẹn.
    const mockRes = await wallets.createTopup(u1, { amount: 20_000 });
    expect(mockRes.mode).toBe('mock');
    expect(mockRes.paymentUrl).toContain('/api/v1/wallet/mock/callback');
  });

  it('VNPay-2 (Phase 2): callback VNPay sai amount -> 400 WALLET_AMOUNT_MISMATCH, topup vẫn PENDING', async () => {
    if (!dbUp) return;
    await withVnpayMode(async () => {
      const secret = process.env.VNPAY_HASH_SECRET!;
      const res = await wallets.createTopup(u1, { amount: 300_000 });
      // Ký đúng chuẩn nhưng vnp_Amount khác yêu cầu — chặn vì amount BẮT BUỘC khớp (P2.2).
      const query = signCallback(
        {
          vnp_TmnCode: 'SANGOTEST',
          vnp_TxnRef: res.txnRef,
          vnp_Amount: '99900000',
          vnp_ResponseCode: '00',
          vnp_TransactionNo: '13768912',
        },
        secret,
      );
      await expect(wallets.handleVnpayCallback(query)).rejects.toMatchObject({
        response: { code: 'WALLET_AMOUNT_MISMATCH' },
      });
      const topup = await prisma.walletTopup.findUnique({ where: { txnRef: res.txnRef } });
      expect(topup!.status).toBe('PENDING');
      expect(
        await prisma.walletLedger.count({ where: { refType: 'TOPUP', refId: res.txnRef } }),
      ).toBe(0);
    });
  });

  it('VNPay-3 (Phase 2): callback sai chữ ký -> 400 WALLET_BAD_SIGNATURE, không ghi tiền', async () => {
    if (!dbUp) return;
    await withVnpayMode(async () => {
      const res = await wallets.createTopup(u1, { amount: 75_000 });
      // Ký bằng secret khác -> hash không khớp, chặn trước cả khi đọc topup.
      const query = signCallback(
        { vnp_TxnRef: res.txnRef, vnp_Amount: '7500000', vnp_ResponseCode: '00' },
        'tampered-secret',
      );
      await expect(wallets.handleVnpayCallback(query)).rejects.toMatchObject({
        response: { code: 'WALLET_BAD_SIGNATURE' },
      });
      const topup = await prisma.walletTopup.findUnique({ where: { txnRef: res.txnRef } });
      expect(topup!.status).toBe('PENDING');
    });
  });

  it('VNPay-4 (Phase 2): callback đúng chữ ký + amount -> PAID + ledger TOPUP + balance tăng đúng', async () => {
    if (!dbUp) return;
    await withVnpayMode(async () => {
      const secret = process.env.VNPAY_HASH_SECRET!;
      const res = await wallets.createTopup(u1, { amount: 150_000 });
      const balanceBefore = (await wallets.getMyWallet(u1, { page: 1, pageSize: 1 })).balance;

      const query = signCallback(
        {
          vnp_TmnCode: 'SANGOTEST',
          vnp_TxnRef: res.txnRef,
          vnp_Amount: '15000000', // 150_000 đồng = 15_000_000 xu
          vnp_ResponseCode: '00',
          vnp_TransactionNo: '13768999',
          vnp_BankCode: 'NCB',
        },
        secret,
      );
      const out = await wallets.handleVnpayCallback(query);
      expect(out.redirectUrl).toContain('topup=SUCCESS');
      expect(out.redirectUrl).toContain(encodeURIComponent(res.txnRef));

      const topup = await prisma.walletTopup.findUnique({ where: { txnRef: res.txnRef } });
      expect(topup!.status).toBe('PAID');
      expect(topup!.paidAt).not.toBeNull();
      // 1 tx: mark PAID + ledger TOPUP — balance tăng ĐÚNG amount.
      const entry = await prisma.walletLedger.findFirst({
        where: { userId: u1.id, type: 'TOPUP', refId: res.txnRef },
      });
      expect(entry).toMatchObject({ direction: 'CREDIT', refType: 'TOPUP', amount: 150_000 });
      expect((await wallets.getMyWallet(u1, { page: 1, pageSize: 1 })).balance).toBe(
        balanceBefore + 150_000,
      );
    });
  });

  it('VNPay-5 (Phase 2): replay callback cùng txnRef -> SUCCESS idempotent, không cộng lần 2', async () => {
    if (!dbUp) return;
    await withVnpayMode(async () => {
      const secret = process.env.VNPAY_HASH_SECRET!;
      const res = await wallets.createTopup(u1, { amount: 60_000 });
      const query = signCallback(
        { vnp_TmnCode: 'SANGOTEST', vnp_TxnRef: res.txnRef, vnp_Amount: '6000000', vnp_ResponseCode: '00' },
        secret,
      );
      await wallets.handleVnpayCallback(query);
      const balanceAfterFirst = (await wallets.getMyWallet(u1, { page: 1, pageSize: 1 })).balance;
      const ledgerBefore = await prisma.walletLedger.count({
        where: { refType: 'TOPUP', refId: res.txnRef },
      });

      const replay = await wallets.handleVnpayCallback(query);
      expect(replay.redirectUrl).toContain('topup=SUCCESS');
      expect((await wallets.getMyWallet(u1, { page: 1, pageSize: 1 })).balance).toBe(
        balanceAfterFirst,
      );
      expect(
        await prisma.walletLedger.count({ where: { refType: 'TOPUP', refId: res.txnRef } }),
      ).toBe(ledgerBefore);
    });
  });

  it('VNPay-6 (Phase 2): cổng trả ResponseCode≠00 -> redirect FAIL, topup PENDING, không ghi ledger', async () => {
    if (!dbUp) return;
    await withVnpayMode(async () => {
      const secret = process.env.VNPAY_HASH_SECRET!;
      const res = await wallets.createTopup(u1, { amount: 90_000 });
      // vnp_Amount vẫn khớp (cổng luôn gửi đủ tham số có ký) — chỉ mã trả lời là huỷ.
      const query = signCallback(
        { vnp_TxnRef: res.txnRef, vnp_Amount: '9000000', vnp_ResponseCode: '24' },
        secret,
      );
      const out = await wallets.handleVnpayCallback(query);
      expect(out.redirectUrl).toContain('topup=FAIL');
      const topup = await prisma.walletTopup.findUnique({ where: { txnRef: res.txnRef } });
      expect(topup!.status).toBe('PENDING');
      expect(
        await prisma.walletLedger.count({ where: { refType: 'TOPUP', refId: res.txnRef } }),
      ).toBe(0);
    });
  });

  it('VNPay-7 (FIX F2): callback thiếu vnp_ResponseCode (undefined) -> redirect FAIL, không ghi tiền', async () => {
    if (!dbUp) return;
    await withVnpayMode(async () => {
      const secret = process.env.VNPAY_HASH_SECRET!;
      const res = await wallets.createTopup(u1, { amount: 75_000 });
      // Callback dở dang: chữ ký + amount hợp lệ nhưng KHÔNG có vnp_ResponseCode.
      // FIX F2: chỉ '00' chính xác mới credit — undefined phải coi như FAIL.
      const query = signCallback(
        { vnp_TxnRef: res.txnRef, vnp_Amount: '7500000' },
        secret,
      );
      const out = await wallets.handleVnpayCallback(query);
      expect(out.redirectUrl).toContain('topup=FAIL');
      const topup = await prisma.walletTopup.findUnique({ where: { txnRef: res.txnRef } });
      expect(topup!.status).toBe('PENDING');
      expect(
        await prisma.walletLedger.count({ where: { refType: 'TOPUP', refId: res.txnRef } }),
      ).toBe(0);
    });
  });
});
