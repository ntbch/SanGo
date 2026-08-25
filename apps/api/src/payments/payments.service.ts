import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { roundVnd } from '../bookings/pricing.util';
import {
  buildSignData,
  buildVnpayPaymentUrl,
  makeTxnRef,
  signHmacSha512,
  verifyVnpaySignature,
  type VnpayCallbackQuery,
} from './vnpay.util';

type CheckoutType = 'DEPOSIT' | 'FULL';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookings: BookingsService,
  ) {}

  private env(key: string, fallback = ''): string {
    return process.env[key] ?? fallback;
  }

  private requireEnv(key: string): string {
    const v = process.env[key];
    if (!v) throw new Error(`Thiếu biến môi trường ${key}`);
    return v;
  }

  /**
   * Chế độ thanh toán hiện hành — mock callback CHỈ được phép mở khi trả về 'mock'
   * (S0: mọi giá trị PAYMENT_MODE khác 'mock' coi như vnpay).
   */
  static resolveMode(): 'mock' | 'vnpay' {
    return (process.env.PAYMENT_MODE ?? 'mock') === 'mock' ? 'mock' : 'vnpay';
  }

  /** Số tiền phải trả cho lệnh checkout này theo type. */
  private async quoteHold(holdId: string, type: CheckoutType) {
    const hold = await this.prisma.bookingHold.findUnique({
      where: { id: holdId },
      include: { court: { include: { venue: { select: { depositPercent: true } } } } },
    });
    if (!hold)
      throw new NotFoundException({
        message: 'Không tìm thấy lượt giữ chỗ',
        code: 'HOLD_NOT_FOUND',
      });
    if (hold.status === 'CONVERTED') {
      throw new ConflictException({
        message: 'Giữ chỗ đã được thanh toán',
        code: 'HOLD_ALREADY_CONVERTED',
      });
    }
    if (hold.status !== 'ACTIVE' || hold.expiresAt.getTime() <= Date.now()) {
      throw new ConflictException({
        message: 'Giữ chỗ đã hết hạn, vui lòng đặt lại',
        code: 'HOLD_EXPIRED',
      });
    }
    // F3: giá đã chốt trên hold (finalAmount sau voucher) là nguồn tính — callback
    // recompute qua đây nên số tiền đối chiếu luôn khớp những gì khách đã xem.
    const base = hold.finalAmount ?? hold.subtotal;
    const amount =
      type === 'FULL' ? base : roundVnd((base * hold.court.venue.depositPercent) / 100);
    return { hold, amount };
  }

  /**
   * Tạo lệnh thanh toán: KHÔNG ghi Payment trước (Payment gắn chặt bookingId),
   * chỉ phát txnRef định danh "<holdId>.<TYPE>.<rand>" + URL cổng.
   * PAYMENT_MODE=mock -> URL mock callback nội bộ; ngược lại URL sandbox VNPay.
   */
  async createCheckout(user: { id: string }, dto: { holdId: string; type: CheckoutType }) {
    await this.bookings.getHold(dto.holdId, { ...user, role: 'CUSTOMER' }); // chỉ chủ hold được checkout
    const { hold, amount } = await this.quoteHold(dto.holdId, dto.type);
    void hold;

    const txnRef = makeTxnRef(dto.holdId, dto.type);
    const mode = PaymentsService.resolveMode();
    const orderInfo = `Thanh toan don ve san ${dto.holdId.slice(0, 8)}`;

    const port = process.env.PORT ?? '4000';
    let paymentUrl: string;
    if (mode === 'mock') {
      paymentUrl = `http://localhost:${port}/api/v1/payments/mock/callback?txnRef=${encodeURIComponent(txnRef)}&amount=${amount}`;
    } else {
      paymentUrl = buildVnpayPaymentUrl({
        baseUrl: this.env(
          'VNPAY_SANDBOX_URL',
          'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        ),
        tmnCode: this.requireEnv('VNPAY_TMN_CODE'),
        hashSecret: this.requireEnv('VNPAY_HASH_SECRET'),
        txnRef,
        amountVnd: amount,
        orderInfo,
        returnUrl: this.env(
          'VNPAY_RETURN_URL',
          `http://localhost:${port}/api/v1/payments/vnpay/callback`,
        ),
        ipAddr: '127.0.0.1',
      });
    }

    return { txnRef, amount, type: dto.type, mode, paymentUrl };
  }

  /** Số tiền mong đợi của một txnRef — suy ra từ hold, dùng để đối chiếu callback. */
  private async expectedAmountFor(holdId: string, type: CheckoutType): Promise<number> {
    const { amount } = await this.quoteHold(holdId, type);
    return amount;
  }

  private frontendRedirect(
    status: 'SUCCESS' | 'FAIL',
    detail: Record<string, string>,
  ): {
    redirectUrl: string;
  } {
    const qs = new URLSearchParams(detail).toString();
    return {
      redirectUrl: `${this.env('FRONTEND_URL', 'http://localhost:5173')}/thanh-toan/ket-qua?status=${status}&${qs}`,
    };
  }

  /**
   * Callback VNPay — spec §6.1 bước 4: verify HMAC-SHA512 + đối chiếu số tiền +
   * idempotency qua txnRef UNIQUE, rồi confirm hold trong MỘT transaction.
   */
  async handleVnpayCallback(query: VnpayCallbackQuery) {
    const secret = this.env('VNPAY_HASH_SECRET', 'sandbox-secret');
    if (!verifyVnpaySignature(query, secret)) {
      // Chữ ký sai: không redirect về success dưới mọi hình thức
      throw new BadRequestException({
        message: 'Chữ ký callback không hợp lệ',
        code: 'PAYMENT_BAD_SIGNATURE',
      });
    }
    if (query.vnp_ResponseCode !== '00') {
      return this.frontendRedirect('FAIL', {
        reason: 'GATEWAY_DECLINED',
        vnpResponseCode: query.vnp_ResponseCode ?? '',
      });
    }

    const txnRef = String(query.vnp_TxnRef ?? '');
    const parsed = this.parseTxnRef(txnRef);
    if (!parsed) {
      throw new BadRequestException({ message: 'txnRef không hợp lệ', code: 'PAYMENT_BAD_TXNREF' });
    }
    const { holdId, type } = parsed;

    if (await this.isAlreadyPaid(txnRef)) {
      return this.frontendRedirect('SUCCESS', { txnRef }); // idempotent theo spec
    }
    const expected = await this.expectedAmountFor(holdId, type);
    if (Number(query.vnp_Amount) !== expected * 100) {
      throw new BadRequestException({
        message: 'Số tiền callback không khớp',
        code: 'PAYMENT_AMOUNT_MISMATCH',
      });
    }

    try {
      const booking = await this.bookings.confirmFromHold(holdId, {
        txnRef,
        method: PaymentMethod.VNPAY,
        amountPaid: expected,
        paidInFull: type === 'FULL',
      });
      return this.frontendRedirect('SUCCESS', { txnRef, code: booking.code });
    } catch (e) {
      if ((e as { response?: { code?: string } }).response?.code === 'HOLD_ALREADY_CONVERTED') {
        return this.frontendRedirect('SUCCESS', { txnRef }); // retry trễ vẫn tính là thành công
      }
      throw e;
    }
  }

  /**
   * Callback giả lập cho PAYMENT_MODE=mock (demo khi sandbox trục trặc — §11).
   * S0 fix: route VÔ HIỆU khi PAYMENT_MODE≠mock và amount là BẮT BUỘC phải khớp
   * hold — không còn luồng nào xác nhận đơn khi thiếu/thiếu đối chiếu số tiền.
   */
  async handleMockCallback(params: { txnRef?: string; amount?: string }) {
    if (PaymentsService.resolveMode() !== 'mock') {
      throw new ForbiddenException({
        message: 'Mock callback chỉ khả dụng khi PAYMENT_MODE=mock',
        code: 'PAYMENT_MOCK_DISABLED',
      });
    }
    const txnRef = params.txnRef ?? '';
    const parsed = this.parseTxnRef(txnRef);
    if (!parsed) {
      throw new BadRequestException({ message: 'txnRef không hợp lệ', code: 'PAYMENT_BAD_TXNREF' });
    }
    const { holdId, type } = parsed;

    if (await this.isAlreadyPaid(txnRef)) {
      return this.frontendRedirect('SUCCESS', { txnRef });
    }
    const expected = await this.expectedAmountFor(holdId, type);
    // S0 fix: thiếu amount cũng bị chặn (trước đây undefined là bỏ qua đối chiếu).
    if (params.amount === undefined || Number(params.amount) !== expected) {
      throw new BadRequestException({
        message: 'Số tiền callback không khớp',
        code: 'PAYMENT_AMOUNT_MISMATCH',
      });
    }

    try {
      const booking = await this.bookings.confirmFromHold(holdId, {
        txnRef,
        method: PaymentMethod.MOCK,
        amountPaid: expected,
        paidInFull: type === 'FULL',
      });
      return this.frontendRedirect('SUCCESS', { txnRef, code: booking.code });
    } catch (e) {
      if ((e as { response?: { code?: string } }).response?.code === 'HOLD_ALREADY_CONVERTED') {
        return this.frontendRedirect('SUCCESS', { txnRef });
      }
      throw e;
    }
  }

  private parseTxnRef(txnRef: string): { holdId: string; type: CheckoutType } | null {
    const parts = txnRef.split('.');
    if (parts.length !== 3) return null;
    const [holdId, type] = parts;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(holdId))
      return null;
    if (type !== 'DEPOSIT' && type !== 'FULL') return null;
    return { holdId, type };
  }

  private async isAlreadyPaid(txnRef: string): Promise<boolean> {
    const p = await this.prisma.payment.findUnique({ where: { txnRef }, select: { status: true } });
    return p?.status === PaymentStatus.PAID;
  }

  /** Dùng trong test để tự ký callback đúng chuẩn. */
  static signParams(params: VnpayCallbackQuery, secret: string): string {
    return signHmacSha512(buildSignData(params), secret);
  }

  /** UUID ngẫu nhiên phục vụ test. */
  static newId(): string {
    return randomUUID();
  }
}
