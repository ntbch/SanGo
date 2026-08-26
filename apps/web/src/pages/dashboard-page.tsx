import { UserRole } from '@sango/shared';
import { useQueries } from '@tanstack/react-query';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CalendarDays,
  Clock,
  MapPinned,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge, type BadgeProps } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { RevenueBookingsChart } from '../components/charts/revenue-bookings-chart';
import { Skeleton } from '../components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { useMyBookings } from '../features/booking/queries';
import type { CustomerBooking } from '../features/booking/types';
import { useAdminStats } from '../features/admin/queries';
import type { AdminActivityType } from '../features/admin/types';
import { formatActivityTime } from '../features/admin/format';
import { fetchMyVenues, fetchOwnerAnalytics, fetchOwnerBookings } from '../features/owner/api';
import { useMyVenues } from '../features/owner/queries';
import type { OwnerBooking } from '../features/owner/types';
import { formatReviewDate, formatVnd, minutesToTime } from '../features/public/format';
import { friendlyApiMessage } from '../lib/api/api-error';
import { useAuthStore } from '../lib/auth/auth-store';
import {
  aggregateOwnerKpis,
  estimateRevenueToday,
  mergeAnalyticsSeries,
  pickNearestBooking,
  todayIso,
} from './dashboard-utils';

/** Nhãn + màu badge theo trạng thái đơn — dùng chung customer/owner (đọc-only). */
const BOOKING_STATUS_META: Record<
  CustomerBooking['status'],
  { label: string; variant: BadgeProps['variant'] }
> = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', variant: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'success' },
  CHECKED_IN: { label: 'Đã check-in', variant: 'secondary' },
  COMPLETED: { label: 'Hoàn tất', variant: 'outline' },
  CANCELLED: { label: 'Đã huỷ', variant: 'destructive' },
  NO_SHOW: { label: 'Không đến', variant: 'destructive' },
};

function statusMeta(status: string): { label: string; variant: BadgeProps['variant'] } {
  return (
    BOOKING_STATUS_META[status as CustomerBooking['status']] ?? {
      label: status,
      variant: 'secondary' as const,
    }
  );
}

function greetingForRole(role: UserRole | undefined, fullName: string): string {
  switch (role) {
    case UserRole.OWNER:
      return `Xin chào ${fullName}! Đây là tình hình sân của bạn hôm nay.`;
    case UserRole.ADMIN:
      return `Xin chào ${fullName}! Theo dõi kiểm duyệt cụm sân trên hệ thống.`;
    default:
      return `Xin chào ${fullName}! Sẵn sàng cho trận đấu tiếp theo chưa?`;
  }
}

/* ----------------------------- CUSTOMER ----------------------------- */

/** Thẻ "Đơn sắp tới" — đơn upcoming gần nhất + CTA QR check-in / đặt sân. */
function CustomerUpcomingCard(): ReactElement {
  const query = useMyBookings({ filter: 'upcoming', page: 1 });

  if (query.isPending) {
    return (
      <Skeleton
        data-testid="customer-upcoming-skeleton"
        role="status"
        aria-label="Đang tải đơn sắp tới"
        className="h-56 w-full rounded-xl"
      />
    );
  }

  if (query.isError) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
      >
        {friendlyApiMessage(query.error)}
      </p>
    );
  }

  const nearest = pickNearestBooking(query.data?.items ?? []);

  // Empty state — mời khách đặt sân đầu tiên thay vì hiện thẻ rỗng.
  if (!nearest) {
    return (
      <div
        data-testid="customer-upcoming-empty"
        className="space-y-3 rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground"
      >
        <Calendar className="mx-auto mb-2 size-8 opacity-50" aria-hidden />
        <p>Bạn chưa có đơn nào sắp diễn ra — đặt sân đầu tiên ngay!</p>
        <Button asChild size="sm" className="rounded-lg font-bold">
          <Link to="/venues">
            Đặt sân đầu tiên
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    );
  }

  const status = statusMeta(nearest.status);

  return (
    <Card
      data-testid="customer-upcoming"
      className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow duration-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
    >
      <CardHeader>
        <CardTitle>Đơn sắp tới</CardTitle>
        <CardDescription>Trận đấu gần nhất của bạn tại SanGo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-score text-xs font-bold uppercase tracking-widest text-primary">
            {nearest.code}
          </span>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="space-y-1">
          <p className="text-lg font-bold leading-tight">
            {nearest.venueName} · {nearest.courtName}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-4" /> {formatReviewDate(nearest.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-4" /> {minutesToTime(nearest.startMinute)} –{' '}
              {minutesToTime(nearest.endMinute)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild className="rounded-lg font-bold">
            <Link to="/dashboard/my-bookings">
              <QrCode className="size-4" aria-hidden /> Xem QR check-in
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-lg font-bold">
            <Link to="/venues">
              Đặt sân ngay
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------- OWNER ------------------------------ */

/** Khoảng ngày xem xu hướng: 7/14/30 — chỉ đổi tham số đọc, không tác động dữ liệu. */
const RANGE_OPTIONS = [7, 14, 30] as const;

/** Thẻ biểu đồ xu hướng owner: gọi /owner/analytics từng sân rồi CỘNG DỒN chuỗi ngày. */
function OwnerTrendCard(options: { venues: ReadonlyArray<{ id: string }> }): ReactElement {
  const { venues } = options;
  const [days, setDays] = useState<(typeof RANGE_OPTIONS)[number]>(14);

  const analyticsQueries = useQueries({
    queries: venues.map((venue) => ({
      queryKey: ['owner', 'analytics', venue.id, days] as const,
      queryFn: () => fetchOwnerAnalytics(venue.id, days),
      staleTime: 60_000,
    })),
  });

  const pending = venues.length > 0 && analyticsQueries.some((q) => q.isPending);
  const partialError = analyticsQueries.some((q) => q.isError);
  const series = mergeAnalyticsSeries(analyticsQueries.map((q) => q.data));

  return (
    <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>Xu hướng đặt sân</CardTitle>
          <CardDescription>
            Tổng hợp {venues.length} cụm sân trong {days} ngày gần nhất.
          </CardDescription>
        </div>
        <div
          className="flex gap-1"
          role="group"
          aria-label="Chọn khoảng ngày xem xu hướng"
          data-testid="owner-range-group"
        >
          {RANGE_OPTIONS.map((option) => (
            <Button
              key={option}
              size="sm"
              variant={days === option ? 'default' : 'outline'}
              aria-pressed={days === option}
              onClick={() => setDays(option)}
              data-testid={'owner-range-' + option}
            >
              {option} ngày
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {pending ? (
          <Skeleton className="h-72 w-full rounded-xl" aria-label="Đang tải biểu đồ xu hướng" />
        ) : series.length === 0 ? (
          <p
            data-testid="owner-trend-empty"
            className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground"
          >
            Chưa có dữ liệu xu hướng cho các cụm sân của bạn.
          </p>
        ) : (
          <>
            {partialError ? (
              <p className="mb-2 text-xs text-muted-foreground" role="note">
                Một phần dữ liệu xu hướng chưa tải được — hiển thị số liệu đã có.
              </p>
            ) : null}
            <RevenueBookingsChart series={series} testId="owner-trend-chart" />
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Hàng KPI "hôm nay" của chủ sân — chỉ đọc: đơn hôm nay, doanh thu ước tính
 * hôm nay và số cụm sân APPROVED đang mở bán. Dữ liệu tổng hợp client-side từ
 * /venues/mine + /owner/bookings?venueId=... (đúng contract venueId bắt buộc).
 */
function OwnerKpiSection(options: {
  totalVenues: number;
  approvedVenues: number;
  bookings: readonly OwnerBooking[];
  firstError: unknown;
}): ReactElement {
  const { totalVenues, approvedVenues, bookings, firstError } = options;
  const todayCount = aggregateOwnerKpis(totalVenues, bookings).todayCount;
  const revenueToday = estimateRevenueToday(bookings);

  const cards: Array<{ label: string; value: string; hint: string; testId: string }> = [
    {
      label: 'Đơn hôm nay',
      value: String(todayCount),
      hint: 'Mọi trạng thái trong ngày',
      testId: 'kpi-owner-today',
    },
    {
      label: 'Doanh thu ước tính hôm nay',
      value: formatVnd(revenueToday),
      hint: 'Đơn trong ngày chưa bị huỷ/no-show',
      testId: 'kpi-owner-revenue-today',
    },
    {
      label: 'Cụm sân đang mở bán',
      value: String(approvedVenues),
      hint: 'Cụm sân APPROVED nhận đặt sân',
      testId: 'kpi-owner-approved',
    },
  ];

  return (
    <section className="space-y-3">
      {firstError ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {friendlyApiMessage(firstError)}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Card
            key={card.label}
            className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]"
          >
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wide">
                {card.label}
              </CardDescription>
              <CardTitle
                className="font-score text-3xl font-extrabold tabular-nums tracking-tight"
                data-testid={card.testId}
              >
                {card.value}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{card.hint}</CardContent>
          </Card>
        ))}
      </div>
      {/* Liên kết nhanh — chỉ điều hướng, KHÔNG hành động duyệt/huỷ tại đây */}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link to="/dashboard/manage">
            <MapPinned className="size-4" /> Quản lý sân
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/dashboard/statistics">
            <BarChart3 className="size-4" /> Xem thống kê
          </Link>
        </Button>
      </div>
    </section>
  );
}

/** Bảng "Lịch trong ngày" chỉ-đọc: giờ, sân con, khách, badge trạng thái. */
function OwnerTodayTable(options: {
  bookings: readonly OwnerBooking[];
  multiVenue: boolean;
  venueNameById: ReadonlyMap<string, string>;
}): ReactElement {
  const { bookings, multiVenue, venueNameById } = options;
  const today = todayIso();
  const rows = bookings
    .filter((booking) => booking.date === today)
    .sort((a, b) => a.startMinute - b.startMinute || a.code.localeCompare(b.code));

  return (
    <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
      <CardHeader>
        <CardTitle>Lịch trong ngày</CardTitle>
        <CardDescription>Các đơn phát sinh hôm nay — sắp theo giờ bắt đầu.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p
            data-testid="owner-today-empty"
            className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground"
          >
            Hôm nay chưa có lịch đặt nào.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table data-testid="owner-today-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Giờ</TableHead>
                  <TableHead>Sân con</TableHead>
                  <TableHead>Khách</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((booking, index) => {
                  const meta = statusMeta(booking.status);
                  const venueName = venueNameById.get(booking.id);
                  return (
                    <TableRow key={booking.id} data-testid={'owner-today-row-' + index}>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5 text-muted-foreground" aria-hidden />
                          {minutesToTime(booking.startMinute)}–{minutesToTime(booking.endMinute)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {booking.courtName}
                        {multiVenue && venueName ? (
                          <span className="block text-xs text-muted-foreground">{venueName}</span>
                        ) : null}
                      </TableCell>
                      <TableCell>{booking.customerName}</TableCell>
                      <TableCell>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** "Hoạt động gần đây": 6 booking mới nhất của toàn bộ cụm sân — danh sách đọc. */
function OwnerRecentActivity(options: {
  bookings: readonly OwnerBooking[];
  multiVenue: boolean;
  venueNameById: ReadonlyMap<string, string>;
}): ReactElement {
  const { bookings, multiVenue, venueNameById } = options;
  const rows = [...bookings]
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        b.startMinute - a.startMinute ||
        b.code.localeCompare(a.code),
    )
    .slice(0, 6);

  return (
    <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
      <CardHeader>
        <CardTitle>Hoạt động gần đây</CardTitle>
        <CardDescription>6 booking mới nhất trên sân của bạn.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p
            data-testid="owner-recent-empty"
            className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground"
          >
            Chưa có hoạt động nào.
          </p>
        ) : (
          <ul className="space-y-3" data-testid="owner-recent-list">
            {rows.map((booking, index) => {
              const meta = statusMeta(booking.status);
              const venueName = venueNameById.get(booking.id);
              return (
                <li
                  key={booking.id}
                  data-testid={'owner-recent-item-' + index}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-semibold">
                      <span className="font-score text-xs uppercase tracking-widest text-primary">
                        {booking.code}
                      </span>{' '}
                      · {booking.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {multiVenue && venueName ? venueName + ' · ' : ''}
                      {booking.courtName} · {formatReviewDate(booking.date)} ·{' '}
                      {minutesToTime(booking.startMinute)}–{minutesToTime(booking.endMinute)}
                    </p>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Khối tổng quan OWNER: KPI hôm nay + xu hướng + lịch trong ngày + hoạt động
 * gần đây. Toàn bộ CHỈ ĐỌC — mọi thao tác duyệt/huỷ/check-in nằm ở trang riêng.
 */
function OwnerDashboard(): ReactElement {
  const firstPageQuery = useMyVenues(1);
  // /venues/mine phân trang limit 20 — owner >20 sân phải fetch đủ các trang
  // còn lại (theo total/pages) để số liệu không bị thiếu.
  const totalPages = firstPageQuery.data?.pages ?? 1;
  const restPageQueries = useQueries({
    queries: Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => ({
      queryKey: ['owner', 'venues', index + 2] as const,
      queryFn: () => fetchMyVenues(index + 2),
      enabled: firstPageQuery.isSuccess,
      staleTime: 30_000,
    })),
  });
  const venues = [
    ...(firstPageQuery.data?.items ?? []),
    ...restPageQueries.flatMap((q) => q.data?.items ?? []),
  ];
  const totalVenues = firstPageQuery.data?.total ?? venues.length;
  const approvedVenues = venues.filter((venue) => venue.status === 'APPROVED').length;

  const bookingQueries = useQueries({
    queries: venues.map((venue) => ({
      queryKey: ['owner', 'bookings', venue.id] as const,
      queryFn: () => fetchOwnerBookings({ venueId: venue.id }),
      enabled: firstPageQuery.isSuccess,
      staleTime: 30_000,
    })),
  });

  if (
    firstPageQuery.isPending ||
    restPageQueries.some((q) => q.isPending) ||
    bookingQueries.some((q) => q.isPending)
  ) {
    return (
      <section
        data-testid="owner-kpi-skeleton"
        role="status"
        aria-label="Đang tải số liệu sân"
        className="grid gap-4 sm:grid-cols-3"
      >
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </section>
    );
  }

  const firstError =
    bookingQueries.find((q) => q.error)?.error ??
    firstPageQuery.error ??
    restPageQueries.find((q) => q.error)?.error;

  const allBookings = bookingQueries.flatMap((q) => q.data?.items ?? []);
  const multiVenue = venues.length > 1;
  const venueNameById = new Map(
    allBookings.map((booking) => [booking.id, venues.find((v) => v.id === booking.id)?.name ?? '']),
  );

  return (
    <div className="space-y-6">
      <OwnerKpiSection
        totalVenues={totalVenues}
        approvedVenues={approvedVenues}
        bookings={allBookings}
        firstError={firstError}
      />
      <OwnerTrendCard venues={venues.map((venue) => ({ id: venue.id }))} />
      <OwnerTodayTable
        bookings={allBookings}
        multiVenue={multiVenue}
        venueNameById={venueNameById}
      />
      <OwnerRecentActivity
        bookings={allBookings}
        multiVenue={multiVenue}
        venueNameById={venueNameById}
      />
    </div>
  );
}

/* ------------------------------- ADMIN ------------------------------ */

const ADMIN_VENUE_STATUS_ROWS = [
  { key: 'PENDING', label: 'Chờ duyệt' },
  { key: 'APPROVED', label: 'Đã duyệt' },
  { key: 'REJECTED', label: 'Từ chối' },
  { key: 'SUSPENDED', label: 'Tạm ngừng' },
] as const;

const ACTIVITY_ICON: Record<AdminActivityType, ReactElement> = {
  VENUE_SUBMITTED: <ShieldCheck className="size-4 text-primary" aria-hidden />,
  BOOKING_CREATED: <CalendarDays className="size-4 text-muted-foreground" aria-hidden />,
};

/**
 * Khối tổng quan ADMIN — chỉ đọc từ GET /admin/stats: KPI hệ thống, breakdown
 * trạng thái cụm sân, biểu đồ 14 ngày, top cụm sân và feed hoạt động. Duyệt/
 * từ chối chỉ làm tại /dashboard/admin qua Link "Hàng chờ duyệt".
 * API chưa sẵn sàng -> Skeleton + empty state, KHÔNG crash.
 */
function AdminStatsSection(): ReactElement {
  const statsQuery = useAdminStats();

  if (statsQuery.isPending) {
    return (
      <section
        data-testid="admin-stats-skeleton"
        role="status"
        aria-label="Đang tải số liệu nền tảng"
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </section>
    );
  }

  if (statsQuery.isError || !statsQuery.data) {
    // API /admin/stats chưa sẵn sàng hoặc lỗi — hiện empty_state thay vì crash.
    return (
      <div
        data-testid="admin-stats-empty"
        role="note"
        className="space-y-3 rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground"
      >
        <BarChart3 className="mx-auto size-8 opacity-50" aria-hidden />
        <p>Chưa lấy được số liệu nền tảng — vui lòng thử lại sau.</p>
        {statsQuery.error ? (
          <p className="text-xs">{friendlyApiMessage(statsQuery.error)}</p>
        ) : null}
      </div>
    );
  }

  const { totals, series, topVenues, recentActivity } = statsQuery.data;
  // Hợp đồng trả đủ chuỗi ngày — vẽ 14 điểm gần nhất cho tổng quan
  // (đổi tên revenueVnd -> revenue để dùng chung bộ gộp chuỗi với owner).
  const chartSeries = mergeAnalyticsSeries([
    {
      series: series.slice(-14).map((point) => ({
        date: point.date,
        bookings: point.bookings,
        revenue: point.revenueVnd,
      })),
    },
  ]);

  const kpiCards: Array<{ label: string; value: string; testId: string }> = [
    { label: 'Người dùng', value: String(totals.users), testId: 'admin-kpi-users' },
    { label: 'Khách hàng', value: String(totals.customers), testId: 'admin-kpi-customers' },
    { label: 'Chủ sân', value: String(totals.owners), testId: 'admin-kpi-owners' },
    { label: 'Cụm sân', value: String(totals.venues.total), testId: 'admin-kpi-venues' },
    {
      label: 'Đơn đã tạo',
      value: String(totals.bookingsTotal),
      testId: 'admin-kpi-bookings-total',
    },
    {
      label: 'Đơn hôm nay',
      value: String(totals.bookingsToday),
      testId: 'admin-kpi-bookings-today',
    },
    {
      label: 'Doanh thu hôm nay',
      value: formatVnd(totals.revenueTodayVnd),
      testId: 'admin-kpi-revenue-today',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hàng chờ duyệt — chỉ Link sang trang duyệt, KHÔNG duyệt tại chỗ */}
      <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
        <CardHeader>
          <CardTitle>Hàng chờ duyệt</CardTitle>
          <CardDescription>Số cụm sân đang chờ kiểm duyệt trên hệ thống.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <p
            className="font-score text-5xl font-extrabold tabular-nums tracking-tight text-primary"
            data-testid="kpi-admin-pending"
          >
            {totals.venues.PENDING}
          </p>
          <Button asChild>
            <Link to="/dashboard/admin">
              <ShieldCheck className="size-4" /> Vào hàng chờ duyệt
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* KPI hệ thống */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="admin-kpi-grid">
        {kpiCards.map((card) => (
          <Card
            key={card.testId}
            className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]"
          >
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wide">
                {card.label}
              </CardDescription>
              <CardTitle
                className="font-score text-2xl font-extrabold tabular-nums tracking-tight"
                data-testid={card.testId}
              >
                {card.value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Breakdown trạng thái cụm sân */}
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        data-testid="admin-status-breakdown"
      >
        {ADMIN_VENUE_STATUS_ROWS.map((row) => (
          <Card key={row.key} className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wide">
                {row.label}
              </CardDescription>
              <CardTitle
                className="font-score text-2xl font-extrabold tabular-nums tracking-tight"
                data-testid={'admin-count-' + row.key.toLowerCase()}
              >
                {totals.venues[row.key]}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Cụm sân ở trạng thái này
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Biểu đồ 14 ngày */}
      <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
        <CardHeader>
          <CardTitle>Biểu đồ 14 ngày</CardTitle>
          <CardDescription>Lượt đặt và doanh thu toàn hệ thống theo ngày.</CardDescription>
        </CardHeader>
        <CardContent>
          {chartSeries.length === 0 ? (
            <p
              data-testid="admin-trend-empty"
              className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground"
            >
              Chưa có dữ liệu chuỗi ngày.
            </p>
          ) : (
            <RevenueBookingsChart series={chartSeries} testId="admin-trend-chart" />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top cụm sân */}
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
                    <TableRow key={venue.venueId} data-testid={'admin-top-venue-row-' + index}>
                      <TableCell className="font-medium">{venue.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{venue.bookings}</TableCell>
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

        {/* Feed hoạt động gần đây */}
        <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>Sự kiện mới nhất trên nền tảng.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p
                data-testid="admin-activity-empty"
                className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground"
              >
                Chưa có hoạt động nào.
              </p>
            ) : (
              <ul className="space-y-3" data-testid="admin-activity-list">
                {recentActivity.map((activity, index) => (
                  <li
                    key={activity.type + '-' + activity.at + '-' + index}
                    data-testid={'admin-activity-item-' + index}
                    className="flex items-start gap-3 rounded-lg border border-border/60 px-3 py-2"
                  >
                    <span className="mt-0.5">{ACTIVITY_ICON[activity.type]}</span>
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-sm font-semibold">{activity.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatActivityTime(activity.at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------- PAGE ------------------------------- */

/** Tổng quan theo vai: mỗi role thấy widget riêng ngay khi đăng nhập. */
export function DashboardPage(): ReactElement {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">
          {greetingForRole(user?.role, user?.fullName ?? 'bạn')}
        </p>
      </header>

      {user?.role === UserRole.CUSTOMER ? (
        <CustomerUpcomingCard />
      ) : user?.role === UserRole.OWNER ? (
        <OwnerDashboard />
      ) : user?.role === UserRole.ADMIN ? (
        <AdminStatsSection />
      ) : (
        <Skeleton
          data-testid="dashboard-role-skeleton"
          role="status"
          aria-label="Đang tải tổng quan"
          className="h-56 w-full rounded-xl"
        />
      )}
    </div>
  );
}
