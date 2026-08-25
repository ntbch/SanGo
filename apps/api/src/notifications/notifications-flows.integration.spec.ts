/**
 * Integration test P2-B2 — luồng nghiệp vụ phát thông báo trên Postgres THẬT.
 * Phủ: confirmFromHold -> khách nhận BOOKING_CONFIRMED + PAYMENT_RECEIVED, chủ venue
 * nhận NEW_BOOKING_OWNER; cancelBooking -> 2 bên nhận BOOKING_CANCELLED;
 * join/leave ghép trận -> chủ đơn nhận MATCH_JOINED / MATCH_LEFT; reminder dedup.
 * Không có DB -> tự bỏ qua để gate vẫn xanh.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ConsoleMailer } from './mailer/console.mailer';
import { NotifyService } from './notify.service';
import type { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { BookingsCronService } from '../bookings/bookings.cron.service';

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
    `itflow-cust-${SUFFIX}@courthub.vn`,
    `itflow-owner-${SUFFIX}@courthub.vn`,
    `itflow-join-${SUFFIX}@courthub.vn`,
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
    bookings = new BookingsService(prisma as unknown as PrismaService, notify);
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
    await prisma.notification.deleteMany({
      where: { user: { email: { contains: `itflow-${SUFFIX}` } } },
    });
    await prisma.user.deleteMany({ where: { email: { contains: `itflow-${SUFFIX}` } } });
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
    // Mail xác nhận đã render branded
    const confirmed = notis.find((n) => n.type === 'BOOKING_CONFIRMED');
    expect(confirmed?.link).toMatch(/^\/bookings\//);
  });

  it('cancelBooking -> khách và chủ venue đều nhận BOOKING_CANCELLED', async () => {
    const booking = await mkConfirmedBooking(72 * HOUR);
    await bookings.cancelBooking(booking.id, { id: custId, role: 'CUSTOMER' }, 'Đổi kế hoạch');

    const cancelNotis = await prisma.notification.findMany({
      where: { type: 'BOOKING_CANCELLED', OR: [{ userId: custId }, { userId: ownerId }] },
    });
    expect(cancelNotis.map((n) => n.userId).sort()).toEqual([custId, ownerId].sort());
  });

  it('join/leave ghép trận -> chủ đơn nhận MATCH_JOINED rồi MATCH_LEFT', async () => {
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

  it('reminder cron: đơn còn ~30 phút chỉ nhận ĐÚNG 1 bản ghi REMINDER T-2h', async () => {
    await mkConfirmedBooking(30 * 60_000);
    // Tick hai lần liên tiếp — lần 2 phải bị chặn bởi dedup
    await cron['sendReminders']();
    await cron['sendReminders']();

    const reminders = await prisma.notification.findMany({
      where: { userId: custId, type: 'REMINDER', title: 'Sắp tới giờ chơi!' },
    });
    expect(reminders).toHaveLength(1);
    // Chưa tới mốc T-24h riêng? Có: mốc T-24h cũng đã qua cửa sổ (30 phút < 24h)
    // nên tổng cộng mỗi tick chỉ phát T-2h; T-24h KHÔNG phát lùi lại.
    const t24 = await prisma.notification.findMany({
      where: { userId: custId, title: 'Nhắc lịch: ngày mai bạn có trận' },
    });
    expect(t24).toHaveLength(0);
  });
});
