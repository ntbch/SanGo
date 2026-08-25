/**
 * Integration test Ghép trận mở (§3.11) — chạy Postgres THẬT.
 * Phủ yêu cầu task G2-B2: hold->confirm copy cờ ghép trận; join tới đủ -> matchFull;
 * join trùng -> 409 ALREADY_JOINED; chủ đơn tự join -> 400; rời trận mở lại chỗ;
 * phân quyền participants. Không có DB -> tự bỏ qua để gate vẫn xanh.
 */
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaClient, type User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import type { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { NotifyService } from '../notifications/notify.service';
import { ConsoleMailer } from '../notifications/mailer/console.mailer';
import { MatchesService } from './matches.service';

const SUFFIX = Date.now().toString(36);

/** Ngày mai theo UTC — tránh quá khứ và an toàn trước cron hoàn tất đơn. */
const tomorrow = () =>
  new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z').getTime() + 86_400_000;

describe('Ghép trận mở trên DB thật (integration)', () => {
  let prisma: PrismaClient;
  let bookings: BookingsService;
  let matches: MatchesService;
  let dbUp = false;

  let hostA!: User;
  let uB!: User;
  let uC!: User;
  let uD!: User;
  let strangerE!: User;
  let courtId!: string;
  let publicBookingId!: string; // từ luồng hold->confirm, slotsNeeded=2
  let directBookingId!: string; // tạo trực tiếp, dùng cho join trùng/tự join
  const DATE = new Date(tomorrow()).toISOString().slice(0, 10);
  const EMAILS = () => [
    `itmk-host-${SUFFIX}@courthub.vn`,
    `itmk-b-${SUFFIX}@courthub.vn`,
    `itmk-c-${SUFFIX}@courthub.vn`,
    `itmk-d-${SUFFIX}@courthub.vn`,
    `itmk-e-${SUFFIX}@courthub.vn`,
    `itmk-owner-${SUFFIX}@courthub.vn`,
  ];

  beforeAll(async () => {
    prisma = new PrismaClient();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbUp = true;
    } catch {
      console.warn('[integration] Không có Postgres -> bỏ qua matches integration');
      return;
    }
    // Service dùng nguyên PrismaClient thật; cast để bỏ qua lifecycle hooks của PrismaService.
    const notify = new NotifyService(prisma as unknown as PrismaService, new ConsoleMailer());
    bookings = new BookingsService(prisma as unknown as PrismaService, notify);
    matches = new MatchesService(prisma as unknown as PrismaService);

    const hash = await bcrypt.hash('IntegrationPass1!', 4);
    const mkUser = (email: string, role: 'CUSTOMER' | 'OWNER') =>
      prisma.user.create({
        data: { email, passwordHash: hash, fullName: email.split('@')[0], role },
      });
    hostA = await mkUser(EMAILS()[0], 'CUSTOMER');
    uB = await mkUser(EMAILS()[1], 'CUSTOMER');
    uC = await mkUser(EMAILS()[2], 'CUSTOMER');
    uD = await mkUser(EMAILS()[3], 'CUSTOMER');
    strangerE = await mkUser(EMAILS()[4], 'CUSTOMER');
    const owner = await mkUser(EMAILS()[5], 'OWNER');

    const venue = await prisma.venue.create({
      data: {
        ownerId: owner.id,
        name: `IT Match Venue ${SUFFIX}`,
        slug: `itmk-${SUFFIX}`,
        address: '2 Đường test',
        lat: 10.76,
        lng: 106.66,
        openMinute: 360,
        closeMinute: 1380,
        images: [],
        amenities: [],
        depositPercent: 30,
        status: 'APPROVED',
      },
    });
    const court = await prisma.court.create({
      data: {
        venueId: venue.id,
        name: 'Sân 5 IT',
        sportType: 'FOOTBALL5',
        slotMinutes: 90,
        defaultPricePerSlot: 100_000,
      },
    });
    courtId = court.id;

    // (1) Luồng thật: createHold bật ghép trận -> confirmFromHold copy cờ sang Booking.
    await bookings.createHold(
      { id: hostA.id },
      {
        courtId,
        date: DATE,
        slots: [1080], // 18:00 — đúng lưới 90' từ openMinute 360
        isPublicMatch: true,
        slotsNeeded: 2,
      },
    );
    const hold = await prisma.bookingHold.findFirstOrThrow({
      where: { userId: hostA.id, courtId },
      orderBy: { createdAt: 'desc' },
    });
    const confirmed = await bookings.confirmFromHold(hold.id, {
      txnRef: `ITMK-${SUFFIX}`,
      method: 'MOCK',
    });
    publicBookingId = confirmed.id;

    // (2) Đơn public tạo trực tiếp (test join trùng / tự join).
    const direct = await prisma.booking.create({
      data: {
        code: `CH-ITMK-${SUFFIX}-D`,
        customerId: hostA.id,
        courtId,
        date: new Date(DATE + 'T00:00:00.000Z'),
        startMinute: 360,
        endMinute: 450,
        subtotal: 100_000,
        depositAmount: 30_000,
        status: 'CONFIRMED',
        isPublicMatch: true,
        slotsNeeded: 2,
        matchFull: false,
      },
    });
    directBookingId = direct.id;
  });

  afterAll(async () => {
    if (!dbUp) return;
    // Con trước cha; đơn từ confirmFromHold có mã chuẩn CH-YYYYMMDD-NNNN nên xóa theo id.
    const ids = [publicBookingId, directBookingId].filter(Boolean);
    if (ids.length > 0) {
      await prisma.matchParticipant.deleteMany({ where: { bookingId: { in: ids } } });
      await prisma.payment.deleteMany({ where: { bookingId: { in: ids } } });
      await prisma.booking.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.bookingHold.deleteMany({ where: { user: { email: { in: EMAILS() } } } });
    await prisma.court.deleteMany({ where: { venue: { slug: `itmk-${SUFFIX}` } } });
    await prisma.venue.deleteMany({ where: { slug: `itmk-${SUFFIX}` } });
    await prisma.user.deleteMany({ where: { email: { in: EMAILS() } } });
    await prisma.$disconnect();
  });

  it('createHold + confirmFromHold copy isPublicMatch/slotsNeeded sang Booking, matchFull=false', async () => {
    if (!dbUp) return console.warn('[integration] skip');
    const b = await prisma.booking.findUniqueOrThrow({ where: { id: publicBookingId } });
    expect(b.isPublicMatch).toBe(true);
    expect(b.slotsNeeded).toBe(2);
    expect(b.matchFull).toBe(false);
    expect(b.status).toBe('CONFIRMED');
  });

  it('GET /matches/open: chỉ đơn công khai chưa đầy, lọc sportType/date, joinedCount đúng', async () => {
    if (!dbUp) return console.warn('[integration] skip');
    const res = await matches.listOpen({ page: 1 });
    const mine = res.items.filter(
      (i) => i.bookingId === publicBookingId || i.bookingId === directBookingId,
    );
    expect(mine).toHaveLength(2);
    for (const item of mine) {
      expect(item).toMatchObject({
        courtName: 'Sân 5 IT',
        sportType: 'FOOTBALL5',
        date: DATE,
        hostName: `itmk-host-${SUFFIX}`, // fullName = phần trước '@' của email seed
        slotsNeeded: 2,
        joinedCount: 0,
      });
    }
    const tennisOnly = await matches.listOpen({ page: 1, sportType: 'TENNIS' });
    expect(tennisOnly.items.some((i) => i.bookingId === publicBookingId)).toBe(false);
    const byDate = await matches.listOpen({ page: 1, date: DATE });
    expect(byDate.items.some((i) => i.bookingId === publicBookingId)).toBe(true);
    const otherDate = await matches.listOpen({
      page: 1,
      date: new Date(new Date(DATE + 'T00:00:00.000Z').getTime() + 86_400_000)
        .toISOString()
        .slice(0, 10),
    });
    expect(otherDate.items.some((i) => i.bookingId === publicBookingId)).toBe(false);
  });

  it('join tới đủ -> matchFull=true; người thứ ba join -> 409 MATCH_FULL', async () => {
    if (!dbUp) return console.warn('[integration] skip');
    const j1 = await bookings.joinOpenMatch(publicBookingId, { id: uB.id, role: 'CUSTOMER' });
    expect(j1.joinedCount).toBe(1);
    expect(j1.matchFull).toBe(false);
    const j2 = await bookings.joinOpenMatch(publicBookingId, { id: uC.id, role: 'CUSTOMER' });
    expect(j2.joinedCount).toBe(2);
    expect(j2.matchFull).toBe(true);

    await expect(
      bookings.joinOpenMatch(publicBookingId, { id: uD.id, role: 'CUSTOMER' }),
    ).rejects.toMatchObject({ response: { code: 'MATCH_FULL' } });
    const row = await prisma.booking.findUniqueOrThrow({ where: { id: publicBookingId } });
    expect(row.matchFull).toBe(true);
  });

  it('join trùng -> 409 ALREADY_JOINED; chủ đơn tự join -> 400 SELF_JOIN_NOT_ALLOWED', async () => {
    if (!dbUp) return console.warn('[integration] skip');
    // directBooking chưa đầy -> nhánh UNIQUE(P2002) chạy thật sự.
    const first = await bookings.joinOpenMatch(directBookingId, { id: uB.id, role: 'CUSTOMER' });
    expect(first.joinedCount).toBe(1);
    await expect(
      bookings.joinOpenMatch(directBookingId, { id: uB.id, role: 'CUSTOMER' }),
    ).rejects.toMatchObject({ response: { code: 'ALREADY_JOINED' } });
    await expect(
      bookings.joinOpenMatch(directBookingId, { id: hostA.id, role: 'CUSTOMER' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rời trận -> mở lại chỗ trống; rời khi chưa từng join -> 404', async () => {
    if (!dbUp) return console.warn('[integration] skip');
    const left = await bookings.leaveOpenMatch(publicBookingId, { id: uC.id });
    expect(left.left).toBe(true);
    expect(left.matchFull).toBe(false);

    const again = await bookings.joinOpenMatch(publicBookingId, { id: uD.id, role: 'CUSTOMER' });
    expect(again.joinedCount).toBe(2);
    expect(again.matchFull).toBe(true);

    await expect(bookings.leaveOpenMatch(publicBookingId, { id: uC.id })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('participants: chủ đơn và ADMIN xem được, người lạ 403', async () => {
    if (!dbUp) return console.warn('[integration] skip');
    const view = await bookings.listMatchParticipants(publicBookingId, {
      id: hostA.id,
      role: 'CUSTOMER',
    });
    expect(view.joinedCount).toBe(2);
    expect(view.participants.map((p) => p.userId).sort()).toEqual([uB.id, uD.id].sort());

    await expect(
      bookings.listMatchParticipants(publicBookingId, { id: strangerE.id, role: 'CUSTOMER' }),
    ).rejects.toThrow(ForbiddenException);

    const adminView = await bookings.listMatchParticipants(publicBookingId, {
      id: strangerE.id,
      role: 'ADMIN',
    });
    expect(adminView.joinedCount).toBe(2);
  });
});
