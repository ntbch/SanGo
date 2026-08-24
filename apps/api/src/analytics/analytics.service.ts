import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { VenuesService } from '../venues/venues.service';
import type {
  OwnerAnalyticsResponse,
  OwnerAnalyticsSeriesPoint,
  OwnerAnalyticsTopCourt,
} from './dto/analytics.dto';

/**
 * Trạng thái đơn đủ điều kiện tính doanh thu xác nhận (task G2-B1):
 * CHỈ cộng depositAmount — không truy payments để tránh phức tạp hoàn cọc.
 */
export const REVENUE_STATUSES = ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] as const;
const REVENUE_STATUS_SET: ReadonlySet<string> = new Set(REVENUE_STATUSES);

export const DAY_MS = 86_400_000;

/** Đầu ngày UTC (ms) của một thời điểm. Booking.date là cột DATE -> so khớp theo biên UTC. */
function utcMidnightMs(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Key YYYY-MM-DD từ DateTime mà Prisma trả về cho cột @db.Date. */
export function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Khoảng thống kê [from, toExclusive) gồm đúng `days` ngày UTC tính đến hôm nay,
 * kèm danh sách key YYYY-MM-DD đầy đủ để zero-fill chuỗi ngày.
 */
export function buildAnalyticsRange(days: number, now: Date = new Date()) {
  const toExclusiveMs = utcMidnightMs(now) + DAY_MS;
  const fromMs = toExclusiveMs - days * DAY_MS;
  const keys: string[] = [];
  for (let ms = fromMs; ms < toExclusiveMs; ms += DAY_MS) {
    keys.push(new Date(ms).toISOString().slice(0, 10));
  }
  return { from: new Date(fromMs), toExclusive: new Date(toExclusiveMs), keys };
}

/** Tỷ lệ hủy + no-show trên tổng đơn, làm tròn 4 chữ số thập phân; 0 khi chưa có đơn. */
export function computeCancelRate(
  cancelledCount: number,
  noShowCount: number,
  totalBookings: number,
): number {
  if (totalBookings <= 0) return 0;
  return Math.round(((cancelledCount + noShowCount) / totalBookings) * 10_000) / 10_000;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly venues: VenuesService,
  ) {}

  /**
   * Dashboard chủ sân (đặc tả §3.10): doanh thu xác nhận, tổng đơn, tỷ lệ hủy/no-show,
   * chuỗi theo NGÀY và xếp hạng sân con chạy nhất trong `days` ngày gần nhất.
   * Toàn bộ tính trên bảng bookings bằng Prisma groupBy — không đuổi payments.
   */
  async getOwnerAnalytics(
    user: Pick<User, 'id' | 'role'>,
    venueId: string,
    days: number,
  ): Promise<OwnerAnalyticsResponse> {
    // Ownership check §7: owner của venue hoặc ADMIN; trả venue để lấy tên hiển thị.
    const venue = await this.venues.canManageVenue(venueId, user);
    const { from, toExclusive, keys } = buildAnalyticsRange(days);
    const rangeWhere: Prisma.BookingWhereInput = {
      court: { venueId },
      date: { gte: from, lt: toExclusive },
    };

    // Một groupBy duy nhất theo (date, status) là đủ cho cả summary lẫn series.
    const byDayStatus = await this.prisma.booking.groupBy({
      by: ['date', 'status'],
      where: rangeWhere,
      _count: { _all: true },
      _sum: { depositAmount: true },
    });

    let revenueConfirmed = 0;
    let totalBookings = 0;
    let cancelledCount = 0;
    let noShowCount = 0;
    const bookingsByDay = new Map<string, number>();
    const revenueByDay = new Map<string, number>();
    for (const row of byDayStatus) {
      const key = dayKey(row.date);
      const count = row._count._all;
      totalBookings += count;
      if (row.status === 'CANCELLED') cancelledCount += count;
      else if (row.status === 'NO_SHOW') noShowCount += count;
      if (REVENUE_STATUS_SET.has(row.status)) {
        const revenue = row._sum.depositAmount ?? 0;
        revenueConfirmed += revenue;
        revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + revenue);
      }
      bookingsByDay.set(key, (bookingsByDay.get(key) ?? 0) + count);
    }

    const series: OwnerAnalyticsSeriesPoint[] = keys.map((date) => ({
      date,
      bookings: bookingsByDay.get(date) ?? 0,
      revenue: revenueByDay.get(date) ?? 0,
    }));

    // Xếp hạng sân con: đếm mọi đơn, doanh thu chỉ các đơn đã xác nhận; bỏ sân chưa có đơn.
    const [courts, allBookingsByCourt, confirmedByCourt] = await Promise.all([
      this.prisma.court.findMany({ where: { venueId }, select: { id: true, name: true } }),
      this.prisma.booking.groupBy({ by: ['courtId'], where: rangeWhere, _count: { _all: true } }),
      this.prisma.booking.groupBy({
        by: ['courtId'],
        where: { ...rangeWhere, status: { in: [...REVENUE_STATUSES] } },
        _count: { _all: true },
        _sum: { depositAmount: true },
      }),
    ]);
    const bookingsByCourt = new Map(allBookingsByCourt.map((r) => [r.courtId, r._count._all]));
    const revenueByCourt = new Map(
      confirmedByCourt.map((r) => [r.courtId, r._sum.depositAmount ?? 0]),
    );
    const topCourts: OwnerAnalyticsTopCourt[] = courts
      .map((court) => ({
        courtId: court.id,
        courtName: court.name,
        bookings: bookingsByCourt.get(court.id) ?? 0,
        revenue: revenueByCourt.get(court.id) ?? 0,
      }))
      .filter((court) => court.bookings > 0)
      .sort(
        (a, b) =>
          b.bookings - a.bookings ||
          b.revenue - a.revenue ||
          a.courtName.localeCompare(b.courtName),
      );

    return {
      meta: {
        venueId,
        venueName: venue.name,
        days,
        from: keys[0] ?? dayKey(from),
        to: keys[keys.length - 1] ?? dayKey(from),
      },
      summary: {
        revenueConfirmed,
        totalBookings,
        cancelledCount,
        noShowCount,
        cancelRate: computeCancelRate(cancelledCount, noShowCount, totalBookings),
      },
      series,
      topCourts,
    };
  }
}
