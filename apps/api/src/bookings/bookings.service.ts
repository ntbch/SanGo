import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, BookingStatus, MatchLevel, PaymentMethod, PaymentStatus, PaymentType } from '@prisma/client';
import { NotificationType } from '@sango/shared';
import { PrismaService } from '../prisma/prisma.service';
import { NotifyService } from '../notifications/notify.service';
import { WalletsService } from '../wallets/wallets.service';
import {
  bookingCancelledEmail,
  bookingConfirmedEmail,
  paymentReceiptEmail,
} from '../notifications/mail-templates';
import {
  BulkCancelDto,
  CreateHoldDto,
  CreateReviewDto,
  MyBookingsQueryDto,
  OwnerBookingsQueryDto,
} from './dto/booking.dto';
import { priceForSlot, roundVnd, slotDateTime } from './pricing.util';

const HOLD_TTL_MINUTES = 10;

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: NotifyService,
    private readonly wallets: WalletsService,
  ) {}

  /**
   * Giữ chỗ 10 phút — spec §6.1. Toàn bộ nằm trong MỘT transaction:
   * khoá dòng sân FOR UPDATE tuần tự hoá mọi request cùng slot ở tầng DB,
   * độc lập timing application -> không thể double-booking.
   */
  async createHold(user: { id: string }, dto: CreateHoldDto) {
    const court = await this.prisma.court.findUnique({
      where: { id: dto.courtId },
      include: {
        venue: { select: { openMinute: true, closeMinute: true, depositPercent: true, status: true } },
      },
    });
    if (!court)
      throw new NotFoundException({ message: 'Không tìm thấy sân con', code: 'COURT_NOT_FOUND' });
    if (court.status !== 'ACTIVE') {
      throw new ConflictException({ message: 'Sân con đang bảo trì', code: 'COURT_MAINTENANCE' });
    }
    // Treo cụm sân (ADMIN): venue phải đang APPROVED mới cho đặt — SUSPENDED/PENDING/REJECTED chặn ngay.
    if (court.venue.status !== 'APPROVED') {
      throw new ConflictException({
        message: 'Sân hiện không khả dụng, vui lòng chọn sân khác',
        code: 'VENUE_NOT_BOOKABLE',
      });
    }

    // Slot phải LIỀN KỀ nhau đúng bước slotMinutes và nằm trong giờ mở cửa.
    const step = court.slotMinutes;
    const starts = [...dto.slots].sort((a, b) => a - b);
    for (let i = 0; i < starts.length - 1; i++) {
      if (starts[i + 1] - starts[i] !== step) {
        throw new BadRequestException({
          message: 'Các slot phải liền kề nhau',
          code: 'SLOTS_NOT_CONTIGUOUS',
        });
      }
    }
    const startMinute = starts[0];
    const endMinute = starts[starts.length - 1] + step;
    if (startMinute < court.venue.openMinute || endMinute > court.venue.closeMinute) {
      throw new BadRequestException({
        message: 'Khung giờ nằm ngoài giờ mở cửa của sân',
        code: 'OUTSIDE_OPENING_HOURS',
      });
    }
    for (const s of starts) {
      if ((s - court.venue.openMinute) % step !== 0) {
        throw new BadRequestException({
          message: 'Slot phải nằm trên lưới giờ của sân (bắt đầu từ giờ mở cửa, đúng độ dài slot)',
          code: 'SLOTS_MISALIGNED',
        });
      }
    }
    const date = new Date(dto.date + 'T00:00:00.000Z');

    // Mỗi user tối đa 1 hold ACTIVE (đặc tả §3.4).
    const activeHolds = await this.prisma.bookingHold.count({
      where: { userId: user.id, status: 'ACTIVE', expiresAt: { gt: new Date() } },
    });
    if (activeHolds >= 1) {
      throw new ConflictException({
        message: 'Bạn đang có một lần giữ chỗ đang hiệu lực, vui lòng hoàn tất hoặc chờ hết hạn',
        code: 'HOLD_LIMIT',
      });
    }

    // S2-F1 + MAJOR-A: đặt sân tư cách đội — team phải tồn tại và người đặt
    // phải là TeamMember ACTIVE, nếu không ai cũng gắn đơn vào team bất kỳ.
    if (dto.teamId) {
      const team = await this.prisma.team.findUnique({
        where: { id: dto.teamId },
        select: { id: true },
      });
      if (!team) {
        throw new NotFoundException({
          message: 'Không tìm thấy đội thể thao',
          code: 'TEAM_NOT_FOUND',
        });
      }
      const membership = await this.prisma.teamMember.findFirst({
        where: { teamId: dto.teamId, userId: user.id, status: 'ACTIVE' },
        select: { id: true },
      });
      if (!membership) {
        throw new ForbiddenException({
          message: 'Bạn không phải thành viên ACTIVE của đội này',
          code: 'NOT_TEAM_MEMBER',
        });
      }
    }

    const rules = await this.prisma.pricingRule.findMany({ where: { courtId: court.id } });
    let subtotal = 0;
    for (const s of starts) subtotal += priceForSlot(court, rules, date, s, s + step);

    return this.prisma.$transaction(async (tx) => {
      // Khoá dòng sân — mọi request cùng sân xếp hàng tại đây (spec §6.1 bước 2a).
      await tx.$queryRaw`SELECT id FROM "courts" WHERE id = ${court.id}::uuid FOR UPDATE`;

      const taken =
        (await tx.booking.count({
          where: {
            courtId: court.id,
            date,
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
            startMinute: { lt: endMinute },
            endMinute: { gt: startMinute },
          },
        })) +
        (await tx.bookingHold.count({
          where: {
            courtId: court.id,
            date,
            status: 'ACTIVE',
            expiresAt: { gt: new Date() },
            startMinute: { lt: endMinute },
            endMinute: { gt: startMinute },
          },
        }));
      if (taken > 0) {
        throw new ConflictException({
          message: 'Slot vừa có người nhanh tay hơn',
          code: 'SLOT_TAKEN',
        });
      }

      const hold = await tx.bookingHold.create({
        data: {
          userId: user.id,
          courtId: court.id,
          date,
          startMinute,
          endMinute,
          subtotal,
          expiresAt: new Date(Date.now() + HOLD_TTL_MINUTES * 60_000),
          // Ghép trận mở (§3.11): giữ lựa chọn để confirmFromHold copy sang Booking.
          ...(dto.isPublicMatch
            ? { isPublicMatch: true, slotsNeeded: dto.slotsNeeded ?? null }
            : {}),
          // S2-F1: giữ teamId trên hold để confirmFromHold copy sang Booking.
          ...(dto.teamId ? { teamId: dto.teamId } : {}),
        },
      });
      return {
        holdId: hold.id,
        courtId: court.id,
        date: dto.date,
        startMinute,
        endMinute,
        subtotal,
        expiresAt: hold.expiresAt,
        depositPercent: court.venue.depositPercent,
      };
    });
  }

  async getHold(holdId: string, user: { id: string; role: string }) {
    const hold = await this.prisma.bookingHold.findUnique({
      where: { id: holdId },
      include: {
        court: {
          select: { name: true, slotMinutes: true, venue: { select: { name: true, depositPercent: true } } },
        },
      },
    });
    if (!hold)
      throw new NotFoundException({
        message: 'Không tìm thấy lượt giữ chỗ',
        code: 'HOLD_NOT_FOUND',
      });
    if (hold.userId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException({
        message: 'Không phải lượt giữ chỗ của bạn',
        code: 'HOLD_FORBIDDEN',
      });
    }
    // FE checkout cần tên sân/%cọc và danh sách slot — hold trong DB chỉ lưu
    // startMinute/endMinute nên tách lại theo bước slotMinutes của sân con.
    const step = hold.court.slotMinutes;
    const slots: Array<{ startMinute: number; endMinute: number }> = [];
    for (let m = hold.startMinute; m < hold.endMinute; m += step) {
      slots.push({ startMinute: m, endMinute: Math.min(m + step, hold.endMinute) });
    }
    const { court, ...holdData } = hold;
    return {
      ...holdData,
      courtName: court.name,
      venueName: court.venue.name,
      depositPercent: court.venue.depositPercent,
      slots,
    };
  }

  /** Hủy sớm lượt giữ để nhả slot ngay (EXPIRED = không còn chiếm chỗ). */
  async releaseHold(holdId: string, user: { id: string; role: string }) {
    const hold = await this.getHold(holdId, user);
    if (hold.status === 'ACTIVE') {
      await this.prisma.bookingHold.update({ where: { id: hold.id }, data: { status: 'EXPIRED' } });
    }
    return { released: true };
  }

  /**
   * Chuyển hold thành Booking CONFIRMED sau khi thanh toán thành công (VNPay callback / mock).
   * Gọi bởi payments module (t7) trong cùng transaction với Payment PAID.
   */
  async confirmFromHold(
    holdId: string,
    opts: {
      txnRef: string;
      method?: PaymentMethod;
      amountPaid?: number;
      paidInFull?: boolean;
      teamId?: string;
    },
  ) {
    const booking = await this.prisma.$transaction(async (tx) => {
      const hold = await tx.bookingHold.findUnique({ where: { id: holdId } });
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

      await tx.$queryRaw`SELECT id FROM "courts" WHERE id = ${hold.courtId}::uuid FOR UPDATE`;
      const clash = await tx.booking.count({
        where: {
          courtId: hold.courtId,
          date: hold.date,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
          startMinute: { lt: hold.endMinute },
          endMinute: { gt: hold.startMinute },
        },
      });
      if (clash > 0) {
        await tx.bookingHold.update({ where: { id: hold.id }, data: { status: 'EXPIRED' } });
        throw new ConflictException({
          message: 'Slot vừa có người nhanh tay hơn',
          code: 'SLOT_TAKEN',
        });
      }

      const court = await tx.court.findUniqueOrThrow({
        where: { id: hold.courtId },
        include: { venue: { select: { depositPercent: true } } },
      });
      // F3: tiền ghi nhận tính trên giá ĐÃ GIẢM snapshot ở hold (callback cũng đối chiếu
      // theo nó). depositAmount là gốc tính hoàn/hủy (refundQuote) nên tự khớp
      // "hoàn theo giá đã giảm" mà không cần xử lý riêng ở luồng hủy.
      const paidBase = hold.finalAmount ?? hold.subtotal;
      const depositAmount = opts.paidInFull
        ? paidBase
        : roundVnd((paidBase * court.venue.depositPercent) / 100);

      // Mã đơn CH-YYYYMMDD-NNNN — hotfix 25P02: cấp phát số thứ tự ATOMIC bằng bảng
      // đếm booking_code_seq trong CÙNG tx. INSERT ... ON CONFLICT DO UPDATE ...
      // RETURNING là một statement duy nhất nên Postgres không thể hủy tx vì
      // unique violation trên code như cơ chế count(prefix)+1 + retry cũ
      // (sau 25P02 cả transaction đã abort nên retry vô nghĩa).
      const d = hold.date;
      const ymd =
        d.getUTCFullYear().toString() +
        String(d.getUTCMonth() + 1).padStart(2, '0') +
        String(d.getUTCDate()).padStart(2, '0');
      const prefix = `CH-${ymd}-`;
      // GREATEST(counter+1, max(mã hiện hữu)+1): chịu cả dữ liệu cũ/mù trước khi
      // bảng đếm tồn tại (đúng điều kiện QA seed mã không liền kề).
      const seqRows = await tx.$queryRaw<Array<{ lastSeq: number }>>`
        INSERT INTO "booking_code_seq" ("date", "lastSeq")
        VALUES (
          ${d}::date,
          GREATEST(
            1,
            COALESCE(
              (SELECT MAX(RIGHT("code", 4)::INT) FROM "bookings" WHERE "code" LIKE ${prefix} || '%'),
              0
            ) + 1
          )
        )
        ON CONFLICT ("date") DO UPDATE SET
          "lastSeq" = GREATEST(
            "booking_code_seq"."lastSeq" + 1,
            COALESCE(
              (SELECT MAX(RIGHT("code", 4)::INT) FROM "bookings" WHERE "code" LIKE ${prefix} || '%'),
              0
            ) + 1
          )
        RETURNING "lastSeq"`;
      const code = prefix + String(Number(seqRows[0].lastSeq)).padStart(4, '0');

      const booking: Prisma.BookingGetPayload<{ include: { court: true } }> =
        await tx.booking.create({
          data: {
            code,
            customerId: hold.userId,
            courtId: hold.courtId,
            date: hold.date,
            startMinute: hold.startMinute,
            endMinute: hold.endMinute,
            subtotal: hold.subtotal,
            depositAmount,
            status: BookingStatus.CONFIRMED,
            // S2-F1: payments không biết teamId -> lấy từ hold đã giữ lúc createHold.
            teamId: opts.teamId ?? hold.teamId ?? null,
            // Ghép trận mở (§3.11 & P6): đơn mới luôn chưa đủ người.
            ...(hold.isPublicMatch
              ? {
                  isPublicMatch: true,
                  slotsNeeded: hold.slotsNeeded,
                  matchFull: false,
                  matchLevel: (hold as unknown as { matchLevel?: MatchLevel }).matchLevel ?? 'FRIENDLY',
                  targetPositions: (hold as unknown as { targetPositions?: string[] }).targetPositions ?? [],
                  costPerPerson: (hold as unknown as { costPerPerson?: number | null }).costPerPerson ?? null,
                }
              : {}),
          },
          include: { court: true },
        });

      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: opts.amountPaid ?? depositAmount,
          type: opts.paidInFull ? PaymentType.FULL : PaymentType.DEPOSIT,
          method: opts.method ?? PaymentMethod.MOCK,
          txnRef: opts.txnRef,
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      });

      // F3: tiêu quota voucher NGAY TRONG tx confirm (pattern BookingCodeSeq:
      // guard atomic WHERE usedCount < usageLimit; UNIQUE(voucherId,userId) chặn dùng lại).
      // Voucher bị owner xoá sau lúc áp -> bỏ qua consume nhưng vẫn giữ giá đã giảm (snapshot).
      if (hold.voucherId && hold.discountAmount != null) {
        const vch = await tx.voucher.findUnique({ where: { id: hold.voucherId } });
        if (vch) {
          const bumped = await tx.voucher.updateMany({
            where: { id: vch.id, usedCount: { lt: vch.usageLimit } },
            data: { usedCount: { increment: 1 } },
          });
          if (bumped.count === 0) {
            throw new ConflictException({
              message: 'Mã giảm giá đã hết lượt sử dụng',
              code: 'VOUCHER_EXHAUSTED',
            });
          }
          try {
            await tx.voucherRedemption.create({
              data: {
                voucherId: vch.id,
                userId: hold.userId,
                holdId: hold.id,
                amountDiscounted: hold.discountAmount,
              },
            });
          } catch (e) {
            if ((e as { code?: string }).code === 'P2002') {
              throw new ConflictException({
                message: 'Bạn đã dùng hết lượt cho mã này',
                code: 'VOUCHER_USER_LIMIT',
              });
            }
            throw e;
          }
        }
      }

      await tx.bookingHold.update({ where: { id: hold.id }, data: { status: 'CONVERTED' } });

      this.logger.log(`Booking ${booking.code} CONFIRMED từ hold ${hold.id}`);
      return booking;
    });

    // Thông báo + mail giao dịch — SAU khi tx COMMIT (đọc bằng kết nối khác
    // không thấy bản ghi chưa commit). Lỗi ở đây không bao giờ vỡ thanh toán.
    await this.notifyAfterConfirm(booking.id, opts.amountPaid ?? booking.depositAmount);
    return booking;
  }

  /**
   * Phát thông báo sau khi đơn CONFIRMED (P2-B2): khách nhận BOOKING_CONFIRMED
   * + PAYMENT_RECEIVED (kèm 2 mail giao dịch); chủ venue nhận NEW_BOOKING_OWNER.
   * Chạy ngoài tx gốc nên mọi lỗi chỉ log, không ảnh hưởng kết quả thanh toán.
   */
  private async notifyAfterConfirm(bookingId: string, amountPaid: number): Promise<void> {
    try {
      const d = await this.notify.bookingMailData(bookingId);
      // QA-T4-P2-01: /bookings/:code không phải route web (bấm chuông bị 404) —
      // trỏ về trang Đơn của tôi; mã đơn đã nằm sẵn trong title/body.
      const link = '/dashboard/my-bookings';
      const mailBase = {
        code: d.code,
        customerName: d.customerName,
        courtName: d.courtName,
        venueName: d.venueName,
        venueAddress: d.venueAddress,
        date: d.dateIso,
        startMinute: d.startMinute,
        endMinute: d.endMinute,
      };

      await this.notify.dispatch({
        userId: d.customerId,
        type: NotificationType.BOOKING_CONFIRMED,
        title: 'Đặt sân thành công',
        body: `Đơn ${d.code} · ${d.courtName} đã được xác nhận`,
        link,
        mail: bookingConfirmedEmail({ ...mailBase, amountVnd: amountPaid }),
      });

      await this.notify.dispatch({
        userId: d.customerId,
        type: NotificationType.PAYMENT_RECEIVED,
        title: 'Thanh toán đã được ghi nhận',
        body: `SanGo đã nhận ${amountPaid.toLocaleString('vi-VN')}đ cho đơn ${d.code}`,
        link,
        mail: paymentReceiptEmail({ ...mailBase, amountVnd: amountPaid }),
      });

      // Chủ venue biết có đơn mới (chỉ in-app — không mail để tránh spam).
      await this.notify.dispatch({
        userId: d.venueOwnerId,
        type: NotificationType.NEW_BOOKING_OWNER,
        title: 'Có đơn đặt sân mới',
        body: `Đơn ${d.code} · ${d.courtName} (${d.venueName}) vừa được xác nhận`,
        link: '/dashboard/bookings', // QA-T4-P2-01: trang đơn của chủ sân (route có sẵn)
      });
    } catch (e) {
      this.logger.warn(
        `Không phát được thông báo xác nhận cho ${bookingId}: ${(e as Error).message}`,
      );
    }
  }

  /** Mức hoàn theo chính sách §6.2: >24h 100%, 12–24h 50%, <12h 0% (trên tiền cọc đã trả). */
  refundQuote(
    booking: { date: Date; startMinute: number; depositAmount: number },
    now = new Date(),
  ) {
    const hoursUntil =
      (slotDateTime(booking.date, booking.startMinute).getTime() - now.getTime()) / 3_600_000;
    const percent = hoursUntil > 24 ? 100 : hoursUntil >= 12 ? 50 : 0;
    return {
      percent,
      hoursUntil: Math.round(hoursUntil * 10) / 10,
      refundAmount: Math.floor((booking.depositAmount * percent) / 100),
    };
  }

  private async getBookingForCancel(bookingId: string, user: { id: string; role: string }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { court: { include: { venue: { select: { ownerId: true } } } } },
    });
    if (!booking)
      throw new NotFoundException({ message: 'Không tìm thấy đơn đặt', code: 'BOOKING_NOT_FOUND' });
    const isOwnerOfVenue = user.role !== 'CUSTOMER' && booking.court.venue.ownerId === user.id;
    if (booking.customerId !== user.id && user.role !== 'ADMIN' && !isOwnerOfVenue) {
      throw new ForbiddenException({
        message: 'Không phải đơn của bạn',
        code: 'BOOKING_FORBIDDEN',
      });
    }
    return booking;
  }

  async refundPreview(bookingId: string, user: { id: string; role: string }) {
    const booking = await this.getBookingForCancel(bookingId, user);
    return this.refundQuote(booking);
  }

  /** Hủy đơn — spec §6.2: CANCELLED + Payment(REFUND) chứng từ + hoàn ví tức thì (F6). */
  async cancelBooking(bookingId: string, user: { id: string; role: string }, reason?: string) {
    const booking = await this.getBookingForCancel(bookingId, user);
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new ConflictException({
        message: 'Chỉ đơn ở trạng thái CONFIRMED mới hủy được',
        code: 'NOT_CANCELLABLE',
      });
    }
    const quote = this.refundQuote(booking);

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: reason ?? null,
        },
      });
      let refundPaymentId: string | undefined;
      if (quote.refundAmount > 0) {
        const payment = await tx.payment.create({
          data: {
            bookingId: booking.id,
            amount: quote.refundAmount,
            type: PaymentType.REFUND,
            method: PaymentMethod.MOCK, // sandbox/mock không đẩy tiền thật (§6.2)
            txnRef: `RF-${booking.code}`,
            status: PaymentStatus.PENDING,
          },
        });
        refundPaymentId = payment.id;
      }
      return {
        booking: updated,
        refundPercent: quote.percent,
        refundAmount: quote.refundAmount,
        refundPaymentId,
      };
    });

    // F6: hoàn vào ví TỨC THÌ — ghi ledger SAU KHI COMMIT giao dịch chính (không
    // kéo dài FOR UPDATE lock); Payment(REFUND) chỉ là chứng từ đối soát.
    // UNIQUE(refType, refId, type) trên ledger chặn hoàn kép khi retry/crash.
    if (result.refundPaymentId && result.refundAmount > 0) {
      try {
        await this.wallets.credit({
          userId: result.booking.customerId,
          amount: result.refundAmount,
          type: 'REFUND',
          refType: 'PAYMENT',
          refId: result.refundPaymentId,
        });
        await this.prisma.payment.update({
          where: { id: result.refundPaymentId },
          data: { status: PaymentStatus.PAID, paidAt: new Date() },
        });
      } catch (e) {
        if ((e as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
          this.logger.warn(`Đơn ${result.booking.id}: refund đã ghi ví trước đó (retry) — bỏ qua`);
        } else {
          // Không fail request vì hủy đơn đã commit; Payment(REFUND) giữ PENDING làm dấu đối soát/replay.
          this.logger.error(
            `Đơn ${result.booking.id}: hoàn ví thất bại — giữ Payment(REFUND) PENDING: ${(e as Error).message}`,
          );
        }
      }
    }

    // P2-B2: thông báo hủy SAU khi commit (thay log [DEV-ONLY] cũ).
    await this.notifyAfterCancel(result.booking.id, result.refundAmount, reason);
    return result;
  }

  /**
   * N2 — Owner hủy hàng loạt các đơn CONFIRMED của MỘT ngày theo cụm sân (trời mưa).
   * Policy 'WEATHER': hoàn 100% tiền ĐÃ THỰC TRẢ (PAID) vào ví — KHÔNG tái dụng tier
   * >24h→100 / ≥12h→50 / else 0 của cancelBooking thường.
   * Giao dịch hủy + chứng từ Payment(REFUND) trong MỘT tx; ghi ví + fan-out notify
   * đều SAU COMMIT, best-effort, UNIQUE(refType, refId, type) chống hoàn kép khi replay.
   */
  async bulkCancelByDate(user: { id: string; role: string }, dto: BulkCancelDto) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: dto.venueId },
      select: { id: true, ownerId: true },
    });
    if (!venue) {
      throw new NotFoundException({ message: 'Không tìm thấy cụm sân', code: 'VENUE_NOT_FOUND' });
    }
    if (user.role !== 'ADMIN' && venue.ownerId !== user.id) {
      throw new ForbiddenException({
        message: 'Bạn không phải chủ của cụm sân này',
        code: 'VENUE_FORBIDDEN',
      });
    }

    const date = new Date(dto.date + 'T00:00:00.000Z');
    const targets = await this.prisma.booking.findMany({
      where: { status: BookingStatus.CONFIRMED, date, court: { venueId: venue.id } },
      include: { payments: true },
      orderBy: [{ startMinute: 'asc' }],
    });
    if (targets.length === 0) {
      return {
        date: dto.date,
        venueId: venue.id,
        policy: 'WEATHER' as const,
        cancelledCount: 0,
        refundedTotal: 0,
        items: [],
      };
    }

    const reason = dto.reason ?? 'Hủy hàng loạt do thời tiết xấu';
    const items = await this.prisma.$transaction(async (tx) => {
      const out: Array<{
        bookingId: string;
        code: string;
        customerId: string;
        refundPaymentId?: string;
        refundAmount: number;
      }> = [];
      for (const b of targets) {
        // Tiền đã thực trả ròng = PAID(DEPOSIT|FULL) − PAID(REFUND) trước đó
        const paidNet = b.payments
          .filter((p) => p.status === PaymentStatus.PAID)
          .reduce((s, p) => s + (p.type === PaymentType.REFUND ? -p.amount : p.amount), 0);
        const refundAmount = Math.max(0, paidNet);

        const updated = await tx.booking.update({
          where: { id: b.id },
          data: {
            status: BookingStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelReason: `[WEATHER] ${reason}`,
          },
        });
        let refundPaymentId: string | undefined;
        if (refundAmount > 0) {
          const payment = await tx.payment.create({
            data: {
              bookingId: b.id,
              amount: refundAmount,
              type: PaymentType.REFUND,
              method: PaymentMethod.MOCK,
              txnRef: `RF-${b.code}`,
              status: PaymentStatus.PENDING,
            },
          });
          refundPaymentId = payment.id;
        }
        out.push({
          bookingId: b.id,
          code: updated.code,
          customerId: updated.customerId,
          refundPaymentId,
          refundAmount,
        });
      }
      return out;
    });

    // SAU COMMIT: hoàn 100% vào ví TỨC THÌ (best-effort per đơn, không fail request)
    let refundedTotal = 0;
    for (const it of items) {
      if (!it.refundPaymentId || it.refundAmount <= 0) continue;
      try {
        await this.wallets.credit({
          userId: it.customerId,
          amount: it.refundAmount,
          type: 'REFUND',
          refType: 'PAYMENT',
          refId: it.refundPaymentId,
        });
        await this.prisma.payment.update({
          where: { id: it.refundPaymentId },
          data: { status: PaymentStatus.PAID, paidAt: new Date() },
        });
        refundedTotal += it.refundAmount;
      } catch (e) {
        if ((e as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
          this.logger.warn(`Đơn ${it.code}: refund đã ghi ví trước đó (replay) — bỏ qua`);
          continue;
        }
        this.logger.error(
          `Đơn ${it.code}: hoàn ví thất bại — giữ Payment(REFUND) PENDING để đối soát: ${(e as Error).message}`,
        );
      }
    }

    // Fan-out thông báo best-effort SAU COMMIT (notifyAfterCancel tự bắt lỗi nội bộ)
    for (const it of items) {
      await this.notifyAfterCancel(it.bookingId, it.refundAmount, `[WEATHER] ${reason}`);
    }

    return {
      date: dto.date,
      venueId: venue.id,
      policy: 'WEATHER' as const,
      cancelledCount: items.length,
      refundedTotal,
      items: items.map(({ bookingId: _b, customerId: _c, ...rest }) => rest),
    };
  }

  /** Khách + chủ venue đều nhận BOOKING_CANCELLED; khách nhận thêm mail hủy đơn. */
  private async notifyAfterCancel(
    bookingId: string,
    refundAmount: number,
    reason?: string,
  ): Promise<void> {
    try {
      const d = await this.notify.bookingMailData(bookingId);
      // QA-T4-P2-01: /bookings/:code không phải route web (bấm chuông bị 404) —
      // trỏ về trang Đơn của tôi; mã đơn đã nằm sẵn trong title/body.
      const link = '/dashboard/my-bookings';
      const body = reason
        ? `Đơn ${d.code} · ${d.courtName} đã bị hủy. Lý do: ${reason}`
        : `Đơn ${d.code} · ${d.courtName} đã bị hủy`;

      await this.notify.dispatch({
        userId: d.customerId,
        type: NotificationType.BOOKING_CANCELLED,
        title: 'Đơn đặt sân đã bị hủy',
        body,
        link,
        mail: bookingCancelledEmail({
          code: d.code,
          customerName: d.customerName,
          courtName: d.courtName,
          venueName: d.venueName,
          venueAddress: d.venueAddress,
          date: d.dateIso,
          startMinute: d.startMinute,
          endMinute: d.endMinute,
          amountVnd: refundAmount,
          cancelReason: reason,
        }),
      });

      await this.notify.dispatch({
        userId: d.venueOwnerId,
        type: NotificationType.BOOKING_CANCELLED,
        title: 'Một đơn vừa bị hủy',
        body,
        link,
      });
    } catch (e) {
      this.logger.warn(`Không phát được thông báo hủy cho ${bookingId}: ${(e as Error).message}`);
    }
  }

  /* ------------------------- Cron helpers (chạy mỗi phút) ------------------------- */

  /** Hold ACTIVE quá hạn -> EXPIRED, nhả slot. */
  async expireStaleHolds(): Promise<number> {
    const r = await this.prisma.bookingHold.updateMany({
      where: { status: 'ACTIVE', expiresAt: { lte: new Date() } },
      data: { status: 'EXPIRED' },
    });
    return r.count;
  }

  /** Booking CONFIRMED qua giờ kết thúc -> COMPLETED (so sánh tuyệt đối UTC, spec §5). */
  async completePastBookings(): Promise<number> {
    const r = await this.prisma.$executeRaw`
      UPDATE "bookings" SET "status" = 'COMPLETED'
      WHERE "status" = 'CONFIRMED'
        AND ("date"::timestamp AT TIME ZONE 'UTC' + ("endMinute" * interval '1 minute')) < now()`;
    return Number(r);
  }
  /** Khách review đơn ĐÃ HOÀN THÀNH — 1 đơn duy nhất 1 review (UNIQUE bookingId chặn cả race). */
  async createReview(bookingId: string, user: { id: string }, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { court: { select: { venueId: true } } },
    });
    if (!booking)
      throw new NotFoundException({ message: 'Không tìm thấy đơn đặt', code: 'BOOKING_NOT_FOUND' });
    if (booking.customerId !== user.id) {
      throw new ForbiddenException({
        message: 'Chỉ khách trong đơn mới được đánh giá',
        code: 'BOOKING_FORBIDDEN',
      });
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new ConflictException({
        message: 'Chỉ đánh giá được đơn đã hoàn thành (COMPLETED)',
        code: 'REVIEW_NOT_ALLOWED',
      });
    }

    try {
      return await this.prisma.review.create({
        data: {
          bookingId: booking.id,
          venueId: booking.court.venueId,
          customerId: user.id,
          rating: dto.rating,
          comment: dto.comment,
        },
      });
    } catch (e) {
      // UNIQUE(bookingId) chặn trường hợp hai request cùng gửi
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException({ message: 'Đơn này đã được đánh giá', code: 'REVIEW_EXISTS' });
      }
      throw e;
    }
  }

  /** Lấy danh sách đơn đặt của khách hàng (GET /bookings/me) */
  async listMine(user: { id: string }, query: MyBookingsQueryDto) {
    const todayMidnight = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');

    let whereStatus: Prisma.BookingWhereInput = {};
    if (query.filter === 'upcoming') {
      whereStatus = {
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
        date: { gte: todayMidnight },
      };
    } else if (query.filter === 'history') {
      whereStatus = {
        OR: [
          { status: BookingStatus.COMPLETED },
          {
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
            date: { lt: todayMidnight },
          },
        ],
      };
    } else if (query.filter === 'cancelled') {
      whereStatus = {
        status: { in: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
      };
    }

    const where: Prisma.BookingWhereInput = {
      customerId: user.id,
      ...whereStatus,
    };

    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: [{ date: 'desc' }, { startMinute: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          court: {
            include: {
              venue: {
                select: { id: true, name: true, slug: true, address: true, images: true },
              },
            },
          },
          payments: true,
          review: true,
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  /** Check-in bằng mã đơn (POST /bookings/check-in) — spec §6.3: owner/admin */
  async checkIn(code: string, user: { id: string; role: string }) {
    const booking = await this.prisma.booking.findUnique({
      where: { code },
      include: {
        court: { include: { venue: { select: { id: true, ownerId: true, name: true } } } },
        customer: { select: { id: true, fullName: true, phone: true, email: true } },
      },
    });
    if (!booking) {
      throw new NotFoundException({
        message: 'Không tìm thấy đơn đặt với mã này',
        code: 'BOOKING_NOT_FOUND',
      });
    }

    if (user.role !== 'ADMIN' && booking.court.venue.ownerId !== user.id) {
      throw new ForbiddenException({
        message: 'Bạn không có quyền check-in đơn của cụm sân này',
        code: 'BOOKING_FORBIDDEN',
      });
    }

    if (booking.status === BookingStatus.CHECKED_IN) {
      return { message: 'Đơn này đã check-in trước đó', booking };
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new ConflictException({
        message: `Không thể check-in đơn đang ở trạng thái ${booking.status}`,
        code: 'CHECKIN_NOT_ALLOWED',
      });
    }

    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CHECKED_IN },
      include: {
        court: { include: { venue: { select: { id: true, name: true } } } },
        customer: { select: { id: true, fullName: true, phone: true, email: true } },
      },
    });

    return { message: 'Check-in thành công', booking: updated };
  }

  /** Đánh dấu No-show cho đơn không đến (POST /bookings/:id/no-show) — owner/admin */
  async markNoShow(bookingId: string, user: { id: string; role: string }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { court: { include: { venue: { select: { ownerId: true } } } } },
    });
    if (!booking) {
      throw new NotFoundException({ message: 'Không tìm thấy đơn đặt', code: 'BOOKING_NOT_FOUND' });
    }

    if (user.role !== 'ADMIN' && booking.court.venue.ownerId !== user.id) {
      throw new ForbiddenException({
        message: 'Bạn không có quyền thao tác trên đơn này',
        code: 'BOOKING_FORBIDDEN',
      });
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new ConflictException({
        message: 'Chỉ có thể đánh dấu no-show cho đơn CONFIRMED',
        code: 'NOSHOW_NOT_ALLOWED',
      });
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.NO_SHOW },
    });
  }

  /** Danh sách đơn đặt theo venue cho Owner (GET /owner/bookings) */
  async listOwnerBookings(user: { id: string; role: string }, query: OwnerBookingsQueryDto) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: query.venueId },
      select: { id: true, ownerId: true },
    });
    if (!venue) {
      throw new NotFoundException({ message: 'Không tìm thấy cụm sân', code: 'VENUE_NOT_FOUND' });
    }

    if (user.role !== 'ADMIN' && venue.ownerId !== user.id) {
      throw new ForbiddenException({
        message: 'Bạn không phải chủ của cụm sân này',
        code: 'VENUE_FORBIDDEN',
      });
    }

    const where: Prisma.BookingWhereInput = {
      court: { venueId: query.venueId },
      ...(query.date ? { date: new Date(query.date + 'T00:00:00.000Z') } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: [{ date: 'desc' }, { startMinute: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          court: { select: { id: true, name: true, sportType: true } },
          customer: { select: { id: true, fullName: true, phone: true, email: true } },
          payments: true,
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  /* ------------------- Ghép trận mở (open match) — §3.11 ------------------- */

  /**
   * Tham gia ghép trận của người khác: chặn tự join, trùng join, join khi đã đủ.
   * Transaction + row lock trên dòng booking để hai người bấm cùng lúc vẫn đếm đúng.
   */
  async joinOpenMatch(bookingId: string, user: { id: string; role: string }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        code: true,
        customerId: true,
        status: true,
        isPublicMatch: true,
        slotsNeeded: true,
        matchFull: true,
      },
    });
    if (!booking)
      throw new NotFoundException({ message: 'Không tìm thấy đơn đặt', code: 'BOOKING_NOT_FOUND' });
    if (booking.customerId === user.id) {
      throw new BadRequestException({
        message: 'Bạn là chủ đơn, không cần tự tham gia',
        code: 'SELF_JOIN_NOT_ALLOWED',
      });
    }
    if (booking.status !== BookingStatus.CONFIRMED || !booking.isPublicMatch) {
      throw new ConflictException({
        message: 'Đơn này không mở ghép trận',
        code: 'JOIN_NOT_ALLOWED',
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "bookings" WHERE id = ${booking.id}::uuid FOR UPDATE`;
      const fresh = await tx.booking.findUniqueOrThrow({
        where: { id: booking.id },
        select: { slotsNeeded: true, matchFull: true },
      });
      const joinedCount = await tx.matchParticipant.count({ where: { bookingId: booking.id } });
      const needed = fresh.slotsNeeded ?? 0;
      if (fresh.matchFull || joinedCount >= needed) {
        // Đồng bộ cờ nếu dữ liệu đang lệch (vd người tham gia chưa kịp đánh dấu full).
        if (!fresh.matchFull && joinedCount >= needed && needed > 0) {
          await tx.booking.update({ where: { id: booking.id }, data: { matchFull: true } });
        }
        throw new ConflictException({ message: 'Đơn đã đủ người ghép', code: 'MATCH_FULL' });
      }

      try {
        await tx.matchParticipant.create({ data: { bookingId: booking.id, userId: user.id } });
      } catch (e) {
        // UNIQUE(bookingId, userId) chặn join trùng cả trong race.
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          throw new ConflictException({
            message: 'Bạn đã tham gia đơn này rồi',
            code: 'ALREADY_JOINED',
          });
        }
        throw e;
      }

      const matchFull = joinedCount + 1 >= needed;
      await tx.booking.update({ where: { id: booking.id }, data: { matchFull } });
      return {
        bookingId: booking.id,
        hostCustomerId: booking.customerId,
        bookingCode: booking.code,
        joinedCount: joinedCount + 1,
        slotsNeeded: fresh.slotsNeeded,
        matchFull,
      };
    });

    // P2-B2 (post-commit): báo chủ đơn có người mới tham gia ghép trận.
    try {
      const joinerName =
        (
          await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { fullName: true },
          })
        )?.fullName ?? 'Một người chơi';
      await this.notify.dispatch({
        userId: result.hostCustomerId,
        type: NotificationType.MATCH_JOINED,
        title: 'Có người tham gia đơn ghép trận',
        body: `${joinerName} vừa tham gia đơn ${result.bookingCode} (${result.joinedCount}/${result.slotsNeeded} người)`,
        link: '/dashboard/my-bookings', // QA-T4-P2-01: route web có sẵn
      });
    } catch (e) {
      this.logger.warn(`Không gửi được MATCH_JOINED cho ${user.id}: ${(e as Error).message}`);
    }

    return {
      bookingId: result.bookingId,
      joinedCount: result.joinedCount,
      slotsNeeded: result.slotsNeeded,
      matchFull: result.matchFull,
    };
  }

  /** Rời ghép trận: xóa bản ghi participant; đơn đang full sẽ tự mở lại chỗ trống. */
  async leaveOpenMatch(bookingId: string, user: { id: string }) {
    const key = { bookingId_userId: { bookingId, userId: user.id } };
    const participant = await this.prisma.matchParticipant.findUnique({ where: key });
    if (!participant)
      throw new NotFoundException({ message: 'Bạn chưa tham gia đơn này', code: 'JOIN_NOT_FOUND' });

    await this.prisma.matchParticipant.delete({ where: key });
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { slotsNeeded: true, matchFull: true },
    });
    let matchFull = booking?.matchFull ?? false;
    if (booking?.matchFull && (booking.slotsNeeded ?? 0) > 0) {
      const remaining = await this.prisma.matchParticipant.count({ where: { bookingId } });
      if (remaining < (booking.slotsNeeded ?? 0)) {
        await this.prisma.booking.update({ where: { id: bookingId }, data: { matchFull: false } });
        matchFull = false;
      }
    }

    // P2-B2: chủ đơn cần biết chỗ trống lại để mời người khác.
    const host = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { customerId: true, code: true },
    });
    if (host) {
      const leaverName =
        (
          await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { fullName: true },
          })
        )?.fullName ?? 'Một người chơi';
      await this.notify.dispatch({
        userId: host.customerId,
        type: NotificationType.MATCH_LEFT,
        title: 'Có người rời đơn ghép trận',
        body: `${leaverName} đã rời đơn ${host.code}. Đơn mở lại chỗ trống.`,
        link: '/dashboard/my-bookings', // QA-T4-P2-01: route web có sẵn
      });
    }
    return { left: true, bookingId, matchFull };
  }

  /** Danh sách người đã tham gia ghép trận — chỉ chủ đơn hoặc ADMIN. */
  async listMatchParticipants(bookingId: string, user: { id: string; role: string }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { customerId: true, slotsNeeded: true, matchFull: true },
    });
    if (!booking)
      throw new NotFoundException({ message: 'Không tìm thấy đơn đặt', code: 'BOOKING_NOT_FOUND' });
    if (booking.customerId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException({
        message: 'Chỉ chủ đơn hoặc admin xem được danh sách người tham gia',
        code: 'BOOKING_FORBIDDEN',
      });
    }
    const rows = await this.prisma.matchParticipant.findMany({
      where: { bookingId },
      orderBy: { joinedAt: 'asc' },
      include: { user: { select: { id: true, fullName: true } } },
    });
    return {
      bookingId,
      slotsNeeded: booking.slotsNeeded ?? null,
      matchFull: booking.matchFull ?? false,
      joinedCount: rows.length,
      participants: rows.map((r) => ({
        userId: r.user.id,
        fullName: r.user.fullName,
        joinedAt: r.joinedAt,
      })),
    };
  }
}
