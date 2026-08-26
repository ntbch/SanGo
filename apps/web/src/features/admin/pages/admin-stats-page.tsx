/**
 * Trang Thống kê nền tảng (t6) — chỉ đọc cho ADMIN:
 * 4 KPI card, biểu đồ Line/Bar bookings+revenueVnd theo ?days= (7/14/30/90),
 * bảng top cụm sân và feed hoạt động gần đây. Dữ liệu: GET /admin/stats?days=N
 * qua useAdminStats(['admin','stats',days]). KHÔNG có hành động duyệt/huỷ.
 */
import { CalendarDays, ShieldCheck, Users } from 'lucide-react';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { RevenueBookingsChart } from '../../../components/charts/revenue-bookings-chart';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { formatActivityTime } from '../format';
import { useAdminStats } from '../queries';
import type { AdminActivityType } from '../types';
import { formatVnd } from '../../public/format';
import { friendlyApiMessage } from '../../../lib/api/api-error';

/** Icon feed theo loại sự kiện — VENUE_SUBMITTED nổi hơn BOOKING_CREATED. */
const ACTIVITY_META: Record<AdminActivityType, { icon: ReactElement; badge: string }> = {
  VENUE_SUBMITTED: {
    icon: <ShieldCheck className="size-4 text-primary" aria-hidden />,
    badge: 'Sân',
  },
  BOOKING_CREATED: {
    icon: <CalendarDays className="size-4 text-muted-foreground" aria-hidden />,
    badge: 'Đơn',
  },
};

function KpiCard(options: {
  label: string;
  value: string;
  hint?: string;
  testId: string;
}): ReactElement {
  const { label, value, hint, testId } = options;
  return (
    <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
      <CardHeader className="pb-2">
        <CardDescription className="text-xs font-semibold uppercase tracking-wide">
          {label}
        </CardDescription>
        <CardTitle
          className="font-score text-3xl font-extrabold tabular-nums tracking-tight"
          data-testid={testId}
        >
          {value}
        </CardTitle>
      </CardHeader>
      {hint ? <CardContent className="text-xs text-muted-foreground">{hint}</CardContent> : null}
    </Card>
  );
}

export function AdminStatsPage(): ReactElement {
  const [days, setDays] = useState<number>(14);
  const statsQuery = useAdminStats(days);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Thống kê nền tảng</h1>
        <p className="text-sm text-muted-foreground">
          Toàn cảnh người dùng, cụm sân và đơn đặt trên SanGo — chỉ xem, không thao tác.
        </p>
      </header>

      {/* Bộ chọn khoảng ngày — đổi tham số đọc ?days=, không tác động dữ liệu */}
      <div
        className="flex gap-1"
        role="group"
        aria-label="Chọn khoảng ngày thống kê"
        data-testid="admin-range-group"
      >
        {[7, 14, 30, 90].map((option) => (
          <Button
            key={option}
            size="sm"
            variant={days === option ? 'default' : 'outline'}
            aria-pressed={days === option}
            onClick={() => setDays(option)}
            data-testid={'admin-range-' + option}
          >
            {option} ngày
          </Button>
        ))}
      </div>

      {statsQuery.isPending ? (
        <section
          data-testid="admin-stats-skeleton"
          role="status"
          aria-label={'Đang tải thống kê nền tảng ' + days + ' ngày'}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </section>
      ) : statsQuery.isError || !statsQuery.data ? (
        <div
          data-testid="admin-stats-error"
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          Không tải được thống kê nền tảng.{' '}
          {statsQuery.error ? friendlyApiMessage(statsQuery.error) : null}
        </div>
      ) : (
        (() => {
          const { totals, series, topVenues, recentActivity } = statsQuery.data;
          // Chuỗi admin dùng revenueVnd — map sang shape chung của biểu đồ.
          const chartSeries = series.map((point) => ({
            date: point.date,
            bookings: point.bookings,
            revenue: point.revenueVnd,
          }));

          return (
            <>
              {/* 4 KPI card bắt buộc theo t6 */}
              <div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                data-testid="admin-stats-kpis"
              >
                <KpiCard
                  label="Người dùng"
                  value={String(totals.users)}
                  hint={
                    String(totals.customers) + ' khách hàng · ' + String(totals.owners) + ' chủ sân'
                  }
                  testId="admin-kpi-users"
                />
                <KpiCard
                  label="Cụm sân APPROVED"
                  value={String(totals.venues.APPROVED)}
                  hint={'Tổng ' + String(totals.venues.total) + ' cụm sân'}
                  testId="admin-kpi-venues-approved"
                />
                <KpiCard
                  label="Đơn hôm nay"
                  value={String(totals.bookingsToday)}
                  hint={'Tổng cộng ' + String(totals.bookingsTotal) + ' đơn đã tạo'}
                  testId="admin-kpi-bookings-today"
                />
                <KpiCard
                  label="Doanh thu hôm nay"
                  value={formatVnd(totals.revenueTodayVnd)}
                  testId="admin-kpi-revenue-today"
                />
              </div>

              {/* Biểu đồ Line/Bar 2 dataset theo days đang chọn */}
              <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
                <CardHeader>
                  <CardTitle>Lượt đặt & doanh thu {days} ngày</CardTitle>
                  <CardDescription>Theo ngày trên toàn hệ thống.</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartSeries.length === 0 ? (
                    <p
                      data-testid="admin-stats-chart-empty"
                      className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground"
                    >
                      Chưa có dữ liệu chuỗi ngày trong kỳ này.
                    </p>
                  ) : (
                    <RevenueBookingsChart series={chartSeries} testId="admin-stats-chart" />
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Bảng top cụm sân */}
                <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
                  <CardHeader>
                    <CardTitle>Top cụm sân</CardTitle>
                    <CardDescription>Xếp theo lượt đặt trong kỳ thống kê.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topVenues.length === 0 ? (
                      <p
                        data-testid="admin-top-venues-empty"
                        className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground"
                      >
                        Chưa có dữ liệu xếp hạng.
                      </p>
                    ) : (
                      <Table data-testid="admin-top-venues">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cụm sân</TableHead>
                            <TableHead className="text-right">Lượt đặt</TableHead>
                            <TableHead className="text-right">Doanh thu</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topVenues.map((venue, index) => (
                            <TableRow
                              key={venue.venueId}
                              data-testid={'admin-top-venue-row-' + index}
                            >
                              <TableCell className="font-medium">{venue.name}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {venue.bookings}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatVnd(venue.revenueVnd)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Feed hoạt động gần đây — icon theo type */}
                <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
                  <CardHeader>
                    <CardTitle>Hoạt động gần đây</CardTitle>
                    <CardDescription>Sự kiện mới nhất trên nền tảng.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentActivity.length === 0 ? (
                      <p
                        data-testid="admin-activity-empty"
                        className="flex items-center justify-center rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground"
                      >
                        <Users className="mr-2 size-4 opacity-50" aria-hidden />
                        Chưa có hoạt động nào.
                      </p>
                    ) : (
                      <ul className="space-y-3" data-testid="admin-activity-list">
                        {recentActivity.map((activity, index) => {
                          const meta = ACTIVITY_META[activity.type];
                          return (
                            <li
                              key={activity.type + '-' + activity.at + '-' + index}
                              data-testid={'admin-activity-item-' + index}
                              className="flex items-start gap-3 rounded-lg border border-border/60 px-3 py-2"
                            >
                              <span className="mt-0.5">{meta.icon}</span>
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <p className="truncate text-sm font-semibold">{activity.label}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatActivityTime(activity.at)}
                                </p>
                              </div>
                              <Badge variant="outline">{meta.badge}</Badge>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          );
        })()
      )}
    </div>
  );
}
