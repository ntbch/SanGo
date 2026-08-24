import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, BookingStatus, PaymentMethod, PaymentStatus, PaymentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
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

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Giữ chỗ 10 phút — spec §6.1. Toàn bộ nằm trong MỘT transaction:
   * khoá dòng sân FOR UPDATE tuần tự hoá mọi request cùng slot ở tầng DB,
   * độc lập timing application -> không thể double-booking.
   */
  async createHold(user: { id: string }, dto: CreateHoldDto) {
    const court = await this.prisma.court.findUnique({
      where: { id: dto.courtId },
      include: { venue: { select: { openMinute: true, closeMinute: true, depositPercent: true } } },
    });
    if (!court)
      throw new NotFoundException({ message: 'Không tìm thấy sân con', code: 'COURT_NOT_FOUND' });
    if (court.status !== 'ACTIVE') {
      throw new ConflictException({ message: 'Sân con đang bảo trì', code: 'COURT_MAINTENANCE' });
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
    const hold = await this.prisma.bookingHold.findUnique({ where: { id: holdId } });
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
    return hold;
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
    opts: { txnRef: string; method?: PaymentMethod; amountPaid?: number; paidInFull?: boolean },
  ) {
    return this.prisma.$transaction(async (tx) => {
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
      // Trả đủ thì coi như đã đóng toàn bộ giá trị đơn, ngược lại giữ mức cọc của venue.
      const depositAmount = opts.paidInFull
        ? hold.subtotal
        : roundVnd((hold.subtotal * court.venue.depositPercent) / 100);

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
            // Ghép trận mở (§3.11): đơn mới luôn chưa đủ người.
            ...(hold.isPublicMatch
              ? { isPublicMatch: true, slotsNeeded: hold.slotsNeeded, matchFull: false }
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
      await tx.bookingHold.update({ where: { id: hold.id }, data: { status: 'CONVERTED' } });

      this.logger.log(`Booking ${booking.code} CONFIRMED từ hold ${hold.id}`);
      return booking;
    });
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

  /** Hủy đơn — spec §6.2: CANCELLED + bản ghi Payment(REFUND) khi có số hoàn. */
  async cancelBooking(bookingId: string, user: { id: string; role: string }, reason?: string) {
    const booking = await this.getBookingForCancel(bookingId, user);
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new ConflictException({
        message: 'Chỉ đơn ở trạng thái CONFIRMED mới hủy được',
        code: 'NOT_CANCELLABLE',
      });
    }
    const quote = this.refundQuote(booking);

    return this.prisma.$transaction(async (tx) => {
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
      this.logger.warn(
        `[DEV-ONLY] Email xác nhận hủy đơn ${booking.code} cho khách ${booking.customerId}: hoàn ${quote.percent}% = ${quote.refundAmount}đ`,
      );
      return {
        booking: updated,
        refundPercent: quote.percent,
        refundAmount: quote.refundAmount,
        refundPaymentId,
      };
    });
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

    return this.prisma.$transaction(async (tx) => {
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
        joinedCount: joinedCount + 1,
        slotsNeeded: fresh.slotsNeeded,
        matchFull,
      };
    });
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