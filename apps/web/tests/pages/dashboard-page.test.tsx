import { UserRole, vnToday } from '@sango/shared';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as AdminApiModule from '../../src/features/admin/api';
import type * as OwnerApiModule from '../../src/features/owner/api';
import type { AdminStatsResponse } from '../../src/features/admin/types';
import type { OwnerBooking } from '../../src/features/owner/types';
import { resetMockSession } from '../../src/lib/api/mock-server';
import { useAuthStore } from '../../src/lib/auth/auth-store';
import { type AuthUser } from '../../src/lib/api/types';
import { renderApp } from '../test-utils';
import { DashboardPage } from '../../src/pages/dashboard-page';

vi.stubEnv('VITE_USE_MOCK', 'true');

// jsdom không có canvas — thay Chart.js bằng stub như test Thống kê chủ sân.
// Đủ các export được register() ở statistics-page/dashboard-page qua router.
vi.mock('chart.js', () => ({
  Chart: { register: (): void => undefined },
  CategoryScale: {},
  LinearScale: {},
  BarElement: {},
  LineElement: {},
  PointElement: {},
  Tooltip: {},
  Legend: {},
}));
vi.mock('react-chartjs-2', () => ({
  Chart: () => null,
}));

/** Trạng thái override dùng chung cho các test — reset trong beforeEach. */
const mocks = vi.hoisted(() => ({
  /** Fixture /owner/bookings theo venueId — null nghĩa là đi qua mock thật. */
  ownerBookingsByVenue: null as null | Record<string, unknown>,
  ownerFetchError: null as Error | null,
  /** Fixture GET /admin/stats — null nghĩa là đi qua mock thật (404 MOCK_NOT_FOUND). */
  adminStatsFixture: null as unknown,
  adminStatsError: null as Error | null,
}));

vi.mock('../../src/features/owner/api', async (importOriginal) => {
  const actual = await importOriginal<typeof OwnerApiModule>();
  return {
    ...actual,
    fetchOwnerBookings: (async (filters?: { venueId?: string }) => {
      if (mocks.ownerFetchError !== null) throw mocks.ownerFetchError;
      const fixture = mocks.ownerBookingsByVenue?.[filters?.venueId ?? ''];
      return (fixture ?? { items: [], total: 0, page: 1, limit: 50, pages: 1 }) as Awaited<
        ReturnType<typeof actual.fetchOwnerBookings>
      >;
    }) as typeof actual.fetchOwnerBookings,
  };
});

vi.mock('../../src/features/admin/api', async (importOriginal) => {
  const actual = await importOriginal<typeof AdminApiModule>();
  return {
    ...actual,
    fetchAdminStats: (async () => {
      if (mocks.adminStatsError !== null) throw mocks.adminStatsError;
      if (mocks.adminStatsFixture !== undefined && mocks.adminStatsFixture !== null) {
        return mocks.adminStatsFixture as Awaited<ReturnType<typeof actual.fetchAdminStats>>;
      }
      // Không fixture -> đi qua mock server thật để mô phỏng "API chưa sẵn sàng".
      return actual.fetchAdminStats();
    }) as typeof actual.fetchAdminStats,
  };
});

/* --------------------- fixture helpers (clock-proof) --------------------- */

/** YYYY-MM-DD hôm nay theo mốc VN (cùng nguồn với dashboard-utils.todayIso). */
function todayIso(): string {
  return vnToday();
}

let bookingSeq = 0;

function ownerBooking(overrides: Partial<OwnerBooking>): OwnerBooking {
  bookingSeq += 1;
  return {
    id: 'ob-' + bookingSeq,
    code: 'CH-OB-' + String(bookingSeq).padStart(4, '0'),
    courtName: 'Sân 1',
    customerName: 'Khách ' + bookingSeq,
    date: todayIso(),
    startMinute: 360,
    endMinute: 420,
    status: 'CONFIRMED',
    amountPaid: 36000,
    ...overrides,
  };
}

function ownerPage(items: OwnerBooking[]): {
  items: OwnerBooking[];
  total: number;
  page: number;
  limit: number;
  pages: number;
} {
  return { items, total: items.length, page: 1, limit: 50, pages: 1 };
}

function seedOwnerFixtures(): void {
  // Khớp /venues/mine thật: u-owner có v-1 (APPROVED), v-2 (PENDING), v-3 (REJECTED).
  mocks.ownerBookingsByVenue = {
    'v-1': ownerPage([
      ownerBooking({ status: 'CONFIRMED', amountPaid: 36000 }),
      ownerBooking({ status: 'CONFIRMED', amountPaid: 36000 }),
      ownerBooking({ status: 'COMPLETED', amountPaid: 400000 }),
    ]),
    'v-2': ownerPage([
      ownerBooking({ status: 'CHECKED_IN', amountPaid: 90000 }),
      ownerBooking({ status: 'PENDING_PAYMENT', amountPaid: 0 }),
    ]),
    'v-3': ownerPage([]),
  };
}

/** Fixture /admin/stats khớp contract t5 — backend viết song song. */
function adminStatsFixture(): AdminStatsResponse {
  const series = Array.from({ length: 14 }, (_, i) => ({
    date: '2026-08-' + String(12 + i).padStart(2, '0'),
    bookings: i + 1,
    revenueVnd: (i + 1) * 100_000,
  }));
  return {
    totals: {
      users: 42,
      customers: 30,
      owners: 11,
      venues: { total: 25, PENDING: 3, APPROVED: 20, REJECTED: 1, SUSPENDED: 1 },
      bookingsTotal: 120,
      bookingsToday: 8,
      revenueTodayVnd: 950000,
    },
    series,
    topVenues: [
      { venueId: 'v-9', name: 'Cụm thể thao Tây Hồ', bookings: 40, revenueVnd: 12500000 },
    ],
    recentActivity: [
      { type: 'VENUE_SUBMITTED', at: new Date().toISOString(), label: 'Cụm sân ABC gửi duyệt' },
      { type: 'BOOKING_CREATED', at: new Date().toISOString(), label: 'Đơn CH-1002 vừa tạo' },
    ],
  };
}

function asUser(role: UserRole, id = 'u-1'): void {
  const user: AuthUser = { id, email: 'u@sango.vn', fullName: 'Người Dùng', role };
  useAuthStore.getState().setSession(user, 'token-test');
}

describe('DashboardPage — tổng quan theo vai', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    resetMockSession();
    mocks.ownerBookingsByVenue = null;
    mocks.ownerFetchError = null;
    mocks.adminStatsFixture = null;
    mocks.adminStatsError = null;
  });

  /* -------------------------------- OWNER -------------------------------- */

  it('OWNER thấy hàng KPI hôm nay (đơn/doanh thu ước tính/cụm sân APPROVED) đúng số liệu', async () => {
    seedOwnerFixtures();
    asUser(UserRole.OWNER);
    renderApp({ route: '/dashboard' });
    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeTruthy();

    // 3 cụm sân (1 APPROVED); 5 đơn đều là hôm nay; doanh thu ước tính 562.000₫.
    await waitFor(() => {
      expect(screen.getByTestId('kpi-owner-today').textContent).toBe('5');
      expect(screen.getByTestId('kpi-owner-revenue-today').textContent).toContain('562');
      expect(screen.getByTestId('kpi-owner-approved').textContent).toBe('1');
    });
    expect(screen.getByText('Đơn hôm nay')).toBeTruthy();
    expect(screen.getByText('Doanh thu ước tính hôm nay')).toBeTruthy();
    expect(screen.getByText('Cụm sân đang mở bán')).toBeTruthy();

    // Liên kết nhanh điều hướng — KHÔNG nút duyệt/huỷ/check-in nào trên trang.
    const manageLinks = screen.getAllByRole('link', { name: /Quản lý sân/ });
    expect(manageLinks.some((link) => link.getAttribute('href') === '/dashboard/manage')).toBe(true);
    const statsLink = screen.getByRole('link', { name: 'Xem thống kê' });
    expect(statsLink.getAttribute('href')).toBe('/dashboard/statistics');
    expect(screen.queryByRole('button', { name: /duyệt|check-in|huỷ/i })).toBeNull();
  });

  it('OWNER thấy biểu đồ xu hướng với bộ chọn 7/14/30 ngày và lịch trong ngày + hoạt động gần đây', async () => {
    seedOwnerFixtures();
    asUser(UserRole.OWNER);
    renderApp({ route: '/dashboard' });

    await waitFor(() => expect(screen.getByTestId('kpi-owner-approved')).toBeTruthy());
    // Biểu đồ cộng dồn từ /owner/analytics của từng cụm sân (mock thật trả dữ liệu).
    expect(await screen.findByTestId('owner-trend-chart')).toBeTruthy();
    expect(screen.getByTestId('owner-range-7')).toBeTruthy();
    expect(screen.getByTestId('owner-range-14')).toBeTruthy();
    expect(screen.getByTestId('owner-range-30')).toBeTruthy();

    // Lịch trong ngày: cả 5 đơn đều hôm nay.
    await waitFor(() =>
      expect(screen.getAllByTestId(/^owner-today-row-/).length).toBe(5),
    );
    expect(screen.getByTestId('owner-today-table')).toBeTruthy();

    // Hoạt động gần đây: tối đa 6 booking mới nhất.
    expect(screen.getAllByTestId(/^owner-recent-item-/).length).toBe(5);
    expect(screen.getByTestId('owner-recent-list')).toBeTruthy();
  });

  it('OWNER không thấy widget Đơn sắp tới của customer và khối thống kê của admin', async () => {
    seedOwnerFixtures();
    asUser(UserRole.OWNER);
    renderApp({ route: '/dashboard' });

    await waitFor(() => expect(screen.getByTestId('kpi-owner-approved')).toBeTruthy());
    expect(screen.queryByText('Đơn sắp tới')).toBeNull();
    expect(screen.queryByRole('link', { name: /Xem QR check-in/ })).toBeNull();
    expect(screen.queryByTestId('kpi-admin-pending')).toBeNull();
    // Sidebar OWNER không có item quản trị mới.
    expect(screen.queryAllByRole('link', { name: 'Thống kê nền tảng' }).length).toBe(0);
  });

  it('OWNER lỗi tải đơn -> hộp lỗi role="alert", KPI hiển thị giá trị 0 thay vì crash', async () => {
    mocks.ownerFetchError = new Error('owner boom');
    asUser(UserRole.OWNER);
    renderApp({ route: '/dashboard' });

    expect(await screen.findByRole('alert')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId('kpi-owner-revenue-today').textContent).toContain('0₫');
      expect(screen.getByTestId('kpi-owner-today').textContent).toBe('0');
    });
  });

  /* -------------------------------- ADMIN -------------------------------- */

  it('ADMIN thấy KPI hệ thống, hàng chờ duyệt, biểu đồ 14 ngày và feed hoạt động từ /admin/stats', async () => {
    mocks.adminStatsFixture = adminStatsFixture();
    asUser(UserRole.ADMIN);
    renderApp({ route: '/dashboard' });
    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByTestId('kpi-admin-pending').textContent).toBe('3');
      expect(screen.getByTestId('admin-kpi-users').textContent).toBe('42');
      expect(screen.getByTestId('admin-kpi-customers').textContent).toBe('30');
      expect(screen.getByTestId('admin-kpi-bookings-today').textContent).toBe('8');
      expect(screen.getByTestId('admin-kpi-revenue-today').textContent).toContain('950');
    });

    // Link sang trang duyệt — KHÔNG duyệt tại chỗ.
    const queueLink = screen.getByRole('link', { name: /Vào hàng chờ duyệt/ });
    expect(queueLink.getAttribute('href')).toBe('/dashboard/admin');
    expect(screen.queryByRole('button', { name: /duyệt/i })).toBeNull();

    // Breakdown trạng thái gồm cả SUSPENDED.
    expect(screen.getByTestId('admin-status-breakdown')).toBeTruthy();
    expect(screen.getByTestId('admin-count-pending').textContent).toBe('3');
    expect(screen.getByTestId('admin-count-suspended').textContent).toBe('1');

    // Biểu đồ 14 ngày + top cụm sân + feed hoạt động.
    expect(await screen.findByTestId('admin-trend-chart')).toBeTruthy();
    expect(screen.getByTestId('admin-top-venue-row-0')).toBeTruthy();
    expect(screen.getByText('Cụm thể thao Tây Hồ')).toBeTruthy();
    expect(screen.getAllByTestId(/^admin-activity-item-/).length).toBe(2);
  });

  it('ADMIN không thấy widget của CUSTOMER/OWNER', async () => {
    mocks.adminStatsFixture = adminStatsFixture();
    asUser(UserRole.ADMIN);
    renderApp({ route: '/dashboard' });

    await waitFor(() => expect(screen.getByTestId('kpi-admin-pending')).toBeTruthy());
    expect(screen.queryByText('Đơn sắp tới')).toBeNull();
    expect(screen.queryByRole('link', { name: /Xem QR check-in/ })).toBeNull();
    expect(screen.queryByText('Doanh thu ước tính hôm nay')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Xem thống kê' })).toBeNull();
  });

  it('ADMIN khi /admin/stats chưa sẵn sàng (404) -> empty state, KHÔNG crash', async () => {
    // Không fixture: đi qua mock server thật -> ApiError MOCK_NOT_FOUND.
    asUser(UserRole.ADMIN);
    renderApp({ route: '/dashboard' });

    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeTruthy();
    expect(await screen.findByTestId('admin-stats-empty')).toBeTruthy();
    expect(screen.queryByTestId('kpi-admin-pending')).toBeNull();
    expect(screen.queryByTestId('admin-stats-skeleton')).toBeNull();
  });

  /* ---------------------- route stub quản trị (t5-B) ---------------------- */

  it('OWNER gõ tay /dashboard/admin-stats -> bị đá về /dashboard (RBAC)', async () => {
    seedOwnerFixtures();
    asUser(UserRole.OWNER);
    renderApp({ route: '/dashboard/admin-stats' });

    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeTruthy();
    expect(screen.queryByText('Đang triển khai')).toBeNull();
  });

  it('sidebar ADMIN có đủ 4 item quản trị mới', async () => {
    mocks.adminStatsFixture = adminStatsFixture();
    asUser(UserRole.ADMIN);
    renderApp({ route: '/dashboard' });

    await waitFor(() => expect(screen.getByTestId('kpi-admin-pending')).toBeTruthy());
    for (const label of ['Thống kê nền tảng', 'Người dùng', 'Cụm sân', 'Đơn hàng']) {
      expect(screen.getAllByRole('link', { name: label }).length).toBeGreaterThan(0);
    }
  });

  /* --------------------------- fallback / a11y ---------------------------- */

  it('role lạ (không thuộc enum vai) → fallback skeleton role="status"', async () => {
    // Mount trực tiếp DashboardPage: DashboardLayout hiện tại crash ở ROLE_META
    // với role ngoài enum (pre-existing), widget-level fallback vẫn phải an toàn.
    asUser('SUPER_GOD' as unknown as UserRole);
    renderApp({ ui: <DashboardPage /> });

    const skeleton = await screen.findByTestId('dashboard-role-skeleton');
    expect(skeleton.getAttribute('role')).toBe('status');
    expect(skeleton.getAttribute('aria-label')).toBe('Đang tải tổng quan');
  });

  it('chưa có phiên đăng nhập khi mount trực tiếp → skeleton chờ vai trò', async () => {
    useAuthStore.getState().clearSession();
    renderApp({ ui: <DashboardPage /> });

    const skeleton = await screen.findByTestId('dashboard-role-skeleton');
    expect(skeleton.getAttribute('role')).toBe('status');
  });
});