import { UserRole } from '@courthub/shared';
import { useQueries } from '@tanstack/react-query';
import { BarChart3, Calendar, Clock, MapPinned, QrCode, ShieldCheck } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { Badge, type BadgeProps } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { useMyBookings } from '../features/booking/queries';
import type { CustomerBooking } from '../features/booking/types';
import { useAdminVenues } from '../features/admin/queries';
import { fetchOwnerBookings } from '../features/owner/api';
import { useMyVenues } from '../features/owner/queries';
import { formatVnd, minutesToTime } from '../features/public/format';
import { friendlyApiMessage } from '../lib/api/api-error';
import { useAuthStore } from '../lib/auth/auth-store';
import {
  aggregateOwnerKpis,
  countByVenueStatus,
  pickNearestBooking,
} from './dashboard-utils';

/** Nhãn + màu badge theo trạng thái đơn của customer (đồng bộ trang Đơn của tôi). */
const CUSTOMER_STATUS_META: Record<
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
    return <Skeleton data-testid="customer-upcoming-skeleton" className="h-56 w-full rounded-xl" />;
  }

  if (query.isError) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
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
        className="space-y-3 rounded-xl border border-dashed py-16 text-center"
      >
        <Calendar className="mx-auto size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Bạn chưa có đơn nào sắp diễn ra — đặt sân đầu tiên ngay!
        </p>
        <Button asChild size="sm">
          <Link to="/venues">Đặt sân đầu tiên</Link>
        </Button>
      </div>
    );
  }

  const status = CUSTOMER_STATUS_META[nearest.status] ?? {
    label: nearest.status,
    variant: 'secondary' as const,
  };

  return (
    <Card data-testid="customer-upcoming">
      <CardHeader>
        <CardTitle>Đơn sắp tới</CardTitle>
        <CardDescription>Trận đấu gần nhất của bạn tại CourtHub.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-bold text-primary">{nearest.code}</span>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="space-y-1">
          <p className="text-lg font-bold leading-tight">
            {nearest.venueName} · {nearest.courtName}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-4" /> {nearest.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-4" /> {minutesToTime(nearest.startMinute)} –{' '}
              {minutesToTime(nearest.endMinute)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild>
            <Link to="/dashboard/my-bookings">
              <QrCode className="size-4" /> Xem QR check-in
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/venues">Đặt sân ngay</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------- OWNER ------------------------------ */

/**
 * 4 KPI mini của chủ sân. Dữ liệu tổng hợp client-side từ các endpoint đã có:
 * /venues/mine (số sân) và /owner/bookings?venueId=... cho từng sân (đúng
 * contract venueId bắt buộc) → đơn hôm nay, doanh thu đã thu, tỷ lệ huỷ.
 */
function OwnerKpiSection(): ReactElement {
  const venuesQuery = useMyVenues(1);
  const venues = venuesQuery.data?.items ?? [];

  const bookingQueries = useQueries({
    queries: venues.map((venue) => ({
      queryKey: ['owner', 'bookings', venue.id] as const,
      queryFn: () => fetchOwnerBookings({ venueId: venue.id }),
      enabled: venuesQuery.isSuccess,
      staleTime: 30_000,
    })),
  });

  if (venuesQuery.isPending || bookingQueries.some((q) => q.isPending)) {
    return (
      <section
        data-testid="owner-kpi-skeleton"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </section>
    );
  }

  const firstError = bookingQueries.find((q) => q.error)?.error ?? venuesQuery.error;

  const kpis = aggregateOwnerKpis(
    venuesQuery.data?.total ?? venues.length,
    bookingQueries.flatMap((q) => q.data?.items ?? []),
  );

  const cards: Array<{ label: string; value: string; hint: string; testId: string }> = [
    {
      label: 'Tổng sân của tôi',
      value: String(kpis.totalVenues),
      hint: 'Bao gồm cả sân đang chờ duyệt',
      testId: 'kpi-owner-venues',
    },
    {
      label: 'Đơn hôm nay',
      value: String(kpis.todayCount),
      hint: 'Mọi trạng thái trong ngày',
      testId: 'kpi-owner-today',
    },
    {
      label: 'Doanh thu kỳ hiện tại',
      value: formatVnd(kpis.collectedRevenue),
      hint: 'Đã thu của đơn không huỷ',
      testId: 'kpi-owner-revenue',
    },
    {
      label: 'Tỷ lệ hủy',
      value: kpis.cancelRatePercent === null ? '—' : `${kpis.cancelRatePercent}%`,
      hint: 'Huỷ + no-show trên tổng đơn',
      testId: 'kpi-owner-cancel',
    },
  ];

  return (
    <section className="space-y-3">
      {firstError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {friendlyApiMessage(firstError)}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-3xl" data-testid={card.testId}>
                {card.value}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{card.hint}</CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
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

/* ------------------------------- ADMIN ------------------------------ */

/** Số cụm sân chờ duyệt + đếm nhanh theo trạng thái từ GET /admin/venues. */
function AdminApprovalSection(): ReactElement {
  const query = useAdminVenues({});

  if (query.isPending) {
    return (
      <section data-testid="admin-pending-skeleton" className="grid gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </section>
    );
  }

  if (query.isError) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {friendlyApiMessage(query.error)}
      </p>
    );
  }

  const counts = countByVenueStatus(query.data?.items ?? []);

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Cụm sân chờ duyệt</CardTitle>
          <CardDescription>Cần được xem xét và phê duyệt hoặc từ chối.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-5xl font-bold text-primary" data-testid="kpi-admin-pending">
            {counts.PENDING}
          </p>
          <Button asChild>
            <Link to="/dashboard/admin">
              <ShieldCheck className="size-4" /> Vào hàng chờ duyệt
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3" data-testid="admin-status-breakdown">
        {(
          [
            { key: 'PENDING', label: 'Chờ duyệt' },
            { key: 'APPROVED', label: 'Đã duyệt' },
            { key: 'REJECTED', label: 'Từ chối' },
          ] as const
        ).map((row) => (
          <Card key={row.key}>
            <CardHeader className="pb-2">
              <CardDescription>{row.label}</CardDescription>
              <CardTitle
                className="text-2xl"
                data-testid={`admin-count-${row.key.toLowerCase()}`}
              >
                {counts[row.key]}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Cụm sân ở trạng thái này
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- PAGE ------------------------------- */

/** Tổng quan theo vai: mỗi role thấy widget riêng ngay khi đăng nhập. */
export function DashboardPage(): ReactElement {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">
          {greetingForRole(user?.role, user?.fullName ?? 'bạn')}
        </p>
      </header>

      {user?.role === UserRole.CUSTOMER ? (
        <CustomerUpcomingCard />
      ) : user?.role === UserRole.OWNER ? (
        <OwnerKpiSection />
      ) : user?.role === UserRole.ADMIN ? (
        <AdminApprovalSection />
      ) : (
        <Skeleton data-testid="dashboard-role-skeleton" className="h-56 w-full rounded-xl" />
      )}
    </div>
  );
}
