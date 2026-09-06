import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMethod, PaymentStatus, PaymentType } from '@prisma/client';
import { NotificationType } from '@sango/shared';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { NotifyService } from '../notifications/notify.service';
import { roundVnd } from '../bookings/pricing.util';
import {
  buildSignData,
  buildVnpayPaymentUrl,
  makeTxnRef,
  signHmacSha512,
  verifyVnpaySignature,
  type VnpayCallbackQuery,
} from './vnpay.util';

export type CheckoutType = 'DEPOSIT' | 'FULL' | 'ADD_ON';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookings: BookingsService,
    private readonly notify: NotifyService,
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
   * PROD-READY: NODE_ENV=production mặc định là vnpay — PAYMENT_MODE=mock phải
   * opt-in tường minh (chỉ dành cho demo local). Khi prod để mặc định, các route
   * mock callback/confirm tự 403 nhờ gate resolveMode() !== 'mock'.
   */
  static resolveMode(): 'mock' | 'vnpay' {
    const explicitMock = process.env.PAYMENT_MODE === 'mock';
    if (process.env.NODE_ENV === 'production') return explicitMock ? 'mock' : 'vnpay';
    return explicitMock || process.env.PAYMENT_MODE === undefined ? 'mock' : 'vnpay';
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

    // MAJOR-1 fix: re-validate voucher quota + per-user limit TRƯỚC KHI phát URL thanh toán.
    // Nếu voucher đã hết lượt toàn cục hoặc khách đã dùng hết lượt ở đơn khác trong thời gian
    // giữ hold -> chặn ngay tại checkout, không để khách thanh toán rồi mới fail ở callback.
    if (hold.voucherId && hold.discountAmount != null) {
      const voucher = await this.prisma.voucher.findUnique({ where: { id: hold.voucherId } });
      if (voucher) {
        if (!voucher.active || (voucher.expiresAt && voucher.expiresAt <= new Date())) {
          throw new ConflictException({
            message: 'Mã giảm giá đã hết hạn hoặc tạm dừng',
            code: 'VOUCHER_EXPIRED',
          });
        }
        if (voucher.usedCount >= voucher.usageLimit) {
          throw new ConflictException({
            message: 'Mã giảm giá đã hết lượt sử dụng',
            code: 'VOUCHER_EXHAUSTED',
          });
        }
        const usedByUser = await this.prisma.voucherRedemption.count({
          where: { voucherId: voucher.id, userId: user.id },
        });
        if (usedByUser >= voucher.perUserLimit) {
          throw new ConflictException({
            message: 'Bạn đã dùng hết lượt cho mã này',
            code: 'VOUCHER_USER_LIMIT',
          });
        }
      }
    }

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

  /**
   * Tạo lệnh thanh toán cho dịch vụ đi kèm (ADD_ON) của một booking đã CONFIRMED/CHECKED_IN.
   * txnRef phát định danh "<bookingId>.ADD_ON.<rand>".
   */
  async createAddonCheckout(user: { id: string; role?: string }, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        court: { include: { venue: { select: { ownerId: true } } } },
      },
    });
    if (!booking) {
      throw new NotFoundException({
        message: 'Không tìm thấy đơn đặt sân',
        code: 'BOOKING_NOT_FOUND',
      });
    }
    const isOwner = user.role !== 'CUSTOMER' && booking.court.venue.ownerId === user.id;
    if (booking.customerId !== user.id && user.role !== 'ADMIN' && !isOwner) {
      throw new ForbiddenException({
        message: 'Không phải đơn đặt sân của bạn',
        code: 'BOOKING_FORBIDDEN',
      });
    }
    if (booking.status !== 'CONFIRMED' && booking.status !== 'CHECKED_IN') {
      throw new ConflictException({
        message: 'Chỉ có thể thanh toán dịch vụ cho đơn đã xác nhận hoặc đã check-in',
        code: 'BOOKING_NOT_CONFIRMED',
      });
    }

    const unpaidAmount = await this.expectedAmountFor(booking.id, 'ADD_ON');
    if (unpaidAmount <= 0) {
      throw new ConflictException({
        message: 'Tất cả dịch vụ đi kèm của đơn này đã được thanh toán',
        code: 'NO_UNPAID_ADDONS',
      });
    }

    const txnRef = makeTxnRef(booking.id, 'ADD_ON');
    const mode = PaymentsService.resolveMode();
    const orderInfo = `Thanh toan dich vu don ${booking.code}`;

    const port = process.env.PORT ?? '4000';
    let paymentUrl: string;
    if (mode === 'mock') {
      paymentUrl = `http://localhost:${port}/api/v1/payments/mock/callback?txnRef=${encodeURIComponent(txnRef)}&amount=${unpaidAmount}`;
    } else {
      paymentUrl = buildVnpayPaymentUrl({
        baseUrl: this.env(
          'VNPAY_SANDBOX_URL',
          'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        ),
        tmnCode: this.requireEnv('VNPAY_TMN_CODE'),
        hashSecret: this.requireEnv('VNPAY_HASH_SECRET'),
        txnRef,
        amountVnd: unpaidAmount,
        orderInfo,
        returnUrl: this.env(
          'VNPAY_RETURN_URL',
          `http://localhost:${port}/api/v1/payments/vnpay/callback`,
        ),
        ipAddr: '127.0.0.1',
      });
    }

    return { txnRef, amount: unpaidAmount, type: 'ADD_ON' as const, mode, paymentUrl };
  }

  /** Số tiền mong đợi của một txnRef — suy ra từ hold (DEPOSIT|FULL) hoặc booking (ADD_ON), dùng để đối chiếu callback. */
  async expectedAmountFor(id: string, type: CheckoutType): Promise<number> {
    if (type === 'ADD_ON') {
      const addOns = await this.prisma.bookingAddOn.findMany({
        where: { bookingId: id },
        select: { quantity: true, unitPrice: true },
      });
      const totalAddOnCost = addOns.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

      const paidPayments = await this.prisma.payment.findMany({
        where: { bookingId: id, type: PaymentType.ADD_ON, status: PaymentStatus.PAID },
        select: { amount: true },
      });
      const paidTotal = paidPayments.reduce((sum, p) => sum + p.amount, 0);

      return Math.max(0, totalAddOnCost - paidTotal);
    }

    const { amount } = await this.quoteHold(id, type);
    return amount;
  }

  /**
   * MAJOR-B fix: ghi Payment(ADD_ON, PAID) trong MỘT transaction có khoá dòng booking
   * (SELECT ... FOR UPDATE) và re-check tổng paid BÊN TRONG transaction — hai callback
   * song song (khác txnRef) cùng booking không thể ghi tổng PAID vượt tổng tiền dịch vụ.
   * Giao dịch thừa (amount > unpaidAmount lúc khoá) bị từ chối an toàn bằng
   * PAYMENT_ADDON_OVERPAID mà không ghi bản ghi nào. Replay trùng txnRef chạm UNIQUE
   * constraint (P2002) và được caller xử lý idempotent như trước.
   */
  private async recordAddonPayment(
    bookingId: string,
    txnRef: string,
    amount: number,
    method: PaymentMethod,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Khoá dòng booking để tuần tự hoá các callback ADD_ON song song của cùng booking.
      await tx.$queryRaw`SELECT id FROM "bookings" WHERE id = ${bookingId}::uuid FOR UPDATE`;

      const addOns = await tx.bookingAddOn.findMany({
        where: { bookingId },
        select: { quantity: true, unitPrice: true },
      });
      const totalAddOnCost = addOns.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const paidAgg = await tx.payment.aggregate({
        where: { bookingId, type: PaymentType.ADD_ON, status: PaymentStatus.PAID },
        _sum: { amount: true },
      });
      const unpaidAmount = Math.max(0, totalAddOnCost - (paidAgg._sum.amount ?? 0));
      if (amount > unpaidAmount) {
        throw new ConflictException({
          message: 'Giao dịch vượt số tiền dịch vụ chưa thanh toán của đơn',
          code: 'PAYMENT_ADDON_OVERPAID',
        });
      }

      await tx.payment.create({
        data: {
          bookingId,
          amount,
          type: PaymentType.ADD_ON,
          method,
          txnRef,
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      });
    });
  }

  private frontendRedirect(
    status: 'SUCCESS' | 'FAIL',
    detail: Record<string, string>,
  ): {
    redirectUrl: string;
  } {
    const qs = new URLSearchParams(detail).toString();
    return {
      redirectUrl: `${this.env('FRONTEND_URL', 'http://localhost:5173')}/payment/result?status=${status}&${qs}`,
    };
  }

  /**
   * Callback VNPay — spec §6.1 bước 4: verify HMAC-SHA512 + đối chiếu số tiền +
   * idempotency qua txnRef UNIQUE, rồi confirm hold hoặc ghi nhận ADD_ON trong MỘT transaction.
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
    const { id, type } = parsed;

    if (await this.isAlreadyPaid(txnRef)) {
      // PA(chốt A): VNPay retry sau khi đã paid — giữ type cho luồng ADD_ON.
      return this.frontendRedirect('SUCCESS', {
        txnRef,
        ...(parsed.type === 'ADD_ON' ? { type: 'ADD_ON' } : {}),
      }); // idempotent theo spec
    }
    const expected = await this.expectedAmountFor(id, type);
    if (Number(query.vnp_Amount) !== expected * 100) {
      throw new BadRequestException({
        message: 'Số tiền callback không khớp',
        code: 'PAYMENT_AMOUNT_MISMATCH',
      });
    }

    if (type === 'ADD_ON') {
      const booking = await this.prisma.booking.findUnique({
        where: { id },
        select: { id: true, code: true, customerId: true },
      });
      if (!booking) {
        throw new NotFoundException({
          message: 'Không tìm thấy đơn đặt sân',
          code: 'BOOKING_NOT_FOUND',
        });
      }

      try {
        // MAJOR-B: ghi trong transaction có FOR UPDATE + re-check tổng paid.
        await this.recordAddonPayment(booking.id, txnRef, expected, PaymentMethod.VNPAY);
      } catch (e) {
        if ((e as { code?: string }).code === 'P2002') {
          return this.frontendRedirect('SUCCESS', { txnRef, type: 'ADD_ON' }); // replay song song trùng txnRef: idempotent
        }
        throw e;
      }

      await this.notify
        .dispatch({
          userId: booking.customerId,
          type: NotificationType.SERVICE,
          title: 'Thanh toán dịch vụ thành công',
          body: `Đã thanh toán ${expected.toLocaleString('vi-VN')}đ dịch vụ đi kèm cho đơn ${booking.code}.`,
          link: '/bookings',
        })
        .catch(() => undefined);

      // PA(chốt A): đính kèm type để FE trang kết quả phân biệt luồng ADD_ON.
      return this.frontendRedirect('SUCCESS', { txnRef, code: booking.code, type: 'ADD_ON' });
    }

    try {
      const booking = await this.bookings.confirmFromHold(id, {
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
   * hold/booking — không còn luồng nào xác nhận đơn khi thiếu/thiếu đối chiếu số tiền.
   */
  async processMockCallback(params: { txnRef?: string; amount?: string }) {
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
    const { id, type } = parsed;

    if (await this.isAlreadyPaid(txnRef)) {
      return { success: true, txnRef, type, alreadyPaid: true };
    }
    const expected = await this.expectedAmountFor(id, type);
    // M3 fix (S0 đồng bộ wallets.handleMockCallback L168-177): amount là BẮT BUỘC —
    // thiếu/rỗng/sai đều bị chặn, không mặc định tin callback.
    if (
      params.amount === undefined ||
      params.amount === '' ||
      Number(params.amount) !== expected
    ) {
      throw new BadRequestException({
        message: 'Số tiền callback không khớp',
        code: 'PAYMENT_AMOUNT_MISMATCH',
      });
    }

    if (type === 'ADD_ON') {
      const booking = await this.prisma.booking.findUnique({
        where: { id },
        select: { id: true, code: true, customerId: true },
      });
      if (!booking) {
        throw new NotFoundException({
          message: 'Không tìm thấy đơn đặt sân',
          code: 'BOOKING_NOT_FOUND',
        });
      }
      try {
        await this.recordAddonPayment(booking.id, txnRef, expected, PaymentMethod.MOCK);
      } catch (e) {
        if ((e as { code?: string }).code === 'P2002') {
          return { success: true, txnRef, type: 'ADD_ON', bookingCode: booking.code };
        }
        throw e;
      }
      await this.notify
        .dispatch({
          userId: booking.customerId,
          type: NotificationType.SERVICE,
          title: 'Thanh toán dịch vụ thành công',
          body: `Đã thanh toán ${expected.toLocaleString('vi-VN')}đ dịch vụ đi kèm cho đơn ${booking.code}.`,
          link: '/bookings',
        })
        .catch(() => undefined);
      return { success: true, txnRef, type: 'ADD_ON', bookingCode: booking.code };
    }

    try {
      const booking = await this.bookings.confirmFromHold(id, {
        txnRef,
        method: PaymentMethod.MOCK,
        amountPaid: expected,
        paidInFull: type === 'FULL',
      });
      return { success: true, txnRef, bookingCode: booking.code, type };
    } catch (e) {
      if ((e as { response?: { code?: string } }).response?.code === 'HOLD_ALREADY_CONVERTED') {
        return { success: true, txnRef, type };
      }
      throw e;
    }
  }

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
    const { id, type } = parsed;

    if (await this.isAlreadyPaid(txnRef)) {
      // PA(chốt A): giữ type để FE phân biệt cả nhánh replay sớm theo txnRef.
      return this.frontendRedirect('SUCCESS', {
        txnRef,
        ...(parsed.type === 'ADD_ON' ? { type: 'ADD_ON' } : {}),
      });
    }
    const expected = await this.expectedAmountFor(id, type);
    // S0 fix: thiếu amount cũng bị chặn (trước đây undefined là bỏ qua đối chiếu).
    if (params.amount === undefined || Number(params.amount) !== expected) {
      throw new BadRequestException({
        message: 'Số tiền callback không khớp',
        code: 'PAYMENT_AMOUNT_MISMATCH',
      });
    }

    if (type === 'ADD_ON') {
      const booking = await this.prisma.booking.findUnique({
        where: { id },
        select: { id: true, code: true, customerId: true },
      });
      if (!booking) {
        throw new NotFoundException({
          message: 'Không tìm thấy đơn đặt sân',
          code: 'BOOKING_NOT_FOUND',
        });
      }

      try {
        // MAJOR-B: ghi trong transaction có FOR UPDATE + re-check tổng paid.
        await this.recordAddonPayment(booking.id, txnRef, expected, PaymentMethod.MOCK);
      } catch (e) {
        if ((e as { code?: string }).code === 'P2002') {
          return this.frontendRedirect('SUCCESS', { txnRef, type: 'ADD_ON' }); // replay song song trùng txnRef: idempotent
        }
        throw e;
      }

      await this.notify
        .dispatch({
          userId: booking.customerId,
          type: NotificationType.SERVICE,
          title: 'Thanh toán dịch vụ thành công',
          body: `Đã thanh toán ${expected.toLocaleString('vi-VN')}đ dịch vụ đi kèm cho đơn ${booking.code}.`,
          link: '/bookings',
        })
        .catch(() => undefined);

      return this.frontendRedirect('SUCCESS', { txnRef, code: booking.code, type: 'ADD_ON' });
    }

    try {
      const booking = await this.bookings.confirmFromHold(id, {
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

  private parseTxnRef(txnRef: string): { id: string; type: CheckoutType } | null {
    const parts = txnRef.split('.');
    if (parts.length !== 3) return null;
    const [id, type] = parts;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
    if (type !== 'DEPOSIT' && type !== 'FULL' && type !== 'ADD_ON') return null;
    return { id, type: type as CheckoutType };
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
