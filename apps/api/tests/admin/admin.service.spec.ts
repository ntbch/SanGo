/**
 * Unit test AdminService.getStats (GET /admin/stats) — mock toàn bộ PrismaService.
 * Kiểm chứng: totals theo role/status (SUSPENDED trả 0 khi enum chưa có), doanh thu
 * = SUM(Payment PAID && type != REFUND), series zero-fill đủ `days` điểm,
 * topVenues top 5 theo bookings, recentActivity trộn 8 sự kiện mới nhất,
 * và schema query days: 1..90 default 14.
 */
import { vnToday } from '@sango/shared';
import { AdminService } from '../../src/admin/admin.service';
import { AdminStatsQuerySchema } from '../../src/admin/dto/admin.dto';
import type { PrismaService } from '../../src/prisma/prisma.service';

jest.mock('../../src/prisma/prisma.service', () => ({
  PrismaService: class {},
}));

const COURT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const COURT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const COURT_C = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const VENUE_1 = '11111111-1111-4111-8111-111111111111';
const VENUE_2 = '22222222-2222-4222-8222-222222222222';
const VENUE_3 = '33333333-3333-4333-8333-333333333333';

/** Mốc "hôm nay" cố định: 2026-08-26 17:00 ICT -> ngày kinh doanh VN 2026-08-26. */
const NOW = new Date('2026-08-26T10:00:00.000Z');

function ts(iso: string): Date {
  return new Date(iso);
}

describe('AdminService.getStats', () => {
  let prisma: {
    user: { groupBy: jest.Mock };
    venue: { groupBy: jest.Mock; findMany: jest.Mock };
    booking: { count: jest.Mock; groupBy: jest.Mock; findMany: jest.Mock };
    payment: { findMany: jest.Mock };
    court: { findMany: jest.Mock };
  };
  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = {
      user: { groupBy: jest.fn() },
      venue: { groupBy: jest.fn(), findMany: jest.fn() },
      booking: { count: jest.fn(), groupBy: jest.fn(), findMany: jest.fn() },
      payment: { findMany: jest.fn() },
      court: { findMany: jest.fn() },
    };
    service = new AdminService(prisma as unknown as PrismaService);

    prisma.user.groupBy.mockResolvedValue([
      { role: 'CUSTOMER', _count: { _all: 40 } },
      { role: 'OWNER', _count: { _all: 7 } },
      { role: 'ADMIN', _count: { _all: 1 } },
    ]);
    prisma.venue.groupBy.mockResolvedValue([
      { status: 'PENDING', _count: { _all: 2 } },
      { status: 'APPROVED', _count: { _all: 5 } },
    ]);
    // count(): không where = bookingsTotal, có where = bookingsToday.
    prisma.booking.count.mockImplementation(async (args?: { where?: unknown }) =>
      args?.where ? 4 : 120,
    );
    // groupBy(booking): route theo by[0] = 'date' | 'courtId'.
    prisma.booking.groupBy.mockImplementation(async (args: { by: string[] }) => {
      if (args.by[0] === 'date') {
        return [
          { date: ts('2026-08-25T00:00:00.000Z'), _count: { _all: 3 } },
          { date: ts('2026-08-26T00:00:00.000Z'), _count: { _all: 2 } },
        ];
      }
      return [
        { courtId: COURT_A, _count: { _all: 3 } },
        { courtId: COURT_B, _count: { _all: 1 } },
        { courtId: COURT_C, _count: { _all: 1 } },
      ];
    });
    // Doanh thu trong khoảng: V1 hôm nay +200k, V2 ngày 25 +100k,
    // V3 chỉ có doanh thu (không có booking trong khoảng).
    prisma.payment.findMany.mockResolvedValue([
      {
        amount: 200_000,
        paidAt: ts('2026-08-26T02:00:00.000Z'),
        booking: { court: { venueId: VENUE_1 } },
      },
      {
        amount: 100_000,
        paidAt: ts('2026-08-25T15:00:00.000Z'),
        booking: { court: { venueId: VENUE_2 } },
      },
      {
        amount: 70_000,
        paidAt: ts('2026-08-24T09:00:00.000Z'),
        booking: { court: { venueId: VENUE_3 } },
      },
    ]);
    prisma.court.findMany.mockResolvedValue([
      { id: COURT_A, venueId: VENUE_1, venue: { id: VENUE_1, name: 'Sân Một' } },
      { id: COURT_B, venueId: VENUE_1, venue: { id: VENUE_1, name: 'Sân Một' } },
      { id: COURT_C, venueId: VENUE_2, venue: { id: VENUE_2, name: 'Sân Hai' } },
    ]);
    prisma.venue.findMany.mockResolvedValue([
      { id: VENUE_1, name: 'Sân t9', createdAt: ts('2026-08-26T09:00:00.000Z') },
      { id: VENUE_2, name: 'Sân t7', createdAt: ts('2026-08-26T07:00:00.000Z') },
      { id: VENUE_3, name: 'Sân t5', createdAt: ts('2026-08-26T05:00:00.000Z') },
      { id: 'v4', name: 'Sân t3', createdAt: ts('2026-08-26T03:00:00.000Z') },
      { id: 'v5', name: 'Sân t1', createdAt: ts('2026-08-26T01:00:00.000Z') },
    ]);
    prisma.booking.findMany.mockResolvedValue([
      {
        code: 'CH-20260826-0001',
        createdAt: ts('2026-08-26T10:00:00.000Z'),
        customer: { fullName: 'Nguyễn Văn A' },
        court: { venue: { name: 'Sân Một' } },
      },
      {
        code: 'CH-20260826-0002',
        createdAt: ts('2026-08-26T08:00:00.000Z'),
        customer: { fullName: 'Trần Thị B' },
        court: { venue: { name: 'Sân Hai' } },
      },
      {
        code: 'CH-20260826-0003',
        createdAt: ts('2026-08-26T06:00:00.000Z'),
        customer: { fullName: 'Lê C' },
        court: { venue: { name: 'Sân Một' } },
      },
      {
        code: 'CH-20260826-0004',
        createdAt: ts('2026-08-26T04:00:00.000Z'),
        customer: { fullName: 'Phạm D' },
        court: { venue: { name: 'Sân Hai' } },
      },
      {
        code: 'CH-20260826-0005',
        createdAt: ts('2026-08-26T02:00:00.000Z'),
        customer: { fullName: 'Hoàng E' },
        court: { venue: { name: 'Sân Một' } },
      },
    ]);
  });

  it('tính đúng totals: users theo role, venues theo status (SUSPENDED=0), bookingsToday/revenueToday', async () => {
    const res = await service.getStats(3, NOW);
    expect(res.totals).toEqual({
      users: 48,
      customers: 40,
      owners: 7,
      venues: { total: 7, PENDING: 2, APPROVED: 5, REJECTED: 0, SUSPENDED: 0 },
      bookingsTotal: 120,
      bookingsToday: 4,
      revenueTodayVnd: 200_000,
    });
  });

  it('định nghĩa doanh thu: WHERE Payment status=PAID AND type != REFUND AND paidAt trong khoảng', async () => {
    await service.getStats(3, NOW);
    expect(prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'PAID',
          type: { not: 'REFUND' },
          paidAt: expect.anything(),
        }),
      }),
    );
    const where = (
      prisma.payment.findMany.mock.calls[0][0] as {
        where: { paidAt: { gte: Date; lt: Date } };
      }
    ).where.paidAt;
    expect(where.gte.toISOString()).toBe('2026-08-24T00:00:00.000Z');
    expect(where.lt.toISOString()).toBe('2026-08-27T00:00:00.000Z');
  });

  it('series đủ days điểm zero-fill; bookings theo ngày chơi, revenueVnd theo paidAt', async () => {
    const res = await service.getStats(3, NOW);
    expect(res.series).toEqual([
      { date: '2026-08-24', bookings: 0, revenueVnd: 70_000 },
      { date: '2026-08-25', bookings: 3, revenueVnd: 100_000 },
      { date: '2026-08-26', bookings: 2, revenueVnd: 200_000 },
    ]);
    // Ngày cuối của chuỗi luôn là hôm nay theo ngày kinh doanh VN.
    expect(res.series[res.series.length - 1].date).toBe(vnToday(NOW));
  });

  it('topVenues gom theo venue qua court, sắp theo bookings rồi doanh thu, giới hạn 5', async () => {
    const res = await service.getStats(3, NOW);
    expect(res.topVenues).toEqual([
      { venueId: VENUE_1, name: 'Sân Một', bookings: 4, revenueVnd: 200_000 },
      { venueId: VENUE_2, name: 'Sân Hai', bookings: 1, revenueVnd: 100_000 },
      { venueId: VENUE_3, name: '', bookings: 0, revenueVnd: 70_000 },
    ]);
    expect(prisma.court.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [COURT_A, COURT_B, COURT_C] } },
      }),
    );
  });

  it('recentActivity: trộn sân mới nộp + đơn mới đặt, sort mới nhất trước, đúng 8 sự kiện', async () => {
    const res = await service.getStats(3, NOW);
    expect(res.recentActivity).toHaveLength(8); // 5 venue + 5 booking -> cắt còn 8
    expect(res.recentActivity.map((e) => e.type)).toEqual([
      'BOOKING_CREATED',
      'VENUE_SUBMITTED',
      'BOOKING_CREATED',
      'VENUE_SUBMITTED',
      'BOOKING_CREATED',
      'VENUE_SUBMITTED',
      'BOOKING_CREATED',
      'VENUE_SUBMITTED',
    ]);
    expect(res.recentActivity[0]).toEqual({
      type: 'BOOKING_CREATED',
      at: '2026-08-26T10:00:00.000Z',
      label: 'CH-20260826-0001 · Nguyễn Văn A @ Sân Một',
    });
    expect(res.recentActivity[1]).toEqual({
      type: 'VENUE_SUBMITTED',
      at: '2026-08-26T09:00:00.000Z',
      label: 'Sân t9',
    });
    // ISO timestamp tăng dần tuổi (mới nhất đầu tiên).
    const times = res.recentActivity.map((e) => e.at);
    expect([...times].sort().reverse()).toEqual(times);
  });

  it('bookingsToday đếm đơn có ngày chơi hôm nay theo biên ngày VN', async () => {
    await service.getStats(3, NOW);
    const todayWhere = (
      prisma.booking.count.mock.calls.find((c) => (c[0] as { where?: unknown })?.where)?.[0] as {
        where: { date: { gte: Date; lt: Date } };
      }
    ).where.date;
    expect(todayWhere.gte.toISOString()).toBe('2026-08-26T00:00:00.000Z');
    expect(todayWhere.lt.toISOString()).toBe('2026-08-27T00:00:00.000Z');
  });
});

describe('AdminStatsQuerySchema', () => {
  it('mặc định days=14, coerce chuỗi số, chặn ngoài 1..90 và số lẻ', () => {
    expect(AdminStatsQuerySchema.parse({})).toEqual({ days: 14 });
    expect(AdminStatsQuerySchema.parse({ days: '7' })).toEqual({ days: 7 });
    expect(AdminStatsQuerySchema.parse({ days: 90 })).toEqual({ days: 90 });
    expect(() => AdminStatsQuerySchema.parse({ days: 0 })).toThrow();
    expect(() => AdminStatsQuerySchema.parse({ days: 91 })).toThrow();
    expect(() => AdminStatsQuerySchema.parse({ days: 1.5 })).toThrow();
    expect(() => AdminStatsQuerySchema.parse({ days: 'abc' })).toThrow();
  });
});
