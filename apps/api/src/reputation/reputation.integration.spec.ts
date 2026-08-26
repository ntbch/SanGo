/**
 * Integration test Reputation compute-on-read (S3-F2) — Postgres thật.
 * Không có DB -> tự bỏ qua để gate vẫn xanh (probe SELECT 1 như các spec khác).
 * Phủ: đúng giờ cộng, huỷ sát giờ trừ, no-show trừ nặng, trung tính dữ liệu cũ,
 * badge SQL aggregate và cache 5 phút.
 */
import { Test } from '@nestjs/testing';
import { PrismaClient, SportType, type User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaModule } from '../prisma/prisma.module';
import { ReputationModule } from './reputation.module';
import { ReputationService } from './reputation.service';

const SUFFIX = Date.now().toString(36);

describe('Reputation compute-on-read (integration)', () => {
  let prisma: PrismaClient;
  let reputation: ReputationService;
  let dbUp = false;
  let cust!: User;
  let courtId!: string;

  const dstr = (t: number) => new Date(t).toISOString().slice(0, 10);

  beforeAll(async () => {
    prisma = new PrismaClient();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbUp = true;
    } catch {
      console.warn('[integration] Không có Postgres -> bỏ qua reputation integration');
      return;
    }
    const hash = await bcrypt.hash('IntegrationPass1!', 4);
    cust = await prisma.user.create({
      data: {
        email: `itrep-cust-${SUFFIX}@courthub.vn`,
        passwordHash: hash,
        fullName: 'Rep Cust',
        role: 'CUSTOMER',
      },
    });
    const owner = await prisma.user.create({
      data: {
        email: `itrep-owner-${SUFFIX}@courthub.vn`,
        passwordHash: hash,
        fullName: 'Rep Owner',
        role: 'OWNER',
      },
    });
    const venue = await prisma.venue.create({
      data: {
        name: 'Venue Rep ' + SUFFIX,
        slug: 'venue-rep-' + SUFFIX,
        address: '789 Rep St',
        lat: 21.03,
        lng: 105.84,
        openMinute: 360,
        closeMinute: 1320,
        depositPercent: 30,
        ownerId: owner.id,
        status: 'APPROVED',
      },
    });
    const court = await prisma.court.create({
      data: {
        venueId: venue.id,
        name: 'Sân Rep',
        sportType: SportType.FOOTBALL5,
        slotMinutes: 60,
        defaultPricePerSlot: 200_000,
      },
    });
    courtId = court.id;

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, ReputationModule],
    }).compile();
    reputation = moduleRef.get(ReputationService);
  });

  afterAll(async () => {
    if (dbUp) {
      const users = await prisma.user.findMany({
        where: { email: { contains: 'itrep-' } },
        select: { id: true },
      });
      const ids = users.map((u) => u.id);
      await prisma.payment.deleteMany({ where: { booking: { customerId: { in: ids } } } });
      await prisma.booking.deleteMany({ where: { customerId: { in: ids } } });
      const owned = await prisma.venue.findMany({
        where: { ownerId: { in: ids } },
        select: { id: true },
      });
      const vIds = owned.map((v) => v.id);
      await prisma.court.deleteMany({ where: { venueId: { in: vIds } } });
      await prisma.venue.deleteMany({ where: { id: { in: vIds } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
      await prisma.$disconnect();
    }
  });

  /** Tạo nhanh một booking với trạng thái/thời điểm tuỳ chọn. */
  async function mkBooking(opts: {
    userId?: string;
    status: 'CANCELLED' | 'CHECKED_IN' | 'COMPLETED';
    daysFromNow: number;
    startMinute: number;
    checkedInOffsetMin?: number;
    cancelledOffsetMin?: number;
  }): Promise<void> {
    const dateIso = dstr(Date.now() + opts.daysFromNow * 86_400_000);
    const date = new Date(dateIso + 'T00:00:00.000Z');
    const startAt = date.getTime() + opts.startMinute * 60_000;
    await prisma.booking.create({
      data: {
        code: 'CH-REP-' + SUFFIX + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
        customerId: opts.userId ?? cust.id,
        courtId,
        date,
        startMinute: opts.startMinute,
        endMinute: opts.startMinute + 60,
        subtotal: 200_000,
        depositAmount: 60_000,
        status: opts.status,
        ...(opts.checkedInOffsetMin !== undefined
          ? { checkedInAt: new Date(startAt + opts.checkedInOffsetMin * 60_000) }
          : {}),
        ...(opts.cancelledOffsetMin !== undefined
          ? { cancelledAt: new Date(startAt + opts.cancelledOffsetMin * 60_000) }
          : {}),
      },
    });
  }

  it('SCORE-1: chưa có đơn chấm điểm -> score = BASE, mọi badge khoá', async () => {
    if (!dbUp) return;
    const rep = await reputation.getMyReputation(cust.id);
    expect(rep.score).toBe(50);
    expect(rep.breakdown).toEqual({ onTimeCheckIns: 0, lateCancels: 0, noShows: 0 });
    expect(rep.badges.every((b) => b.unlocked === false && b.current === 0)).toBe(true);
    expect(rep.badges.map((b) => b.name)).toEqual(['Đúng giờ 10 lần', '10 lần đặt sân']);
  });

  it('SCORE-2: đúng giờ +10, no-show -20, huỷ sát giờ -5, huỷ sớm + dữ liệu cũ trung tính', async () => {
    if (!dbUp) return;
    // SCORE-1 đã đọc và lấp cache -> xoá để chấm trên dữ liệu mới thêm dưới đây.
    (reputation as unknown as { cache: Map<string, unknown> }).cache.clear();
    await mkBooking({
      status: 'CHECKED_IN',
      daysFromNow: -1,
      startMinute: 600,
      checkedInOffsetMin: -10, // check-in trước giờ chơi 10 phút -> ĐÚNG GIỜ
    });
    await mkBooking({
      status: 'COMPLETED',
      daysFromNow: -2,
      startMinute: 600,
      // không checkedInAt -> NO-SHOW trừ nặng
    });
    await mkBooking({
      status: 'CANCELLED',
      daysFromNow: -3,
      startMinute: 600,
      cancelledOffsetMin: -60, // huỷ trước giờ chơi 1 tiếng (<12h) -> TRỪ
    });
    await mkBooking({
      status: 'CANCELLED',
      daysFromNow: -4,
      startMinute: 600,
      cancelledOffsetMin: -13 * 60, // huỷ trước 13 tiếng (>12h) -> TRUNG TÍNH
    });
    // CONFIRMED chưa chơi có checkedInAt NULL -> không nằm trong tập chấm.

    const rep = await reputation.getMyReputation(cust.id);
    // 50 + 10 - 20 - 5 = 35
    expect(rep.score).toBe(35);
    expect(rep.breakdown).toEqual({ onTimeCheckIns: 1, lateCancels: 1, noShows: 1 });
    const bookings10 = rep.badges.find((b) => b.code === 'BOOKINGS_10');
    expect(bookings10?.current).toBeGreaterThanOrEqual(2); // CHECKED_IN + COMPLETED
    const onTime10 = rep.badges.find((b) => b.code === 'ON_TIME_10');
    expect(onTime10?.current).toBeGreaterThanOrEqual(1);
  });

  it('SCORE-3 (chốt captain): huỷ ĐÚNG mốc 12h là huỷ bình thường — không trừ điểm', async () => {
    if (!dbUp) return;
    const clearCache = () =>
      (reputation as unknown as { cache: Map<string, unknown> }).cache.clear();
    clearCache();
    // Baseline TRƯỚC khi thêm đơn huỷ ranh giới.
    const before = await reputation.getMyReputation(cust.id);
    await mkBooking({
      status: 'CANCELLED',
      daysFromNow: -6,
      startMinute: 600,
      cancelledOffsetMin: -12 * 60, // đúng T-12h -> thuộc tier 50%, KHÔNG trừ điểm
    });
    clearCache();
    const after = await reputation.getMyReputation(cust.id);
    expect(after.breakdown.lateCancels).toBe(before.breakdown.lateCancels);
    expect(after.score).toBe(before.score);
  });

  it('CACHE: đọc liên tiếp trong TTL dùng kết quả cache, xoá cache thấy dữ liệu mới', async () => {
    if (!dbUp) return;
    // Bỏ cache của test trước để 'before' phản ánh đúng dữ liệu hiện có.
    (reputation as unknown as { cache: Map<string, unknown> }).cache.clear();
    const before = await reputation.getMyReputation(cust.id);
    // Thêm đúng giờ mới — nếu không có cache thì score phải tăng.
    await mkBooking({
      status: 'CHECKED_IN',
      daysFromNow: -5,
      startMinute: 600,
      checkedInOffsetMin: -5,
    });
    const cached = await reputation.getMyReputation(cust.id);
    expect(cached.score).toBe(before.score); // cache 5 phút giữ giá trị cũ

    (reputation as unknown as { cache: Map<string, unknown> }).cache.clear();
    const fresh = await reputation.getMyReputation(cust.id);
    expect(fresh.score).toBe(before.score + 10);
    expect(fresh.breakdown.onTimeCheckIns).toBe(before.breakdown.onTimeCheckIns + 1);
  });

  it('LEADERBOARD (gap t31): sort score desc, trả đủ trường FE cần, limit hoạt động', async () => {
    if (!dbUp) return;
    (reputation as unknown as { cache: Map<string, unknown> }).cache.clear();
    const rival = await prisma.user.create({
      data: {
        email: `itrep-rival-${SUFFIX}@courthub.vn`,
        passwordHash: await bcrypt.hash('IntegrationPass1!', 4),
        fullName: 'Á Quân',
        role: 'CUSTOMER',
      },
    });
    try {
      // Rival chơi sạch 2 trận đúng giờ -> 70đ, vượt cust đang 45đ.
      for (const d of [-6, -7]) {
        await mkBooking({
          userId: rival.id,
          status: 'CHECKED_IN',
          daysFromNow: d,
          startMinute: 600,
          checkedInOffsetMin: -15,
        });
      }

      const board = await reputation.getLeaderboard(10);
      expect(board.total).toBeGreaterThanOrEqual(2);
      // Leaderboard là GLOBAL (gồm cả user seed) -> chỉ assert tương đối trong tập của test.
      const rivalRow = board.items.find((i) => i.userId === rival.id);
      expect(rivalRow).toBeDefined();
      expect(rivalRow!.score).toBe(70);
      // Đủ trường FE cần: tên, score, onTime, noShow (+userId để điều hướng).
      expect(rivalRow!).toMatchObject({
        fullName: 'Á Quân',
        onTime: 2,
        noShow: 0,
      });
      const custIdx = board.items.findIndex((i) => i.userId === cust.id);
      const rivalIdx = board.items.findIndex((i) => i.userId === rival.id);
      expect(custIdx).toBeGreaterThan(-1);
      // 70đ của rival phải đứng TRÊN 45đ của cust (sort score desc).
      expect(rivalIdx).toBeLessThan(custIdx);
      // Sort tổng thể giảm dần theo score.
      for (let i = 1; i < board.items.length; i++) {
        expect(board.items[i - 1].score).toBeGreaterThanOrEqual(board.items[i].score);
      }

      // limit hoạt động.
      const top1 = await reputation.getLeaderboard(1);
      expect(top1.items.length).toBe(1);
      expect(top1.items[0].score).toBeGreaterThanOrEqual(board.items[0].score);
    } finally {
      await prisma.booking.deleteMany({ where: { customerId: rival.id } }).catch(() => undefined);
      await prisma.user.deleteMany({ where: { id: rival.id } }).catch(() => undefined);
    }
  });
});
