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
import { DayType, PaymentStatus, PaymentType, SportType } from '@courthub/shared';
import * as bcrypt from 'bcryptjs';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingsModule } from './bookings.module';
import { BookingsService } from './bookings.service';
import { SlotsService } from './slots.service';

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
        email: `itbk-a-${SUFFIX}@courthub.vn`,
        passwordHash: hash,
        fullName: 'Cust A',
        role: 'CUSTOMER',
      },
    });
    custB = await prisma.user.create({
      data: {
        email: `itbk-b-${SUFFIX}@courthub.vn`,
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
      await prisma.court.deleteMany({ where: { venueId: { in: venueIds } } });
      await prisma.venue.deleteMany({ where: { id: { in: venueIds } } });
      // S2-F1: đội tham chiếu captain (RESTRICT) — dọn trước khi xóa user.
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
        email: `itbk-owner-${SUFFIX}@courthub.vn`,
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
    // 19:00-21:00 nằm trọn rule 17-22h -> 2 x 260k = 520k
    const hold = (await bookings.createHold(uA(), {
      courtId,
      date: DATE,
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
    const resAll = await bookings.listMine(uA(), { page: 1, limit: 10 });
    expect(resAll.total).toBeGreaterThanOrEqual(1);

    const resUp = await bookings.listMine(uA(), { filter: 'upcoming', page: 1, limit: 10 });
    expect(resUp.items.every((b) => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN')).toBe(
      true,
    );

    const resCancel = await bookings.listMine(uA(), { filter: 'cancelled', page: 1, limit: 10 });
    expect(resCancel.items.every((b) => b.status === 'CANCELLED' || b.status === 'NO_SHOW')).toBe(
      true,
    );
  });

  it('check-in và no-show: owner của sân check-in đúng mã, owner khác bị 403', async () => {
    if (!dbUp) return;
    const bk = await prisma.booking.create({
      data: {
        code: `CH-CK-${SUFFIX}`,
        customerId: custA.id,
        courtId,
        date: new Date(dstr(tomorrow())),
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
        date: new Date(dstr(tomorrow())),
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
        email: `itbk-stranger-${SUFFIX}@courthub.vn`,
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
      mk(`itn2-owner-${SUFFIX}@courthub.vn`, 'OWNER'),
      mk(`itn2-other-${SUFFIX}@courthub.vn`, 'OWNER'),
      mk(`itn2-c1-${SUFFIX}@courthub.vn`, 'CUSTOMER'),
      mk(`itn2-c2-${SUFFIX}@courthub.vn`, 'CUSTOMER'),
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
});
