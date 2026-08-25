/**
 * Dashboard thống kê chủ sân (§3.10 — Giai đoạn 2).
 * KPI doanh thu/lượt đặt/tỷ lệ hủy/no-show + biểu đồ theo ngày (Chart.js)
 * + xếp hạng sân con. Dữ liệu: GET /owner/analytics qua useOwnerAnalytics.
 */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { Banknote, BarChart3, CalendarX2, ListOrdered, TrendingUp, UserX } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { Chart } from 'react-chartjs-2';

import { cn } from '../../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';

import {
  computeCancelRate,
  computeNoShowRate,
  formatPercent,
  shortDateLabel,
} from '../analytics-utils';
import { formatVnd } from '../format';
import { useMyVenues, useOwnerAnalytics } from '../queries';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
);

/** Màu chủ đạo dark-friendly theo đặc tả: xanh lá #16a34a cho cột doanh thu. */
const COLOR_REVENUE = '#16a34a';
/** Màu bổ trợ cho đường lượt đặt — nổi trên cả nền sáng và tối. */
const COLOR_BOOKINGS = '#f59e0b';
const COLOR_TICK = '#94a3b8';
const COLOR_GRID = 'rgba(148, 163, 184, 0.16)';

const RANGE_OPTIONS = [7, 30, 90] as const;

/** Nén số tiền cho trục y: 1200000 -> '1,2tr' · 45000 -> '45k'. */
function compactMoney(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return (Math.round((value / 1_000_000) * 10) / 10).toString().replace('.', ',') + 'tr';
  }
  if (Math.abs(value) >= 1000) return Math.round(value / 1000) + 'k';
  return String(Math.round(value));
}
function KpiCard(options: {
  icon: ReactElement;
  label: string;
  value: string;
  testId: string;
}): ReactElement {
  const { icon, label, value, testId } = options;
  return (
    <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-score text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            {icon}
          </span>
        </div>
        <p
          data-testid={testId}
          className="font-score text-2xl font-extrabold tabular-nums tracking-tight sm:text-3xl"
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function StatisticsSkeleton(): ReactElement {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải thống kê">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-80" />
      <Skeleton className="h-48" />
    </div>
  );
}
/** Biểu đồ hỗn hợp: cột doanh thu (trục trái) + đường lượt đặt (trục phải). */
function RevenueBookingsChart(options: {
  series: Array<{ date: string; bookings: number; revenue: number }>;
}): ReactElement {
  const { series } = options;
  // Mixed bar+line: ChartData<'bar'> không mô tả được dataset 'line' nên ép kiểu tại đây.
  const data = {
    labels: series.map((point) => shortDateLabel(point.date)),
    datasets: [
      {
        type: 'bar',
        label: 'Doanh thu',
        data: series.map((point) => point.revenue),
        backgroundColor: COLOR_REVENUE,
        borderRadius: 3,
        maxBarThickness: 18,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Lượt đặt',
        data: series.map((point) => point.bookings),
        borderColor: COLOR_BOOKINGS,
        backgroundColor: COLOR_BOOKINGS,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.35,
        yAxisID: 'y1',
      },
    ],
  } as unknown as ChartData<'bar'>;
  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        ticks: { color: COLOR_TICK, maxTicksLimit: 12, maxRotation: 0, autoSkip: true },
        grid: { display: false },
      },
      y: {
        position: 'left',
        ticks: { color: COLOR_TICK, callback: (value) => compactMoney(Number(value)) },
        grid: { color: COLOR_GRID },
      },
      y1: {
        position: 'right',
        ticks: { color: COLOR_TICK, precision: 0 },
        grid: { drawOnChartArea: false },
      },
    },
    plugins: {
      legend: { labels: { color: COLOR_TICK, usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        callbacks: {
          label: (item) =>
            item.datasetIndex === 0
              ? 'Doanh thu: ' + formatVnd(Number(item.raw))
              : 'Lượt đặt: ' + String(item.raw),
        },
      },
    },
  };
  return (
    <div className="h-72" data-testid="revenue-chart">
      <Chart type="bar" data={data} options={chartOptions} />
    </div>
  );
}
/** Bảng xếp hạng sân con theo lượt đặt — backend đã sắp sẵn, render giữ nguyên thứ hạng. */
function TopCourtsTable(options: {
  rows: Array<{ courtId: string; courtName: string; bookings: number; revenue: number }>;
}): ReactElement {
  const { rows } = options;
  return (
    <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
      <CardHeader className="flex-row items-center gap-2 pb-0">
        <ListOrdered className="size-4 text-muted-foreground" aria-hidden />
        <CardTitle className="text-base">Top sân con chạy nhất</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 font-score text-[11px] font-semibold uppercase tracking-widest">
                #
              </TableHead>
              <TableHead className="font-score text-[11px] font-semibold uppercase tracking-widest">
                Sân con
              </TableHead>
              <TableHead className="text-right font-score text-[11px] font-semibold uppercase tracking-widest">
                Lượt đặt
              </TableHead>
              <TableHead className="text-right font-score text-[11px] font-semibold uppercase tracking-widest">
                Doanh thu
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.courtId}>
                <TableCell className="font-score text-xs text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium">{row.courtName}</TableCell>
                <TableCell className="text-right font-score text-xs tabular-nums">
                  {row.bookings}
                </TableCell>
                <TableCell className="text-right font-score text-xs tabular-nums">
                  {formatVnd(row.revenue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
/** Trang /dashboard/statistics — thay placeholder Giai đoạn 2. */
export function StatisticsPage(): ReactElement {
  const [days, setDays] = useState<number>(30);
  const [venueId, setVenueId] = useState<string>('');

  const venuesQuery = useMyVenues();
  const venues = venuesQuery.data?.items ?? [];
  // Chưa chọn cụm nào -> dùng cụm đầu tiên (owner thường chỉ có 1).
  const activeVenueId = venueId !== '' ? venueId : (venues[0]?.id ?? '');
  const analyticsQuery = useOwnerAnalytics({ venueId: activeVenueId, days });
  const data = analyticsQuery.data;
  const summary = data?.summary;

  // isLoading = pending && fetching: query bị disable (chưa chọn được sân)
  // vẫn ở pending mãi -> phải dùng isLoading để không kẹt skeleton.
  const showSkeleton = venuesQuery.isPending || analyticsQuery.isLoading;
  const hasNoVenue = !venuesQuery.isPending && venues.length === 0;
  const isEmpty = summary !== undefined && summary.totalBookings === 0;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Thống kê</h1>
        <p className="text-sm text-muted-foreground">
          Doanh thu, lượt đặt và xếp hạng sân con theo khoảng thời gian.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        {venues.length > 1 && (
          <div className="w-full max-w-56 space-y-1.5">
            <Label htmlFor="st-venue">Cụm sân</Label>
            <select
              id="st-venue"
              value={activeVenueId}
              onChange={(event) => setVenueId(event.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Khoảng thời gian</Label>
          <div
            role="group"
            aria-label="Chọn khoảng thời gian"
            className="flex gap-1 rounded-lg border border-input bg-card p-1"
          >
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={days === option}
                onClick={() => setDays(option)}
                className={cn(
                  'h-9 rounded-md px-3 text-sm transition-colors',
                  days === option
                    ? 'bg-primary font-semibold text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {option} ngày
              </button>
            ))}
          </div>
        </div>
      </div>
      {showSkeleton ? (
        <StatisticsSkeleton />
      ) : analyticsQuery.isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-medium">Không tải được thống kê</p>
            <p className="text-sm text-muted-foreground">Vui lòng thử lại sau ít phút.</p>
          </CardContent>
        </Card>
      ) : hasNoVenue ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <BarChart3 className="mb-2 size-8 opacity-50" aria-hidden />
            <p className="font-medium">Chưa có cụm sân nào</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Tạo cụm sân trong mục Cụm sân để bắt đầu xem thống kê.
            </p>
          </CardContent>
        </Card>
      ) : isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <BarChart3 className="mb-2 size-8 opacity-50" aria-hidden />
            <p className="font-medium">Chưa có đơn đặt nào trong kỳ</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Thống kê sẽ xuất hiện khi có đơn đặt trong {days} ngày qua.
            </p>
          </CardContent>
        </Card>
      ) : data !== undefined && summary !== undefined ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              icon={<Banknote className="size-4" aria-hidden />}
              label="Doanh thu kỳ"
              value={formatVnd(summary.revenueConfirmed)}
              testId="kpi-revenue"
            />
            <KpiCard
              icon={<TrendingUp className="size-4" aria-hidden />}
              label="Tổng lượt đặt"
              value={summary.totalBookings.toLocaleString('vi-VN')}
              testId="kpi-bookings"
            />
            <KpiCard
              icon={<CalendarX2 className="size-4" aria-hidden />}
              label="Tỷ lệ hủy"
              value={formatPercent(
                computeCancelRate(summary.cancelledCount, summary.totalBookings),
              )}
              testId="kpi-cancel-rate"
            />
            <KpiCard
              icon={<UserX className="size-4" aria-hidden />}
              label="Tỷ lệ no-show"
              value={formatPercent(computeNoShowRate(summary.noShowCount, summary.totalBookings))}
              testId="kpi-noshow-rate"
            />
          </div>

          <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Doanh thu & lượt đặt theo ngày</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <RevenueBookingsChart series={data.series} />
            </CardContent>
          </Card>

          {data.topCourts.length > 0 && <TopCourtsTable rows={data.topCourts} />}
        </>
      ) : null}
    </div>
  );
}
