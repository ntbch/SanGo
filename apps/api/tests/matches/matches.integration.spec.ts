/**
 * Integration test Ghép trận mở (§3.11) — chạy Postgres THẬT.
 * Phủ yêu cầu task G2-B2: hold->confirm copy cờ ghép trận; join tới đủ -> matchFull;
 * join trùng -> 409 ALREADY_JOINED; chủ đơn tự join -> 400; rời trận mở lại chỗ;
 * phân quyền participants. Không có DB -> tự bỏ qua để gate vẫn xanh.
 */
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaClient, type User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import type { PrismaService } from '../../src/prisma/prisma.service';
import { BookingsService } from '../../src/bookings/bookings.service';
import { NotifyService } from '../../src/notifications/notify.service';
import { ConsoleMailer } from '../../src/notifications/mailer/console.mailer';
import { MatchesService } from '../../src/matches/matches.service';
import { WalletsService } from '../../src/wallets/wallets.service';

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
  let directBookingId!: string; // tạo trực tiếp, requiresApproval=false — dùng join trùng/tự join
  let approvalBookingId!: string; // requiresApproval=true — chỉ dùng assert list/detail
  const DATE = new Date(tomorrow()).toISOString().slice(0, 10);
  const EMAILS = () => [
    `itmk-host-${SUFFIX}@sango.vn`,
    `itmk-b-${SUFFIX}@sango.vn`,
    `itmk-c-${SUFFIX}@sango.vn`,
    `itmk-d-${SUFFIX}@sango.vn`,
    `itmk-e-${SUFFIX}@sango.vn`,
    `itmk-owner-${SUFFIX}@sango.vn`,
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
    bookings = new BookingsService(
      prisma as unknown as PrismaService,
      notify,
      new WalletsService(prisma as unknown as PrismaService),
    );
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
        city: `IT City ${SUFFIX}`,
        district: `IT District ${SUFFIX}`,
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

    // (2) Đơn public tạo trực tiếp (test join trùng / tự join). GIỮ requiresApproval=false
    // vì joinOpenMatch chặn APPROVAL_REQUIRED — test join trùng dựa vào điều này.
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
        requiresApproval: false,
      },
    });
    directBookingId = direct.id;

    // (3) Fixture RIÊNG cho assert requiresApproval của list/detail — trước đây test
    // listOpen lật cờ của `direct` rồi test join trùng âm thầm dựa vào thay đổi đó,
    // nên chạy riêng (-t) hoặc xáo trộn thứ tự là fail 409 APPROVAL_REQUIRED.
    const approval = await prisma.booking.create({
      data: {
        code: `CH-ITMK-${SUFFIX}-A`,
        customerId: hostA.id,
        courtId,
        date: new Date(DATE + 'T00:00:00.000Z'),
        startMinute: 600,
        endMinute: 690,
        subtotal: 100_000,
        depositAmount: 30_000,
        status: 'CONFIRMED',
        isPublicMatch: true,
        slotsNeeded: 2,
        matchFull: false,
        requiresApproval: true,
      },
    });
    approvalBookingId = approval.id;
  });

  afterAll(async () => {
    if (!dbUp) return;
    // Con trước cha; đơn từ confirmFromHold có mã chuẩn CH-YYYYMMDD-NNNN nên xóa theo id.
    const ids = [publicBookingId, directBookingId, approvalBookingId].filter(Boolean);
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
    const res = await matches.listOpen({ page: 1, limit: 10 });
    const mine = res.items.filter(
      (i) => i.bookingId === publicBookingId || i.bookingId === directBookingId,
    );
    expect(mine).toHaveLength(2);
    for (const item of mine) {
      expect(item).toMatchObject({
        courtName: 'Sân 5 IT',
        sportType: 'FOOTBALL5',
        date: DATE,
        host: { fullName: `itmk-host-${SUFFIX}` },
        slotsNeeded: 2,
        joinedCount: 0,
      });
    }
    const byGroupAndArea = await matches.listOpen({
      page: 1, limit: 10, sportGroup: 'FOOTBALL', city: `IT City ${SUFFIX}`, district: `IT District ${SUFFIX}`,
    });
    expect(byGroupAndArea.items.map((item) => item.bookingId)).toEqual(expect.arrayContaining([publicBookingId, directBookingId]));
    const otherSportSameArea = await matches.listOpen({
      page: 1, limit: 10, sportType: 'TENNIS', city: `IT City ${SUFFIX}`, district: `IT District ${SUFFIX}`,
    });
    expect(otherSportSameArea.items).toEqual([]);
    const otherDistrict = await matches.listOpen({
      page: 1, limit: 10, sportGroup: 'FOOTBALL', city: `IT City ${SUFFIX}`, district: `Other District ${SUFFIX}`,
    });
    expect(otherDistrict.items).toEqual([]);
    expect(byGroupAndArea.items.find((item) => item.bookingId === approvalBookingId)?.requiresApproval).toBe(true);
    const detail = await matches.getMatchDetail(approvalBookingId);
    expect(detail.requiresApproval).toBe(true);
    expect(detail.host?.id).toBe(hostA.id);
    expect(detail.slotsNeeded).toBe(2);
    expect(detail.joinedCount).toBe(0);
    const tennisOnly = await matches.listOpen({ page: 1, limit: 10, sportType: 'TENNIS' });
    expect(tennisOnly.items.some((i) => i.bookingId === publicBookingId)).toBe(false);
    const byDate = await matches.listOpen({ page: 1, limit: 10, date: DATE });
    expect(byDate.items.some((i) => i.bookingId === publicBookingId)).toBe(true);
    const otherDate = await matches.listOpen({
      page: 1,
      limit: 10,
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
