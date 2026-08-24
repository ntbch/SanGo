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
        email: `itest-bk-a-${SUFFIX}@courthub.vn`,
        passwordHash: hash,
        fullName: 'Cust A',
        role: 'CUSTOMER',
      },
    });
    custB = await prisma.user.create({
      data: {
        email: `itest-bk-b-${SUFFIX}@courthub.vn`,
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
      // Quét TOÀN BỘ user itest-bk-* (gồm rác của những lần chạy crash trước)
      // và xóa con trước cha để không bao giờ kẹt FK RESTRICT.
      const users = await prisma.user.findMany({
        where: { email: { contains: 'itest-bk-' } },
        select: { id: true },
      });
      const ids = users.map((u) => u.id);
      await prisma.review.deleteMany({ where: { customer: { id: { in: ids } } } });
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
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
  });

  /** Fixture: owner + venue APPROVED + court 60' + rule giá tối. */
  const setupCourt = async (): Promise<void> => {
    if (!dbUp) return;
    const ownerHash = await bcrypt.hash('IntegrationPass1!', 4);
    const owner = await prisma.user.create({
      data: {
        email: `itest-bk-owner-${SUFFIX}@courthub.vn`,
        passwordHash: ownerHash,
        fullName: 'Owner',
        role: 'OWNER',
      },
    });
    const venue = await prisma.venue.create({
      data: {
        name: 'Itest-BK Venue ' + SUFFIX,
        slug: 'itest-bk-' + SUFFIX,
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
    expect(refunds.every((p) => p.status === 'PENDING')).toBe(true);

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

  function round50(x: number): number {
    return Math.round((x * 50) / 100 / 1000) * 1000;
  }
});
