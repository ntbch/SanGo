/**
 * Integration test P2-B2 — luồng nghiệp vụ phát thông báo trên Postgres THẬT.
 * Phủ: confirmFromHold -> khách nhận BOOKING_CONFIRMED + PAYMENT_RECEIVED, chủ venue
 * nhận NEW_BOOKING_OWNER; cancelBooking -> 2 bên nhận BOOKING_CANCELLED;
 * join/leave ghép trận -> chủ đơn nhận MATCH_JOINED / MATCH_LEFT; reminder dedup.
 * Không có DB -> tự bỏ qua để gate vẫn xanh.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ConsoleMailer } from '../../src/notifications/mailer/console.mailer';
import { NotifyService } from '../../src/notifications/notify.service';
import type { PrismaService } from '../../src/prisma/prisma.service';
import { BookingsService } from '../../src/bookings/bookings.service';
import { BookingsCronService } from '../../src/bookings/bookings.cron.service';
import { WalletsService } from '../../src/wallets/wallets.service';

const SUFFIX = Date.now().toString(36);
const HOUR = 3_600_000;

describe('Thông báo gắn luồng nghiệp vụ (integration)', () => {
  let prisma: PrismaClient;
  let bookings: BookingsService;
  let cron: BookingsCronService;
  let dbUp = false;

  let custId!: string;
  let ownerId!: string;
  let joinerId!: string;
  let courtId!: string;
  const EMAILS = () => [
    `itflow-cust-${SUFFIX}@sango.vn`,
    `itflow-owner-${SUFFIX}@sango.vn`,
    `itflow-join-${SUFFIX}@sango.vn`,
  ];

  beforeAll(async () => {
    prisma = new PrismaClient();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbUp = true;
    } catch {
      console.warn('[integration] Không có Postgres -> bỏ qua notifications-flows integration');
      return;
    }
    const notify = new NotifyService(prisma as unknown as PrismaService, new ConsoleMailer());
    bookings = new BookingsService(
      prisma as unknown as PrismaService,
      notify,
      new WalletsService(prisma as unknown as PrismaService),
    );
    cron = new BookingsCronService(bookings, prisma as unknown as PrismaService, notify);

    const hash = await bcrypt.hash('IntegrationPass1!', 4);
    const mkUser = (email: string, role: 'CUSTOMER' | 'OWNER') =>
      prisma.user.create({
        data: { email, passwordHash: hash, fullName: email.split('@')[0], role },
      });
    [custId, ownerId, joinerId] = await Promise.all([
      mkUser(EMAILS()[0], 'CUSTOMER').then((u) => u.id),
      mkUser(EMAILS()[1], 'OWNER').then((u) => u.id),
      mkUser(EMAILS()[2], 'CUSTOMER').then((u) => u.id),
    ]);

    const venue = await prisma.venue.create({
      data: {
        ownerId,
        name: `IT Flow Venue ${SUFFIX}`,
        slug: `itflow-${SUFFIX}`,
        address: '9 Đường test',
        lat: 10.77,
        lng: 106.7,
        openMinute: 0,
        closeMinute: 1440,
        images: [],
        amenities: [],
        depositPercent: 30,
        status: 'APPROVED',
      },
    });
    courtId = (
      await prisma.court.create({
        data: {
          venueId: venue.id,
          name: 'Sân Flow',
          sportType: 'FOOTBALL5',
          slotMinutes: 90,
          defaultPricePerSlot: 200000,
        },
      })
    ).id;
  });

  afterAll(async () => {
    if (!dbUp) return;
    // FIX F1 (T13-F1): cleanup theo PREFIX 'itflow-' (không phụ thuộc SUFFIX chạy
    // trước — SUFFIX đổi theo thời gian chạy). Xoá CON TRƯỚC CHA: booking.customer,
    // wallet_* , venue.owner giữ FK RESTRICT về users — phải dọn hết mới xoá được
    // user rác do các lần chạy cũ để lại (tránh tích luỹ chiếm top-10 leaderboard).
    const strays = await prisma.user.findMany({
      where: { email: { startsWith: 'itflow-' } },
      select: { id: true },
    });
    if (strays.length > 0) {
      const ids = strays.map((u) => u.id);
      await prisma.notification.deleteMany({ where: { userId: { in: ids } } }).catch(() => undefined);
      await prisma.walletLedger.deleteMany({ where: { userId: { in: ids } } }).catch(() => undefined);
      await prisma.walletBalance.deleteMany({ where: { userId: { in: ids } } }).catch(() => undefined);
      await prisma.walletTopup.deleteMany({ where: { userId: { in: ids } } }).catch(() => undefined);
      await prisma.payment
        .deleteMany({ where: { booking: { customerId: { in: ids } } } })
        .catch(() => undefined);
      await prisma.bookingHold.deleteMany({ where: { userId: { in: ids } } }).catch(() => undefined);
      await prisma.booking.deleteMany({ where: { customerId: { in: ids } } }).catch(() => undefined);
      const owned = await prisma.venue.findMany({ where: { ownerId: { in: ids } }, select: { id: true } });
      if (owned.length > 0) {
        const vIds = owned.map((v) => v.id);
        await prisma.court.deleteMany({ where: { venueId: { in: vIds } } }).catch(() => undefined);
        await prisma.venue.deleteMany({ where: { id: { in: vIds } } }).catch(() => undefined);
      }
      await prisma.user.deleteMany({ where: { id: { in: ids } } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  /** Tạo booking CONFIRMED trực tiếp (đủ dữ liệu để chạy các hook). */
  const mkConfirmedBooking = async (startOffsetMs: number, isPublic = false) => {
    const t = new Date(Date.now() + startOffsetMs);
    const dateIso = t.toISOString().slice(0, 10);
    const startMinute = t.getUTCHours() * 60 + t.getUTCMinutes();
    return prisma.booking.create({
      data: {
        code: `CH-FL-${Math.random().toString(36).slice(2, 8)}`,
        customerId: custId,
        courtId,
        date: new Date(dateIso + 'T00:00:00.000Z'),
        startMinute,
        endMinute: startMinute + 60,
        subtotal: 400000,
        depositAmount: 120000,
        isPublicMatch: isPublic ? true : null,
        slotsNeeded: isPublic ? 2 : null,
      },
    });
  };

  it('confirmFromHold -> 3 thông báo đúng loại cho khách + chủ venue', async () => {
    if (!dbUp) return;
    const hold = await prisma.bookingHold.create({
      data: {
        userId: custId,
        courtId,
        date: new Date(
          new Date(Date.now() + 48 * HOUR).toISOString().slice(0, 10) + 'T00:00:00.000Z',
        ),
        startMinute: 600,
        endMinute: 690,
        subtotal: 400000,
        expiresAt: new Date(Date.now() + 9 * 60_000),
      },
    });
    await bookings.confirmFromHold(hold.id, {
      txnRef: `TXN-FLOW-${SUFFIX}-1`,
      method: 'MOCK' as never,
      amountPaid: 120000,
    });

    const notis = await prisma.notification.findMany({
      where: { OR: [{ userId: custId }, { userId: ownerId }] },
      orderBy: { createdAt: 'asc' },
    });
    const types = notis.map((n) => `${n.userId}:${n.type}`);
    expect(types).toContain(`${custId}:BOOKING_CONFIRMED`);
    expect(types).toContain(`${custId}:PAYMENT_RECEIVED`);
    expect(types).toContain(`${ownerId}:NEW_BOOKING_OWNER`);
    // Route chuẩn của khách là /bookings; /dashboard/my-bookings chỉ còn là redirect.
    const confirmed = notis.find((n) => n.type === 'BOOKING_CONFIRMED');
    expect(confirmed?.link).toBe('/bookings');
  });

  it('cancelBooking -> khách và chủ venue đều nhận BOOKING_CANCELLED', async () => {
    if (!dbUp) return;
    const booking = await mkConfirmedBooking(72 * HOUR);
    await bookings.cancelBooking(booking.id, { id: custId, role: 'CUSTOMER' }, 'Đổi kế hoạch');

    const cancelNotis = await prisma.notification.findMany({
      where: { type: 'BOOKING_CANCELLED', OR: [{ userId: custId }, { userId: ownerId }] },
    });
    expect(cancelNotis.map((n) => n.userId).sort()).toEqual([custId, ownerId].sort());
  });

  it('join/leave ghép trận -> chủ đơn nhận MATCH_JOINED rồi MATCH_LEFT', async () => {
    if (!dbUp) return;
    const booking = await mkConfirmedBooking(96 * HOUR, true);

    await bookings.joinOpenMatch(booking.id, { id: joinerId, role: 'CUSTOMER' });
    const joined = await prisma.notification.findFirstOrThrow({
      where: { userId: custId, type: 'MATCH_JOINED' },
    });
    expect(joined.body).toContain('vừa tham gia đơn');

    await bookings.leaveOpenMatch(booking.id, { id: joinerId });
    const left = await prisma.notification.findFirstOrThrow({
      where: { userId: custId, type: 'MATCH_LEFT' },
    });
    expect(left.body).toContain('rời đơn');
  });

  it('reminder cron chạy 2 LẦN không nhân đôi; cột remindedAt2h được claim', async () => {
    if (!dbUp) return;
    const booking = await mkConfirmedBooking(30 * 60_000);
    // Đếm DELTA theo mốc — hai test reminder dùng chung link nên phải độc lập thứ tự
    const countT2 = () =>
      prisma.notification.count({
        where: { userId: custId, type: 'REMINDER', title: 'Sắp tới giờ chơi!' },
      });
    const before = await countT2();
    await cron['sendReminders']();
    await cron['sendReminders'](); // lần 2 phải bị cột chống trùng chặn
    expect((await countT2()) - before).toBe(1);

    // Cột chống trùng trên booking: đã claim T-2h, KHÔNG đụng T-24h
    const flagged = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(flagged.remindedAt2h).not.toBeNull();
    expect(flagged.remindedAt24h).toBeNull();
  });

  it('reminder mốc T-24h: đơn còn ~20 tiếng nhận đúng T-24h, chưa T-2h', async () => {
    if (!dbUp) return;
    const booking = await mkConfirmedBooking(20 * HOUR);
    const countT24 = () =>
      prisma.notification.count({
        where: { userId: custId, type: 'REMINDER', title: 'Nhắc lịch: ngày mai bạn có trận' },
      });
    const before = await countT24();
    await cron['sendReminders']();
    expect((await countT24()) - before).toBe(1);

    const flagged = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(flagged.remindedAt24h).not.toBeNull();
    expect(flagged.remindedAt2h).toBeNull();
  });
});
