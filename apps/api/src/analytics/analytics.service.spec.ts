/**
 * Unit test AnalyticsService (task G2-B1) — mock Prisma + VenuesService.
 * Kiểm chứng: doanh thu xác nhận chỉ cộng depositAmount của đơn
 * CONFIRMED/CHECKED_IN/COMPLETED; zero-fill chuỗi ngày; tổng hợp summary;
 * xếp hạng topCourts; ownership check được gọi trước khi truy vấn.
 */
import { ForbiddenException } from '@nestjs/common';
import {
  AnalyticsService,
  buildAnalyticsRange,
  computeCancelRate,
  dayKey,
} from './analytics.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { VenuesService } from '../venues/venues.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class {},
}));

const VENUE_ID = '11111111-1111-4111-8111-111111111111';
const COURT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const COURT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

/** Hôm nay theo UTC (dựa trên đồng hồ thật vì service tự lấy new Date()). */
function todayKey(): string {
  return dayKey(new Date());
}

/** Dựng 1 dòng groupBy(date,status) giống shape Prisma trả về. */
function dayRow(status: string, date: string, count: number, depositSum: number | null) {
  return {
    date: new Date(date + 'T00:00:00.000Z'),
    status,
    _count: { _all: count },
    _sum: { depositAmount: depositSum },
  };
}

describe('buildAnalyticsRange', () => {
  it('tạo đúng days key liên tiếp tính đến hôm nay, biên [from, toExclusive) khớp', () => {
    const now = new Date('2026-08-24T15:30:00.000Z');
    const range = buildAnalyticsRange(3, now);
    expect(range.keys).toEqual(['2026-08-22', '2026-08-23', '2026-08-24']);
    expect(range.from.toISOString()).toBe('2026-08-22T00:00:00.000Z');
    expect(range.toExclusive.toISOString()).toBe('2026-08-25T00:00:00.000Z');
  });

  it('days = 1 -> chỉ hôm nay', () => {
    const range = buildAnalyticsRange(1, new Date('2026-01-02T23:59:59.000Z'));
    expect(range.keys).toEqual(['2026-01-02']);
  });
});

describe('computeCancelRate', () => {
  it('(hủy + no-show) / tổng, làm tròn 4 chữ số', () => {
    expect(computeCancelRate(2, 1, 5)).toBe(0.6);
    expect(computeCancelRate(1, 0, 3)).toBe(0.3333);
  });

  it('không có đơn -> 0 (tránh chia 0)', () => {
    expect(computeCancelRate(0, 0, 0)).toBe(0);
  });
});

describe('AnalyticsService.getOwnerAnalytics', () => {
  let prisma: { booking: { groupBy: jest.Mock }; court: { findMany: jest.Mock } };
  let venues: { canManageVenue: jest.Mock };
  let service: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = { booking: { groupBy: jest.fn() }, court: { findMany: jest.fn() } };
    venues = { canManageVenue: jest.fn().mockResolvedValue({ id: VENUE_ID, name: 'Sân Test' }) };
    service = new AnalyticsService(
      prisma as unknown as PrismaService,
      venues as unknown as VenuesService,
    );
  });

  /** Route groupBy theo tham số by: ['date','status'] | ['courtId'] (có/không lọc status). */
  function mockGroupBy(dayRows: object[], allCourtRows: object[], confirmedCourtRows: object[]) {
    prisma.booking.groupBy.mockImplementation(async (args: { by: string[]; where?: object }) => {
      if (args.by[0] === 'date') return dayRows;
      const filtered = Boolean((args.where as { status?: unknown })?.status);
      return filtered ? confirmedCourtRows : allCourtRows;
    });
  }

  it('tính đúng summary + series zero-fill + topCourts từ dữ liệu groupBy', async () => {
    const today = todayKey();
    // 2 COMPLETED (100k + 120k), 1 CANCELLED (50k - KHÔNG tính doanh thu), sân B: 1 CONFIRMED 300k, 1 NO_SHOW 70k.
    mockGroupBy(
      [
        dayRow('COMPLETED', today, 2, 220_000),
        dayRow('CANCELLED', today, 1, 50_000),
        dayRow('CONFIRMED', today, 1, 300_000),
        dayRow('NO_SHOW', today, 1, 70_000),
      ],
      [
        { courtId: COURT_A, _count: { _all: 3 } },
        { courtId: COURT_B, _count: { _all: 2 } },
      ],
      [
        { courtId: COURT_A, _count: { _all: 2 }, _sum: { depositAmount: 220_000 } },
        { courtId: COURT_B, _count: { _all: 1 }, _sum: { depositAmount: 300_000 } },
      ],
    );
    prisma.court.findMany.mockResolvedValue([
      { id: COURT_A, name: 'Sân A' },
      { id: COURT_B, name: 'Sân B' },
      { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', name: 'Sân C trống' },
    ]);

    const res = await service.getOwnerAnalytics({ id: 'u1', role: 'OWNER' }, VENUE_ID, 3);

    // Ownership check luôn chạy trước.
    expect(venues.canManageVenue).toHaveBeenCalledWith(VENUE_ID, { id: 'u1', role: 'OWNER' });

    expect(res.summary).toEqual({
      revenueConfirmed: 520_000, // 100k + 120k + 300k; bỏ 50k hủy và 70k no-show
      totalBookings: 5,
      cancelledCount: 1,
      noShowCount: 1,
      cancelRate: 0.4,
    });

    expect(res.meta).toMatchObject({
      venueId: VENUE_ID,
      venueName: 'Sân Test',
      days: 3,
      to: today,
    });
    expect(res.series).toHaveLength(3); // zero-fill đủ days điểm
    const last = res.series[res.series.length - 1];
    expect(last).toEqual({ date: today, bookings: 5, revenue: 520_000 });
    for (const point of res.series.slice(0, -1)) {
      expect(point).toEqual({ date: point.date, bookings: 0, revenue: 0 });
    }

    expect(res.topCourts).toEqual([
      { courtId: COURT_A, courtName: 'Sân A', bookings: 3, revenue: 220_000 },
      { courtId: COURT_B, courtName: 'Sân B', bookings: 2, revenue: 300_000 },
    ]); // xếp theo bookings giảm dần; sân không có đơn bị loại
  });

  it('groupBy lọc status in REVENUE_STATUSES cho nhánh doanh thu topCourts', async () => {
    const today = todayKey();
    mockGroupBy(
      [dayRow('CONFIRMED', today, 1, 90_000)],
      [],
      [{ courtId: COURT_A, _count: { _all: 1 }, _sum: { depositAmount: 90_000 } }],
    );
    prisma.court.findMany.mockResolvedValue([{ id: COURT_A, name: 'Sân A' }]);

    await service.getOwnerAnalytics({ id: 'u1', role: 'ADMIN' }, VENUE_ID, 7);

    type CourtGroupArgs = { by: string[]; where?: { status?: { in?: string[] } } };
    const revenueCall = (prisma.booking.groupBy.mock.calls as [CourtGroupArgs][])
      .map(([args]) => args)
      .find((args) => args.by[0] === 'courtId' && Boolean(args.where?.status?.in));
    expect(revenueCall?.where?.status?.in).toEqual(['CONFIRMED', 'CHECKED_IN', 'COMPLETED']);
  });

  it('khoảng rỗng -> series toàn 0, cancelRate 0, topCourts rỗng', async () => {
    mockGroupBy([], [], []);
    prisma.court.findMany.mockResolvedValue([{ id: COURT_A, name: 'Sân A' }]);

    const res = await service.getOwnerAnalytics({ id: 'u1', role: 'OWNER' }, VENUE_ID, 2);

    expect(res.summary).toEqual({
      revenueConfirmed: 0,
      totalBookings: 0,
      cancelledCount: 0,
      noShowCount: 0,
      cancelRate: 0,
    });
    expect(res.series).toHaveLength(2);
    expect(res.series.every((p) => p.bookings === 0 && p.revenue === 0)).toBe(true);
    expect(res.topCourts).toEqual([]);
  });

  it('owner khác venue -> ForbiddenException từ canManageVenue, không chạm DB', async () => {
    venues.canManageVenue.mockRejectedValue(new ForbiddenException());
    await expect(
      service.getOwnerAnalytics({ id: 'u2', role: 'OWNER' }, VENUE_ID, 30),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.booking.groupBy).not.toHaveBeenCalled();
  });
});
