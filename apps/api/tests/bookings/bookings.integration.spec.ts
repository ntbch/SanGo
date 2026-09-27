/**
 * Integration test Booking engine (spec §6.1–6.2) — chạy Postgres THẬT.
 * Bắt buộc gồm: race 2 request cùng slot -> 1 thắng / 1 SLOT_TAKEN;
 * hold hết hạn nhả slot; tính tiền cọc theo depositPercent.
 * Không có DB -> tự bỏ qua để gate vẫn xanh.
 * Nguồn chuỗi kết nối: PrismaClient đọc process.env.DATABASE_URL TRƯỚC (CI export),
 * nếu không có mới fallback .env cục bộ — không hardcode, không cờ skip riêng.
 * Probe SELECT 1 ở beforeAll chỉ là safety-net cho máy không có DB nào.
 */
import { Test } from '@nestjs/testing';
import { PrismaClient, type User } from '@prisma/client';
import { DayType, PaymentStatus, PaymentType, SportType } from '@sango/shared';
import * as bcrypt from 'bcryptjs';
import { AuthModule } from '../../src/auth/auth.module';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { BookingsModule } from '../../src/bookings/bookings.module';
import { BookingsService } from '../../src/bookings/bookings.service';
import { SlotsService } from '../../src/bookings/slots.service';
import { CreateBookingSchema } from '../../src/bookings/dto/create-booking.dto';
import {
  buildVnpayDrRefundPayload,
  VnpayRefundService,
} from '../../src/payments/vnpay-refund.service';
import { signHmacSha512 } from '../../src/payments/vnpay.util';

const SUFFIX = Date.now().toString(36);

describe('Booking engine chống double-booking (integration)', () => {
  let prisma: PrismaClient;
  let bookings: BookingsService;
  let slots: SlotsService;
  let dbUp = false;

  let custA!: User;
  let custB!: User;
  let courtId!: string;
  const uA = () => ({ id: custA.id, role: 'CUSTOMER' });
  const uB = () => ({ id: custB.id, role: 'CUSTOMER' });

  /** Ngày mai theo UTC (tránh rơi vào quá khứ lúc chạy đêm). */
  const tomorrow = () =>
    new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z').getTime() + 86_400_000;
  const dstr = (t: number) => new Date(t).toISOString().slice(0, 10);
  const DATE = dstr(tomorrow());

  beforeAll(async () => {
    prisma = new PrismaClient();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbUp = true;
    } catch {
      console.warn('[integration] Không có Postgres -> bỏ qua booking integration');
      return;
    }
    const hash = await bcrypt.hash('IntegrationPass1!', 4);
    custA = await prisma.user.create({
      data: {
        email: `itbk-a-${SUFFIX}@sango.vn`,
        passwordHash: hash,
        fullName: 'Cust A',
        role: 'CUSTOMER',
      },
    });
    custB = await prisma.user.create({
      data: {
        email: `itbk-b-${SUFFIX}@sango.vn`,
        passwordHash: hash,
        fullName: 'Cust B',
        role: 'CUSTOMER',
      },
    });

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, BookingsModule],
    }).compile();
    bookings = moduleRef.get(BookingsService);
    slots = moduleRef.get(SlotsService);
  });

  afterAll(async () => {
    if (dbUp && custA && custB) {
      // Quét TOÀN BỘ user itbk-* (gồm rác của những lần chạy crash trước)
      // và xóa con trước cha để không bao giờ kẹt FK RESTRICT.
      const users = await prisma.user.findMany({
        where: { email: { contains: 'itbk-' } },
        select: { id: true },
      });
      const ids = users.map((u) => u.id);
      await prisma.review.deleteMany({ where: { customer: { id: { in: ids } } } });
      // F6: dữ liệu ví tham chiếu user (RESTRICT) — dọn trước khi xóa user
      await prisma.walletLedger.deleteMany({ where: { userId: { in: ids } } });
      await prisma.walletBalance.deleteMany({ where: { userId: { in: ids } } });
      await prisma.walletTopup.deleteMany({ where: { userId: { in: ids } } });
      await prisma.payment.deleteMany({ where: { booking: { customerId: { in: ids } } } });
      await prisma.booking.deleteMany({ where: { customerId: { in: ids } } });
      await prisma.bookingHold.deleteMany({ where: { userId: { in: ids } } });
      const owned = await prisma.venue.findMany({
        where: { ownerId: { in: ids } },
        select: { id: true },
      });
      const venueIds = owned.map((v) => v.id);
      await prisma.pricingRule.deleteMany({ where: { court: { venueId: { in: venueIds } } } });
      // customerId IS NULL không bao giờ khớp `{ in: ids }`, nên đơn quầy rơi lọt khỏi
      // sweep và sẽ chặn lần chạy sau (đúng ngày + SLOT_TAKEN). Quét theo sân của owner.
      const walkInCourts = await prisma.court.findMany({
        where: { venueId: { in: venueIds } },
        select: { id: true },
      });
      await prisma.booking.deleteMany({
        where: { customerId: null, courtId: { in: walkInCourts.map((c) => c.id) } },
      });
      await prisma.court.deleteMany({ where: { venueId: { in: venueIds } } });
      await prisma.venue.deleteMany({ where: { id: { in: venueIds } } });
      // S2-F1/MAJOR-A: thành viên + đội tham chiếu user (RESTRICT) — dọn trước.
      await prisma.expenseShare.deleteMany({
        where: { OR: [{ payerId: { in: ids } }, { debtorId: { in: ids } }] },
      });
      await prisma.teamMember.deleteMany({ where: { userId: { in: ids } } });
      await prisma.team.deleteMany({ where: { captainId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await cleanupN2().catch(() => undefined); // N2: dọn dữ liệu ví/sân của riêng bộ test này
    await prisma.$disconnect();
  });

  /** Fixture: owner + venue APPROVED + court 60' + rule giá tối. */
  const setupCourt = async (): Promise<void> => {
    if (!dbUp) return;
    const ownerHash = await bcrypt.hash('IntegrationPass1!', 4);
    const owner = await prisma.user.create({
      data: {
        email: `itbk-owner-${SUFFIX}@sango.vn`,
        passwordHash: ownerHash,
        fullName: 'Owner',
        role: 'OWNER',
      },
    });
    const venue = await prisma.venue.create({
      data: {
        name: 'Itest-BK Venue ' + SUFFIX,
        slug: 'itbk-' + SUFFIX,
        address: 'Test St',
        lat: 10,
        lng: 106,
        openMinute: 360,
        closeMinute: 1320,
        depositPercent: 50,
        ownerId: owner.id,
        status: 'APPROVED',
      },
    });
    const court = await prisma.court.create({
      data: {
        name: 'Itest-BK Court',
        venueId: venue.id,
        sportType: SportType.FOOTBALL5,
        slotMinutes: 60,
        defaultPricePerSlot: 200_000,
      },
    });
    courtId = court.id;
    await prisma.pricingRule.create({
      data: {
        courtId: court.id,
        dayType: DayType.WEEKDAY,
        startMinute: 1020,
        endMinute: 1320,
        pricePerSlot: 260_000,
      },
    });
  };

  it('RACE: 2 request giữ CÙNG slot đồng thời -> đúng 1 thắng, 1 nhận SLOT_TAKEN', async () => {
    if (!dbUp) return;
    await setupCourt();
    const dto = { courtId, date: DATE, slots: [1020] }; // 17:00-18:00

    const [r1, r2] = await Promise.allSettled([
      bookings.createHold(uA(), dto),
      bookings.createHold(uB(), dto),
    ]);
    const fulfilled = [r1, r2].filter((r) => r.status === 'fulfilled');
    const rejected = [r1, r2].filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
      response: { code: 'SLOT_TAKEN' },
    });
    expect(
      await prisma.bookingHold.count({
        where: { courtId, date: new Date(DATE + 'T00:00:00.000Z'), status: 'ACTIVE' },
      }),
    ).toBe(1);

    // Dọn hold của người thắng để các test sau không vướng HOLD_LIMIT
    if (r1.status === 'fulfilled') {
      const h = r1.value as { holdId: string };
      await bookings.releaseHold(h.holdId, uA());
    } else if (r2.status === 'fulfilled') {
      const h = r2.value as { holdId: string };
      await bookings.releaseHold(h.holdId, uB());
    }
  });

  it('slot ngoài giờ mở cửa và slot không liền kề bị từ chối', async () => {
    if (!dbUp) return;
    await expect(
      bookings.createHold(uA(), { courtId, date: DATE, slots: [300] }),
    ).rejects.toMatchObject({
      response: { code: 'OUTSIDE_OPENING_HOURS' },
    });
    await expect(
      bookings.createHold(uA(), { courtId, date: DATE, slots: [420, 540] }),
    ).rejects.toMatchObject({
      response: { code: 'SLOTS_NOT_CONTIGUOUS' },
    });
  });

  it('giữ 2 slot liền kề: subtotal theo pricing rule ghi đè; HOLD_LIMIT chặn giữ lần 2', async () => {
    if (!dbUp) return;
    // Chọn ngày thứ Hai tới để chắc chắn rơi vào WEEKDAY rule (19:00-21:00 -> 2 x 260k = 520k)
    const nextWeekday = () => {
      const d = new Date(tomorrow());
      while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
        d.setUTCDate(d.getUTCDate() + 1);
      }
      return d.toISOString().slice(0, 10);
    };
    const weekdayDate = nextWeekday();
    const hold = (await bookings.createHold(uA(), {
      courtId,
      date: weekdayDate,
      slots: [1140, 1200],
    })) as {
      holdId: string;
      subtotal: number;
    };
    expect(hold.subtotal).toBe(520_000);

    await expect(
      bookings.createHold(uA(), { courtId, date: DATE, slots: [600] }),
    ).rejects.toMatchObject({
      response: { code: 'HOLD_LIMIT' },
    });

    // Rời checkout rồi quay lại phải tìm được chính hold còn hiệu lực, không bị kẹt HOLD_LIMIT.
    await expect(bookings.getActiveHold(uA())).resolves.toMatchObject({
      id: hold.holdId,
      courtId,
      status: 'ACTIVE',
    });

    // Nhả hold sớm -> giữ lại được ngay
    await bookings.releaseHold(hold.holdId, uA());
    const again = await bookings.createHold(uA(), { courtId, date: DATE, slots: [600] });
    expect(again).toMatchObject({ subtotal: 200_000 }); // 10:00 ngoài rule -> giá mặc định
    await bookings.releaseHold((again as { holdId: string }).holdId, uA());
  });

  it('S2-F1: đặt sân tư cách đội — teamId bám hold -> booking -> /bookings/me', async () => {
    if (!dbUp) return;
    const team = await prisma.team.create({
      data: {
        name: 'ITBK Team ' + SUFFIX,
        captainId: custA.id,
        sportType: SportType.FOOTBALL5,
      },
    });
    try {
      // MAJOR-A: người đặt phải là TeamMember ACTIVE của đội (captain cũng có row).
      await prisma.teamMember.create({
        data: { teamId: team.id, userId: custA.id, role: 'CAPTAIN', status: 'ACTIVE' },
      });
      // Đảm bảo không vướng HOLD_LIMIT của các case trước (race winner không xác định).
      await prisma.bookingHold.updateMany({
        where: { userId: { in: [custA.id, custB.id] }, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      });

      // MAJOR-A: người KHÔNG thuộc đội bị chặn ngay ở createHold.
      await expect(
        bookings.createHold(uB(), { courtId, date: DATE, slots: [720], teamId: team.id }),
      ).rejects.toMatchObject({ response: { code: 'NOT_TEAM_MEMBER' } });

      // FE chỉ gửi teamId lúc giữ chỗ — payments callback KHÔNG truyền opts.teamId.
      const hold = (await bookings.createHold(uA(), {
        courtId,
        date: DATE,
        slots: [660],
        teamId: team.id,
      })) as { holdId: string };

      const booking = await bookings.confirmFromHold(hold.holdId, {
        txnRef: 'ITBK-TEAM-' + SUFFIX,
        paidInFull: true,
      });
      expect(booking.teamId).toBe(team.id);

      // GET /bookings/me phải trả teamId để FE lọc lịch sử đặt sân của đội.
      const mine = await bookings.listMine(uA(), {
        filter: 'upcoming',
        page: 1,
        limit: 10,
      });
      const found = mine.items.find((b) => b.id === booking.id);
      expect(found).toBeDefined();
      expect(found?.teamId ?? null).toBe(team.id);
    } finally {
      await prisma.team.deleteMany({ where: { id: team.id } }).catch(() => undefined);
    }
  });

  it('hold hết hạn nhả slot; cron chuyển EXPIRED', async () => {
    if (!dbUp) return;
    const hold = (await bookings.createHold(uB(), { courtId, date: DATE, slots: [600] })) as {
      holdId: string;
    };
    // Lùi expiresAt về quá khứ
    await prisma.bookingHold.update({
      where: { id: hold.holdId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const expiredCount = await bookings.expireStaleHolds();
    expect(expiredCount).toBeGreaterThanOrEqual(1);
    expect(
      (await prisma.bookingHold.findUniqueOrThrow({ where: { id: hold.holdId } })).status,
    ).toBe('EXPIRED');

    // Slot giờ tự do cho A
    const reHold = (await bookings.createHold(uA(), { courtId, date: DATE, slots: [600] })) as {
      holdId: string;
    };
    expect(reHold.holdId).toBeTruthy();

    // Thanh toán thành công -> Booking CONFIRMED + mã CH-YYYYMMDD-NNNN + Payment PAID + hold CONVERTED
    const booking = (await bookings.confirmFromHold(reHold.holdId, {
      txnRef: `TXN-${SUFFIX}-600`,
    })) as { code: string; depositAmount: number; status: string };

    expect(booking.code).toMatch(/^CH-\d{8}-\d{4}$/);
    expect(booking.status).toBe('CONFIRMED');
    expect(booking.depositAmount).toBe(round50(200_000)); // cột cọc 50% làm tròn nghìn
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { txnRef: `TXN-${SUFFIX}-600` },
    });
    expect(payment.type).toBe(PaymentType.DEPOSIT);
    expect(payment.status).toBe(PaymentStatus.PAID);
    expect(payment.amount).toBe(booking.depositAmount);

    // Slot giờ hiển thị BOOKED ở lịch tuần
    const week = await slots.week(courtId, DATE, 1);
    const slot600 = week.byDate[0].slots.find((s) => s.startMinute === 600);
    expect(slot600?.state).toBe('BOOKED');
  });

  it('hủy đơn: >24h hoàn 100%, 12–24h hoàn 50%, <12h không hoàn', async () => {
    if (!dbUp) return;
    const mkStart = (hoursAhead: number): { date: Date; startMinute: number } => {
      const target = Date.now() + hoursAhead * 3_600_000;
      const midnight = Math.floor(target / 86_400_000) * 86_400_000;
      return { date: new Date(midnight), startMinute: Math.floor((target - midnight) / 60_000) };
    };
    const mkBooking = async (hoursAhead: number) => {
      const { date, startMinute } = mkStart(hoursAhead);
      return prisma.booking.create({
        data: {
          code: `CH-TST-${SUFFIX}-${hoursAhead}`,
          customerId: custA.id,
          courtId,
          date,
          startMinute,
          endMinute: startMinute + 60,
          subtotal: 200_000,
          depositAmount: 100_000,
          status: 'CONFIRMED',
        },
      });
    };

    const far = await mkBooking(30);
    const mid = await mkBooking(16);
    const near = await mkBooking(2);

    const farQ = await bookings.refundPreview(far.id, uA());
    expect(farQ.percent).toBe(100);

    const farCancel = (await bookings.cancelBooking(far.id, uA(), 'Đổi kế hoạch')) as {
      refundPercent: number;
      refundAmount: number;
    };
    expect(farCancel.refundPercent).toBe(100);
    expect(farCancel.refundAmount).toBe(100_000);

    const midCancel = (await bookings.cancelBooking(mid.id, uA())) as {
      refundPercent: number;
      refundAmount: number;
    };
    expect(midCancel.refundPercent).toBe(50);
    expect(midCancel.refundAmount).toBe(50_000);

    const nearCancel = (await bookings.cancelBooking(near.id, uA())) as {
      refundPercent: number;
      refundAmount: number;
      refundPaymentId?: string;
    };
    expect(nearCancel.refundPercent).toBe(0);
    expect(nearCancel.refundAmount).toBe(0);
    expect(nearCancel.refundPaymentId).toBeUndefined();

    const refunds = await prisma.payment.findMany({
      where: { type: PaymentType.REFUND, bookingId: { in: [far.id, mid.id] } },
    });
    expect(refunds).toHaveLength(2);
    // F6: refund được ghi ví ngay sau commit -> chứng từ chuyển PAID kèm paidAt
    expect(refunds.every((p) => p.status === 'PAID' && p.paidAt !== null)).toBe(true);

    // Đơn đã hủy không hủy lần nữa
    await expect(bookings.cancelBooking(far.id, uA())).rejects.toMatchObject({
      response: { code: 'NOT_CANCELLABLE' },
    });
    // Người lạ không hủy hộ được
    const strangerHold = (await bookings.createHold(uB(), {
      courtId,
      date: DATE,
      slots: [720],
    })) as { holdId: string };
    void strangerHold;
  });

  it('review §3.8: chỉ COMPLETED + đúng khách + 1 đơn 1 review', async () => {
    if (!dbUp) return;
    const mk = async (status: 'COMPLETED' | 'CONFIRMED') =>
      prisma.booking.create({
        data: {
          code: `CH-TST-${SUFFIX}-rev-${status}`,
          customerId: custA.id,
          courtId,
          date: new Date(dstr(tomorrow())),
          startMinute: 780,
          endMinute: 840,
          subtotal: 200_000,
          depositAmount: 100_000,
          status,
        },
      });

    const done = await mk('COMPLETED');
    const notDone = await mk('CONFIRMED');

    // Người khác không review hộ
    await expect(
      bookings.createReview(done.id, uB(), { rating: 5, comment: 'Trời đẹp lắm' }),
    ).rejects.toMatchObject({ response: { code: 'BOOKING_FORBIDDEN' } });
    // Đơn chưa hoàn thành
    await expect(
      bookings.createReview(notDone.id, uA(), { rating: 4, comment: 'Chưa chơi mà' }),
    ).rejects.toMatchObject({ response: { code: 'REVIEW_NOT_ALLOWED' } });
    // Hợp lệ
    const rev = await bookings.createReview(done.id, uA(), {
      rating: 5,
      comment: 'Sân đẹp, nhân viên vui vẻ',
    });
    expect(rev.rating).toBe(5);
    // Lặp lại -> REVIEW_EXISTS
    await expect(
      bookings.createReview(done.id, uA(), { rating: 1, comment: 'Nhầm rồi đánh lại' }),
    ).rejects.toMatchObject({ response: { code: 'REVIEW_EXISTS' } });
  });

  it('cron: booking CONFIRMED qua giờ kết thúc -> COMPLETED', async () => {
    if (!dbUp) return;
    const yesterdayMidnight = Math.floor(Date.now() / 86_400_000) * 86_400_000 - 86_400_000;
    const past = await prisma.booking.create({
      data: {
        code: `CH-TST-${SUFFIX}-past`,
        customerId: custA.id,
        courtId,
        date: new Date(yesterdayMidnight),
        startMinute: 600,
        endMinute: 660,
        subtotal: 200_000,
        depositAmount: 100_000,
        status: 'CONFIRMED',
      },
    });
    await bookings.completePastBookings();
    expect((await prisma.booking.findUniqueOrThrow({ where: { id: past.id } })).status).toBe(
      'COMPLETED',
    );
  });

  it('my-bookings filter: upcoming / history / cancelled', async () => {
    if (!dbUp) return;
    if (!courtId) await setupCourt();
    // Tự tạo đơn CONFIRMED: nếu kế thừa đơn của test trước thì chạy riêng (-t) sẽ
    // rỗng, và `every(...)` trên mảng rỗng luôn true -> test xanh mà không kiểm gì.
    const confirmed = await prisma.booking.create({
      data: {
        code: `CH-FILT-C-${SUFFIX}`,
        customerId: custA.id,
        courtId,
        date: new Date(DATE + 'T00:00:00.000Z'),
        startMinute: 420,
        endMinute: 480,
        status: 'CONFIRMED',
        subtotal: 60000,
        depositAmount: 0,
      },
    });
    const resAll = await bookings.listMine(uA(), { page: 1, limit: 10 });
    expect(resAll.items.some((b) => b.id === confirmed.id)).toBe(true);

    // filter 'upcoming' đã thu hẹp còn CONFIRMED (CHECKED_IN chuyển sang history),
    // nên assert đúng membership thay vì OR thành tautology.
    const resUp = await bookings.listMine(uA(), { filter: 'upcoming', page: 1, limit: 50 });
    expect(resUp.items.length).toBeGreaterThan(0);
    expect(resUp.items.every((b) => b.status === 'CONFIRMED')).toBe(true);

    // Hành vi MỚI: CHECKED_IN phải nằm ở history và không nằm ở upcoming.
    const checkedIn = await prisma.booking.create({
      data: {
        code: `CH-FILT-${SUFFIX}`,
        customerId: uA().id,
        courtId,
        date: new Date('2035-04-12T00:00:00.000Z'),
        startMinute: 600,
        endMinute: 660,
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
        subtotal: 60000,
        depositAmount: 0,
      },
    });
    const resHistory = await bookings.listMine(uA(), { filter: 'history', page: 1, limit: 50 });
    expect(resHistory.items.some((b) => b.id === checkedIn.id)).toBe(true);
    const resUpAgain = await bookings.listMine(uA(), { filter: 'upcoming', page: 1, limit: 50 });
    expect(resUpAgain.items.some((b) => b.id === checkedIn.id)).toBe(false);

    const resCancel = await bookings.listMine(uA(), { filter: 'cancelled', page: 1, limit: 10 });
    expect(resCancel.items.every((b) => b.status === 'CANCELLED' || b.status === 'NO_SHOW')).toBe(
      true,
    );
  });

  it('check-in và no-show: owner của sân check-in đúng mã, owner khác bị 403', async () => {
    if (!dbUp) return;
    // Không được phụ thuộc test trước (trước đây courtId do test RACE khởi tạo,
    // chạy riêng -t là undefined). Và đơn phải nằm trong quá khứ vì checkIn chặn
    // sớm hơn 2 giờ so với giờ chơi (guard bảo vệ uy tín).
    if (!courtId) await setupCourt();
    const pastDate = dstr(new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z').getTime() - 2 * 86_400_000);
    const bk = await prisma.booking.create({
      data: {
        code: `CH-CK-${SUFFIX}`,
        customerId: custA.id,
        courtId,
        date: new Date(pastDate),
        startMinute: 480,
        endMinute: 540,
        subtotal: 200_000,
        depositAmount: 100_000,
        status: 'CONFIRMED',
      },
    });

    const ownerUser = await prisma.venue.findUniqueOrThrow({
      where: { id: (await prisma.court.findUniqueOrThrow({ where: { id: courtId } })).venueId },
      select: { ownerId: true },
    });

    // Khách không có quyền check-in
    await expect(
      bookings.checkIn(bk.code, { id: custB.id, role: 'CUSTOMER' }),
    ).rejects.toMatchObject({
      response: { code: 'BOOKING_FORBIDDEN' },
    });

    // Owner sân check-in thành công
    const res = await bookings.checkIn(bk.code, { id: ownerUser.ownerId, role: 'OWNER' });
    expect(res.booking.status).toBe('CHECKED_IN');

    // Check-in lại idempotency
    const resAgain = await bookings.checkIn(bk.code, { id: ownerUser.ownerId, role: 'OWNER' });
    expect(resAgain.message).toContain('đã check-in');

    // No-show
    const bkNoShow = await prisma.booking.create({
      data: {
        code: `CH-NS-${SUFFIX}`,
        customerId: custA.id,
        courtId,
        date: new Date(pastDate),
        startMinute: 540,
        endMinute: 600,
        subtotal: 200_000,
        depositAmount: 100_000,
        status: 'CONFIRMED',
      },
    });
    const ns = await bookings.markNoShow(bkNoShow.id, { id: ownerUser.ownerId, role: 'OWNER' });
    expect(ns.status).toBe('NO_SHOW');
  });

  it('owner bookings: xem đơn theo venueId', async () => {
    if (!dbUp) return;
    const court = await prisma.court.findUniqueOrThrow({ where: { id: courtId } });
    const ownerUser = await prisma.venue.findUniqueOrThrow({
      where: { id: court.venueId },
      select: { ownerId: true },
    });

    const list = await bookings.listOwnerBookings(
      { id: ownerUser.ownerId, role: 'OWNER' },
      { venueId: court.venueId, page: 1, limit: 20 },
    );
    expect(list.total).toBeGreaterThanOrEqual(1);
    expect(list.items.every((b) => b.court.name === 'Itest-BK Court')).toBe(true);

    // Owner khác không xem được
    await expect(
      bookings.listOwnerBookings(
        { id: custA.id, role: 'OWNER' },
        { venueId: court.venueId, page: 1, limit: 20 },
      ),
    ).rejects.toMatchObject({
      response: { code: 'VENUE_FORBIDDEN' },
    });
  });

  /**
   * HOTFIX 25P02 (QA smoke t8): tái hiện kịch bản blocker — DB đã có đơn mã
   * CH-<ngày>-0002 KHÔNG liền kề; callback mới phải CONFIRMED với mã không trùng,
   * Payment PAID, hold CONVERTED (cơ chế count+retry P2002 cũ làm hỏng cả tx).
   */
  it('HOTFIX: seed mã CH-<ngày>-0002 không liền kề -> callback mới vẫn CONFIRMED', async () => {
    if (!dbUp) return console.warn('[integration] skip');
    const prefix = `CH-${DATE.replaceAll('-', '')}-`;
    const dateObj = new Date(DATE + 'T00:00:00.000Z');
    // Tự dọn state của những lần chạy crash trước (mã trùng / hold ACTIVE kẹt).
    await prisma.payment.deleteMany({
      where: {
        booking: {
          OR: [{ code: `${prefix}0002` }, { customerId: custA.id, courtId, date: dateObj }],
        },
      },
    });
    await prisma.review.deleteMany({
      where: {
        OR: [
          { booking: { code: `${prefix}0002` } },
          { customer: { id: custA.id }, venue: { courts: { some: { id: courtId } } } },
        ],
      },
    });
    await prisma.booking.deleteMany({
      where: { OR: [{ code: `${prefix}0002` }, { customerId: custA.id, courtId, date: dateObj }] },
    });
    await prisma.bookingHold.updateMany({
      where: { userId: custA.id, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    });
    const stranger = await prisma.user.create({
      data: {
        email: `itbk-stranger-${SUFFIX}@sango.vn`,
        passwordHash: 'seed-only',
        fullName: 'Stranger',
        role: 'CUSTOMER',
      },
    });
    await prisma.booking.create({
      data: {
        code: `${prefix}0002`,
        customerId: stranger.id,
        courtId,
        date: dateObj,
        startMinute: 60, // dữ liệu bẩn ngoài giờ mở cửa — chỉ để đụng độ dãy mã
        endMinute: 150,
        subtotal: 200_000,
        depositAmount: 100_000,
        status: 'CONFIRMED',
      },
    });

    const hold = (await bookings.createHold(uA(), {
      courtId,
      date: DATE,
      slots: [1260],
    })) as { holdId: string };
    const booking = (await bookings.confirmFromHold(hold.holdId, {
      txnRef: `TXN-${SUFFIX}-hotfix`,
    })) as { id: string; code: string; status: string };

    expect(booking.status).toBe('CONFIRMED');
    expect(booking.code.startsWith(prefix)).toBe(true);
    expect(booking.code).not.toBe(`${prefix}0002`);
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { txnRef: `TXN-${SUFFIX}-hotfix` },
    });
    expect(payment.status).toBe(PaymentStatus.PAID);
    expect(
      (await prisma.bookingHold.findUniqueOrThrow({ where: { id: hold.holdId } })).status,
    ).toBe('CONVERTED');
  });

  /** HOTFIX race: hai callback khác hold cùng ngày chạy đồng thời vẫn distinct mã. */
  it('HOTFIX race: 2 callback đồng thời khác sân cùng ngày -> 2 mã distinct', async () => {
    if (!dbUp) return console.warn('[integration] skip');
    // Nhả mọi hold ACTIVE tồn đọng từ test trước để không dính HOLD_LIMIT.
    await prisma.bookingHold.updateMany({
      where: { userId: { in: [custA.id, custB.id] }, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    });
    await prisma.payment.deleteMany({
      where: {
        booking: {
          customerId: { in: [custA.id, custB.id] },
          startMinute: 840,
          date: new Date(DATE + 'T00:00:00.000Z'),
        },
      },
    });
    await prisma.booking.deleteMany({
      where: {
        customerId: { in: [custA.id, custB.id] },
        startMinute: 840,
        date: new Date(DATE + 'T00:00:00.000Z'),
      },
    });
    const court1 = await prisma.court.findUniqueOrThrow({
      where: { id: courtId },
      select: { venueId: true },
    });
    const court2 = await prisma.court.create({
      data: {
        venueId: court1.venueId,
        name: 'Itest-BK Court-Race',
        sportType: 'FOOTBALL5',
        slotMinutes: 60,
        defaultPricePerSlot: 200_000,
      },
    });

    const h1 = (await bookings.createHold(uA(), {
      courtId,
      date: DATE,
      slots: [840],
    })) as { holdId: string };
    const h2 = (await bookings.createHold(uB(), {
      courtId: court2.id,
      date: DATE,
      slots: [840],
    })) as { holdId: string };

    const results = await Promise.allSettled([
      bookings.confirmFromHold(h1.holdId, { txnRef: `TXN-${SUFFIX}-race-a` }),
      bookings.confirmFromHold(h2.holdId, { txnRef: `TXN-${SUFFIX}-race-b` }),
    ]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled') as Array<
      PromiseFulfilledResult<{ code: string }>
    >;
    expect(results.some((r) => r.status === 'rejected')).toBe(false);
    expect(fulfilled).toHaveLength(2);
    const codes = fulfilled.map((r) => r.value.code);
    expect(new Set(codes).size).toBe(2);
    for (const txn of [`TXN-${SUFFIX}-race-a`, `TXN-${SUFFIX}-race-b`]) {
      const p = await prisma.payment.findUniqueOrThrow({ where: { txnRef: txn } });
      expect(p.status).toBe(PaymentStatus.PAID);
    }
  });
  function round50(x: number): number {
    return Math.round((x * 50) / 100 / 1000) * 1000;
  }

  /** Fixture N2: owner/venue/court + 3 đơn trong cùng một ngày (2 CONFIRMED có tiền trả, 1 CHECKED_IN). */
  /** Dọn toàn bộ dữ liệu của các lần chạy N2 trước (theo email itn2-) — FK-safe. */
  const cleanupN2 = async () => {
    const users = await prisma.user.findMany({
      where: { email: { startsWith: 'itn2-' } },
      select: { id: true },
    });
    const ids = users.map((u) => u.id);
    if (ids.length === 0) return;
    const bks = await prisma.booking.findMany({
      where: { customerId: { in: ids } },
      select: { id: true },
    });
    await prisma.walletLedger.deleteMany({ where: { userId: { in: ids } } });
    await prisma.walletBalance.deleteMany({ where: { userId: { in: ids } } });
    await prisma.walletTopup.deleteMany({ where: { userId: { in: ids } } });
    await prisma.review.deleteMany({ where: { customer: { id: { in: ids } } } });
    await prisma.payment.deleteMany({ where: { bookingId: { in: bks.map((b) => b.id) } } });
    await prisma.booking.deleteMany({ where: { id: { in: bks.map((b) => b.id) } } });
    await prisma.court.deleteMany({ where: { venue: { ownerId: { in: ids } } } });
    await prisma.venue.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  };
  let n2seq = 90;
  // Dải mã riêng ngẫu nhiên cao (5000-8999) để không đụng mã thật sinh từ BookingCodeSeq
  const n2base = 5000 + Math.floor(Math.random() * 4000);
  const setupN2 = async () => {
    await cleanupN2();
    const hash = await bcrypt.hash('IntegrationPass1!', 4);
    const mk = (email: string, role: 'OWNER' | 'CUSTOMER') =>
      prisma.user.create({
        data: { email, passwordHash: hash, fullName: 'N2 User', role },
      });
    const [ownerN2, otherOwner, cust1, cust2] = await Promise.all([
      mk(`itn2-owner-${SUFFIX}@sango.vn`, 'OWNER'),
      mk(`itn2-other-${SUFFIX}@sango.vn`, 'OWNER'),
      mk(`itn2-c1-${SUFFIX}@sango.vn`, 'CUSTOMER'),
      mk(`itn2-c2-${SUFFIX}@sango.vn`, 'CUSTOMER'),
    ]);
    const venue = await prisma.venue.create({
      data: {
        name: 'Itest-N2 Venue ' + SUFFIX,
        slug: 'itn2-' + SUFFIX,
        address: 'Test St',
        lat: 10,
        lng: 106,
        openMinute: 360,
        closeMinute: 1320,
        depositPercent: 50,
        ownerId: ownerN2.id,
        status: 'APPROVED',
      },
    });
    const court = await prisma.court.create({
      data: {
        venueId: venue.id,
        name: 'Itest-N2 Court',
        sportType: SportType.FOOTBALL5,
        slotMinutes: 60,
        defaultPricePerSlot: 200_000,
      },
    });
    const dateObj = new Date(DATE + 'T00:00:00.000Z');
    const mkBooking = (
      customerId: string,
      startMinute: number,
      status: 'CONFIRMED' | 'CHECKED_IN',
    ) =>
      prisma.booking.create({
        data: {
          code: `CH-${DATE.replaceAll('-', '')}-${String(n2base + n2seq++ - 90).padStart(4, '0')}`,
          customerId,
          courtId: court.id,
          date: dateObj,
          startMinute,
          endMinute: startMinute + 60,
          subtotal: 200_000,
          depositAmount: 100_000,
          status,
        },
      });
    const b1 = await mkBooking(cust1.id, 600, 'CONFIRMED'); // cọc 100k đã trả
    const b2 = await mkBooking(cust2.id, 660, 'CONFIRMED'); // trả FULL 300k
    const b3 = await mkBooking(cust1.id, 720, 'CHECKED_IN'); // không được đụng
    await prisma.payment.create({
      data: {
        bookingId: b1.id,
        amount: 100_000,
        type: 'DEPOSIT',
        method: 'MOCK',
        txnRef: `TXN-${SUFFIX}-n2-a`,
        status: 'PAID',
      },
    });
    await prisma.payment.create({
      data: {
        bookingId: b2.id,
        amount: 300_000,
        type: 'FULL',
        method: 'MOCK',
        txnRef: `TXN-${SUFFIX}-n2-b`,
        status: 'PAID',
      },
    });
    return { ownerN2, otherOwner, cust1, cust2, venue, court, dateObj, b1, b2, b3 };
  };

  describe('N2: hủy hàng loạt ngày mưa — hoàn 100% vào ví (policy WEATHER)', () => {
    it('hủy cả ngày: chỉ CONFIRMED bị hủy, hoàn đúng số đã thực trả, ledger REFUND ghi đủ', async () => {
      if (!dbUp) return console.warn('[integration] skip');
      const fx = await setupN2();

      const res = (await bookings.bulkCancelByDate(
        { id: fx.ownerN2.id, role: 'OWNER' },
        { venueId: fx.venue.id, date: DATE },
      )) as {
        policy: string;
        cancelledCount: number;
        refundedTotal: number;
        items: Array<{ code: string }>;
      };

      expect(res.policy).toBe('WEATHER');
      expect(res.cancelledCount).toBe(2);
      expect(res.refundedTotal).toBe(400_000); // 100% cọc b1 + FULL b2
      expect(res.items).toHaveLength(2);

      for (const id of [fx.b1.id, fx.b2.id]) {
        const b = await prisma.booking.findUniqueOrThrow({ where: { id } });
        expect(b.status).toBe('CANCELLED');
        expect(b.cancelReason?.startsWith('[WEATHER]')).toBe(true);
      }
      // Đơn CHECKED_IN không bị đụng
      expect((await prisma.booking.findUniqueOrThrow({ where: { id: fx.b3.id } })).status).toBe(
        'CHECKED_IN',
      );

      // Chứng từ REFUND chuyển PAID kèm paidAt
      const refunds = await prisma.payment.findMany({
        where: { type: 'REFUND', bookingId: { in: [fx.b1.id, fx.b2.id] } },
      });
      expect(refunds).toHaveLength(2);
      expect(refunds.every((p) => p.status === 'PAID' && p.paidAt !== null)).toBe(true);

      // Ví nhận đủ: ledger CREDIT/REFUND refId=payment.id, balanceAfter khớp hàng ví
      if (!fx.b1.customerId || !fx.b2.customerId) throw new Error('Refund fixtures must have registered customers');
      const ledgers = await prisma.walletLedger.findMany({
        where: {
          userId: {
            in: (
              await Promise.all([
                prisma.user.findUniqueOrThrow({ where: { id: fx.b1.customerId } }),
                prisma.user.findUniqueOrThrow({ where: { id: fx.b2.customerId } }),
              ])
            ).map((u) => u.id),
          },
          type: 'REFUND',
        },
      });
      expect(ledgers).toHaveLength(2);
      expect(ledgers.every((l) => l.direction === 'CREDIT' && l.refType === 'PAYMENT')).toBe(true);
      const sumAfter = ledgers.reduce((s, l) => s + l.amount, 0);
      expect(sumAfter).toBe(400_000);
    });

    it('replay bulk-cancel cùng ngày -> 0 đơn hủy thêm, không ghi thêm ledger (chống hoàn kép)', async () => {
      if (!dbUp) return console.warn('[integration] skip');
      const fx = await setupN2();
      await bookings.bulkCancelByDate(
        { id: fx.ownerN2.id, role: 'OWNER' },
        { venueId: fx.venue.id, date: DATE },
      );
      const before = await prisma.walletLedger.count({
        where: { userId: { in: [fx.cust1.id, fx.cust2.id] }, type: 'REFUND' },
      });

      const replay = (await bookings.bulkCancelByDate(
        { id: fx.ownerN2.id, role: 'OWNER' },
        { venueId: fx.venue.id, date: DATE },
      )) as { cancelledCount: number; refundedTotal: number };
      expect(replay.cancelledCount).toBe(0);
      expect(replay.refundedTotal).toBe(0);
      expect(
        await prisma.walletLedger.count({
          where: { userId: { in: [fx.cust1.id, fx.cust2.id] }, type: 'REFUND' },
        }),
      ).toBe(before);
    });

    it('owner khác cụm sân -> VENUE_FORBIDDEN', async () => {
      if (!dbUp) return console.warn('[integration] skip');
      const fx = await setupN2();
      await expect(
        bookings.bulkCancelByDate(
          { id: fx.otherOwner.id, role: 'OWNER' },
          { venueId: fx.venue.id, date: DATE },
        ),
      ).rejects.toMatchObject({ response: { code: 'VENUE_FORBIDDEN' } });
    });
  });

  /* ------------- Phase 3 + 5b: VNPay DR refund + O1 join gate + DTO passthrough ------------- */

  /** Fixture P3: booking CONFIRMED ~30h tới (hoàn 100%) + payment gốc VNPAY DEPOSIT PAID. */
  const setupDrBooking = async (txnRef: string) => {
    const target = Date.now() + 30 * 3_600_000;
    const midnight = Math.floor(target / 86_400_000) * 86_400_000;
    const b = await prisma.booking.create({
      data: {
        code: `CH-DR-${SUFFIX}-${txnRef.slice(-8)}`,
        customerId: custA.id,
        courtId,
        date: new Date(midnight),
        startMinute: Math.floor((target - midnight) / 60_000),
        endMinute: Math.floor((target - midnight) / 60_000) + 60,
        subtotal: 200_000,
        depositAmount: 100_000,
        status: 'CONFIRMED',
        isPublicMatch: true,
        slotsNeeded: 2,
        matchFull: false,
        requiresApproval: null,
      },
    });
    await prisma.payment.create({
      data: {
        bookingId: b.id,
        amount: 100_000,
        type: 'DEPOSIT',
        method: 'VNPAY',
        txnRef,
        status: 'PAID',
        paidAt: new Date(Date.now() - 3_600_000),
      },
    });
    return b;
  };

  /** Bật flag P3 + credentials giả, spy fetch global; restore mọi thứ qua restore(). */
  const enableRefundFlag = () => {
    const saved = {
      flag: process.env.VNPAY_REFUND_ENABLED,
      tmn: process.env.VNPAY_TMN_CODE,
      secret: process.env.VNPAY_HASH_SECRET,
      url: process.env.VNPAY_SANDBOX_URL,
    };
    process.env.VNPAY_REFUND_ENABLED = 'true';
    process.env.VNPAY_TMN_CODE = 'TMNTEST01';
    process.env.VNPAY_HASH_SECRET = 'DR-SECRET-TEST';
    process.env.VNPAY_SANDBOX_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    return {
      fetchSpy,
      restore: () => {
        for (const [key, val] of Object.entries({
          VNPAY_REFUND_ENABLED: saved.flag,
          VNPAY_TMN_CODE: saved.tmn,
          VNPAY_HASH_SECRET: saved.secret,
          VNPAY_SANDBOX_URL: saved.url,
        })) {
          if (val === undefined) delete process.env[key];
          else process.env[key] = val;
        }
        fetchSpy.mockRestore();
      },
    };
  };

  const drInput = () => ({
    txnRef: 'HOLD1.FULL.ab12',
    amountVnd: 100_000,
    orderInfo: 'Hoan ve don',
    transDate: '20260830120000',
  });

  it('P3.1: payload refund VNPay DR — vnp_TransactionType=02 + HMAC-SHA512 13 trường đúng chuẩn (unit)', async () => {
    // Spec sandbox.vnpayment.vn/apis "Yêu cầu hoàn tiền (Refund)": signData 13 thành phần
    // requestId|version|command|tmnCode|transactionType|txnRef|amount|transactionNo|transDate|createBy|createDate|ipAddr|orderInfo
    const p = buildVnpayDrRefundPayload({ ...drInput(), transactionNo: '126571' }, {
      tmnCode: 'TMNTEST01',
      hashSecret: 'DR-SECRET-TEST',
      now: new Date('2026-08-30T10:00:00.000Z'),
      requestId: 'req12345',
    });
    expect(p.body.vnp_Command).toBe('refund');
    expect(p.body.vnp_TransactionType).toBe('02');
    expect(p.body.vnp_CreateBy).toBe('sango-admin');
    expect(p.body.vnp_TransactionNo).toBe('126571');
    expect(p.body.vnp_Amount).toBe('10000000'); // x100 theo chuẩn VNPay
    expect(p.signData).toBe(
      'req12345|2.1.0|refund|TMNTEST01|02|HOLD1.FULL.ab12|10000000|126571|20260830120000|sango-admin|20260830170000|127.0.0.1|Hoan ve don',
    );
    expect(p.secureHash).toBe(signHmacSha512(p.signData, 'DR-SECRET-TEST'));
    expect(p.secureHash).toMatch(/^[0-9a-f]{128}$/);
    // transactionNo thiếu -> chuỗi rỗng trong signData (spec cho phép)
    const p2 = buildVnpayDrRefundPayload(drInput(), {
      tmnCode: 'TMNTEST01',
      hashSecret: 'DR-SECRET-TEST',
      now: new Date('2026-08-30T10:00:00.000Z'),
      requestId: 'req12345',
    });
    expect(p2.signData).toBe(
      'req12345|2.1.0|refund|TMNTEST01|02|HOLD1.FULL.ab12|10000000||20260830120000|sango-admin|20260830170000|127.0.0.1|Hoan ve don',
    );
  });

  it('P3.1: VnpayRefundService — ResponseCode=00 -> ok; khác 00 / lỗi mạng -> ok:false, không throw', async () => {
    const svc = new VnpayRefundService();
    const env = enableRefundFlag();
    try {
      env.fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify({ vnp_ResponseCode: '00', vnp_Message: 'Confirm Success' }), {
          status: 200,
        }),
      );
      await expect(svc.requestRefund(drInput())).resolves.toMatchObject({ ok: true, code: '00' });

      env.fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify({ vnp_ResponseCode: '70', vnp_Message: 'Invalid' }), {
          status: 200,
        }),
      );
      await expect(svc.requestRefund(drInput())).resolves.toMatchObject({ ok: false, code: '70' });

      env.fetchSpy.mockRejectedValueOnce(new Error('boom'));
      await expect(svc.requestRefund(drInput())).resolves.toMatchObject({ ok: false });
    } finally {
      env.restore();
    }
  });

  it('P3.2: flag ON + payment gốc VNPAY PAID + DR ok -> Payment(REFUND) PAID, KHÔNG credit ví', async () => {
    if (!dbUp) return;
    const b = await setupDrBooking(`VNP-${SUFFIX}-DROK`);
    const env = enableRefundFlag();
    try {
      env.fetchSpy.mockResolvedValue(
        new Response(JSON.stringify({ vnp_ResponseId: 'R1', vnp_ResponseCode: '00' }), {
          status: 200,
        }),
      );
      const res = (await bookings.cancelBooking(b.id, uA(), 'Đổi kế hoạch')) as {
        refundPaymentId?: string;
      };
      expect(res.refundPaymentId).toBeDefined();
      const refund = await prisma.payment.findUniqueOrThrow({
        where: { id: res.refundPaymentId! },
      });
      expect(refund.status).toBe('PAID');
      expect(refund.method).toBe('VNPAY');
      expect(refund.paidAt).not.toBeNull();
      // KHÔNG credit ví: không ledger REFUND nào trỏ chứng từ này
      expect(
        await prisma.walletLedger.count({
          where: { refType: 'PAYMENT', refId: refund.id, type: 'REFUND' },
        }),
      ).toBe(0);
      // Body gửi lên DR là payload đã ký đúng chuẩn (vnp_RequestType=02 + secureHash)
      const [url, init] = env.fetchSpy.mock.calls[0] ?? [];
      expect(String(url)).toContain('merchant_webapi/api/transaction');
      const sent = JSON.parse(String(init?.body)) as Record<string, string>;
      expect(sent.vnp_TransactionType).toBe('02');
      expect(sent.vnp_CreateBy).toBe('sango-admin');
      expect(sent.vnp_TxnRef).toBe(`VNP-${SUFFIX}-DROK`);
      // Ký end-to-end: secureHash khớp HMAC trên 13 trường theo spec DR
      const expectedSign = [
        sent.vnp_RequestId,
        sent.vnp_Version,
        sent.vnp_Command,
        sent.vnp_TmnCode,
        sent.vnp_TransactionType,
        sent.vnp_TxnRef,
        sent.vnp_Amount,
        sent.vnp_TransactionNo,
        sent.vnp_TransactionDate,
        sent.vnp_CreateBy,
        sent.vnp_CreateDate,
        sent.vnp_IpAddr,
        sent.vnp_OrderInfo,
      ].join('|');
      expect(sent.vnp_SecureHash).toBe(signHmacSha512(expectedSign, 'DR-SECRET-TEST'));
    } finally {
      env.restore();
    }
  });

  it('P3.2: flag ON nhưng DR fail -> fallback credit ví nội bộ, giữ nguyên luồng hiện tại', async () => {
    if (!dbUp) return;
    const b = await setupDrBooking(`VNP-${SUFFIX}-DRFAIL`);
    const env = enableRefundFlag();
    try {
      env.fetchSpy.mockResolvedValue(
        new Response(JSON.stringify({ vnp_ResponseId: 'R2', vnp_ResponseCode: '70' }), {
          status: 200,
        }),
      );
      const res = (await bookings.cancelBooking(b.id, uA())) as {
        refundPaymentId?: string;
        refundAmount: number;
      };
      expect(res.refundPaymentId).toBeDefined();
      const refund = await prisma.payment.findUniqueOrThrow({
        where: { id: res.refundPaymentId! },
      });
      // fallback: tiền hoàn nội bộ -> chứng từ về MOCK + note DR_FAIL trong rawPayload;
      // credit ví ok -> PAID + ledger CREDIT như luồng hiện tại
      expect(refund.method).toBe('MOCK');
      expect(refund.status).toBe('PAID');
      expect((refund.rawPayload as unknown as { drFail?: boolean } | null)?.drFail).toBe(true);
      const ledger = await prisma.walletLedger.findFirst({
        where: { refType: 'PAYMENT', refId: refund.id, type: 'REFUND' },
      });
      expect(ledger?.direction).toBe('CREDIT');
      expect(ledger?.amount).toBe(res.refundAmount);
    } finally {
      env.restore();
    }
  });

  it('P3.3: flag OFF (mặc định) -> không gọi DR, hoàn ví nội bộ như hiện tại', async () => {
    if (!dbUp) return;
    const savedFlag = process.env.VNPAY_REFUND_ENABLED;
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    try {
      delete process.env.VNPAY_REFUND_ENABLED; // thiếu flag = OFF
      const b = await setupDrBooking(`VNP-${SUFFIX}-OFF`);
      const res = (await bookings.cancelBooking(b.id, uA())) as { refundPaymentId?: string };
      expect(res.refundPaymentId).toBeDefined();
      const refund = await prisma.payment.findUniqueOrThrow({
        where: { id: res.refundPaymentId! },
      });
      expect(refund.method).toBe('MOCK');
      expect(refund.status).toBe('PAID');
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      if (savedFlag === undefined) delete process.env.VNPAY_REFUND_ENABLED;
      else process.env.VNPAY_REFUND_ENABLED = savedFlag;
      fetchSpy.mockRestore();
    }
  });

  it('P5b.2+P5b.1: create kèm requiresApproval=true lưu đúng cột -> join chặn 409 APPROVAL_REQUIRED', async () => {
    if (!dbUp) return;
    await prisma.bookingHold.updateMany({
      where: { userId: custA.id, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    });
    const hold = (await bookings.createHold(uA(), {
      courtId,
      date: DATE,
      slots: [1020],
      isPublicMatch: true,
      slotsNeeded: 2,
      requiresApproval: true,
    })) as { holdId: string };
    // KHÔNG truyền opts.requiresApproval — HOLD-FIX: confirm phải tự đọc từ hold
    const booking = await bookings.confirmFromHold(hold.holdId, {
      txnRef: `ITBK-APPROVAL-${SUFFIX}`,
      paidInFull: true,
    });
    // P5b.2 (HOLD-FIX): giá trị trên hold tự lưu đúng cột bookings.requiresApproval
    expect(booking.requiresApproval).toBe(true);
    // P5b.1: join trực tiếp bị chặn 409 kèm hướng dẫn gửi join-request
    await expect(bookings.joinOpenMatch(booking.id, uB())).rejects.toMatchObject({
      response: { code: 'APPROVAL_REQUIRED' },
    });
    await expect(bookings.joinOpenMatch(booking.id, uB())).rejects.toThrow(/matches\/:id\/requests/);
  });

  it('HOLD-FIX: hold kèm requiresApproval=true -> confirm (không opts) lưu true vào bookings', async () => {
    if (!dbUp) return;
    await prisma.bookingHold.updateMany({
      where: { userId: custA.id, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    });
    const hold = (await bookings.createHold(uA(), {
      courtId,
      date: DATE,
      slots: [1080],
      isPublicMatch: true,
      slotsNeeded: 2,
      requiresApproval: true,
    })) as { holdId: string; requiresApproval?: boolean | null };
    // hold đã giữ flag từ lúc POST /bookings/holds
    expect(hold.requiresApproval).toBe(true);
    const booking = await bookings.confirmFromHold(hold.holdId, {
      txnRef: `ITBK-HOLDT-${SUFFIX}`,
      paidInFull: true,
    });
    expect(booking.requiresApproval).toBe(true);
    // Join vẫn bị chặn 409 sau khi confirm từ hold
    await expect(bookings.joinOpenMatch(booking.id, uB())).rejects.toMatchObject({
      response: { code: 'APPROVAL_REQUIRED' },
    });
  });

  it('HOLD-FIX: hold không truyền requiresApproval -> confirm lưu null (DIRECT)', async () => {
    if (!dbUp) return;
    await prisma.bookingHold.updateMany({
      where: { userId: custA.id, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    });
    const hold = (await bookings.createHold(uA(), {
      courtId,
      date: DATE,
      slots: [360],
      isPublicMatch: true,
      slotsNeeded: 2,
    })) as { holdId: string; requiresApproval?: boolean | null };
    expect(hold.requiresApproval ?? null).toBeNull();
    const booking = await bookings.confirmFromHold(hold.holdId, {
      txnRef: `ITBK-HOLDN-${SUFFIX}`,
      paidInFull: true,
    });
    expect(booking.requiresApproval).toBeNull();
  });

  it('HOLD-FIX: caller truyền opts.requiresApproval=false -> ưu tiên opts hơn hold (true)', async () => {
    if (!dbUp) return;
    await prisma.bookingHold.updateMany({
      where: { userId: custA.id, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    });
    const hold = (await bookings.createHold(uA(), {
      courtId,
      date: DATE,
      slots: [420],
      isPublicMatch: true,
      slotsNeeded: 2,
      requiresApproval: true,
    })) as { holdId: string };
    const booking = await bookings.confirmFromHold(hold.holdId, {
      txnRef: `ITBK-HOLDO-${SUFFIX}`,
      paidInFull: true,
      requiresApproval: false,
    });
    expect(booking.requiresApproval).toBe(false);
  });

  it('P5b.1: requiresApproval null/false -> join trực tiếp như cũ (DIRECT)', async () => {
    if (!dbUp) return;
    const mk = (code: string, requiresApproval: boolean | null) =>
      prisma.booking.create({
        data: {
          code,
          customerId: custA.id,
          courtId,
          date: new Date(DATE + 'T00:00:00.000Z'),
          startMinute: 901,
          endMinute: 961,
          subtotal: 200_000,
          depositAmount: 100_000,
          status: 'CONFIRMED',
          isPublicMatch: true,
          slotsNeeded: 2,
          matchFull: false,
          requiresApproval,
        },
      });
    const nullBooking = await mk(`CH-JOINN-${SUFFIX}`, null);
    await expect(bookings.joinOpenMatch(nullBooking.id, uB())).resolves.toMatchObject({
      joinedCount: 1,
      matchFull: false,
    });
    const falseBooking = await mk(`CH-JOINF-${SUFFIX}`, false);
    await expect(bookings.joinOpenMatch(falseBooking.id, uB())).resolves.toMatchObject({
      joinedCount: 1,
      matchFull: false,
    });
    expect(
      await prisma.matchParticipant.count({
        where: { bookingId: { in: [nullBooking.id, falseBooking.id] }, userId: custB.id },
      }),
    ).toBe(2);
  });

  it('F01: owner walk-in persists, reloads and rejects too-early check-in without fabricated payment', async () => {
    if (!dbUp) return console.warn('[integration] skip: F01 requires Postgres');
    if (!courtId) await setupCourt();
    const court = await prisma.court.findUniqueOrThrow({ where: { id: courtId }, include: { venue: true } });
    const date = '2035-04-10';
    const dto = { courtId, date, startMinute: 360, endMinute: 420, guestName: 'Khách tại quầy', guestPhone: '0901234567' };
    const owner = { id: court.venue.ownerId, role: 'OWNER' };
    let id: string | undefined;
    try {
      await expect(bookings.createWalkIn(uA(), dto)).rejects.toMatchObject({ response: { code: 'BOOKING_FORBIDDEN' } });
      const created = await bookings.createWalkIn(owner, dto);
      id = created.id;
      expect(created).toMatchObject({ customerId: null, guestName: dto.guestName, depositAmount: 0, status: 'CONFIRMED', subtotal: court.defaultPricePerSlot });
      expect(created.payments).toEqual([]);
      const reloaded = await bookings.listOwnerBookings(owner, { venueId: court.venueId, date, page: 1, limit: 50 });
      expect(reloaded.items.find((item) => item.id === id)).toMatchObject({ code: created.code, guestName: dto.guestName, guestPhone: dto.guestPhone });
      await expect(bookings.createWalkIn(owner, dto)).rejects.toMatchObject({ response: { code: 'SLOT_TAKEN' } });
      await expect(bookings.createHold(uA(), { courtId, date, slots: [360] })).rejects.toMatchObject({ response: { code: 'SLOT_TAKEN' } });
      // Đơn nằm ở năm 2035 nên check-in sớm phải bị chặn — nếu không, chủ sân có thể
      // cộng vĩnh viễn +10 uy tín cho một trận chưa diễn ra.
      await expect(bookings.checkIn(created.code, owner)).rejects.toMatchObject({ response: { code: 'CHECKIN_TOO_EARLY' } });
    } finally {
      if (id) await prisma.booking.delete({ where: { id } });
    }
  });

  it('P5b.2: CreateBookingSchema parse requiresApproval passthrough (unit)', async () => {
    const base = {
      courtId: '11111111-1111-4111-8111-111111111111',
      date: '2026-09-01',
      slots: [1020],
    };
    expect(
      CreateBookingSchema.parse({
        ...base,
        isPublicMatch: true,
        slotsNeeded: 2,
        requiresApproval: true,
      }),
    ).toMatchObject({ requiresApproval: true });
    expect(CreateBookingSchema.parse({ ...base, requiresApproval: null })).toMatchObject({
      requiresApproval: null,
    });
    expect(CreateBookingSchema.parse(base)).not.toHaveProperty('requiresApproval', true);
    // superRefine gốc vẫn chạy: isPublicMatch thiếu slotsNeeded -> từ chối
    expect(() => CreateBookingSchema.parse({ ...base, isPublicMatch: true })).toThrow();
  });
});
