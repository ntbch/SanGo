import { UserRole } from '@sango/shared';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as AdminApiModule from '../../../../src/features/admin/api';
import { resetMockSession } from '../../../../src/lib/api/mock-server';
import { useAuthStore } from '../../../../src/lib/auth/auth-store';
import { renderApp } from '../../../test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

// jsdom không có canvas — stub Chart.js như các test biểu đồ khác.
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
vi.mock('react-chartjs-2', () => ({ Chart: () => null }));

/** Ghi nhận các lần gọi fetchAdminStats(?days) để assert toggle khoảng ngày. */
const mocks = vi.hoisted(() => ({
  daysCalls: [] as number[],
  fetchError: null as Error | null,
}));

vi.mock('../../../../src/features/admin/api', async (importOriginal) => {
  const actual = await importOriginal<typeof AdminApiModule>();
  /** Fixture khớp contract /admin/stats; chuỗi ngày dài đúng `days`. */
  const buildFixture = (days: number) => ({
    totals: {
      users: 42,
      customers: 30,
      owners: 11,
      venues: { total: 25, PENDING: 3, APPROVED: 20, REJECTED: 1, SUSPENDED: 1 },
      bookingsTotal: 120,
      bookingsToday: 8,
      revenueTodayVnd: 950000,
    },
    series: Array.from({ length: days }, (_, i) => ({
      date: '2026-08-' + String((i % 27) + 1).padStart(2, '0'),
      bookings: i + 1,
      revenueVnd: (i + 1) * 100_000,
    })),
    topVenues: [
      { venueId: 'v-9', name: 'Cụm thể thao Tây Hồ', bookings: 40, revenueVnd: 12500000 },
      { venueId: 'v-10', name: 'CLB Pickleball Cầu Giấy', bookings: 25, revenueVnd: 7000000 },
    ],
    recentActivity: [
      { type: 'VENUE_SUBMITTED', at: new Date().toISOString(), label: 'Cụm sân ABC gửi duyệt' },
      { type: 'BOOKING_CREATED', at: new Date().toISOString(), label: 'Đơn CH-1002 vừa tạo' },
    ],
  });
  return {
    ...actual,
    fetchAdminStats: (async (days?: number) => {
      if (mocks.fetchError !== null) throw mocks.fetchError;
      mocks.daysCalls.push(days ?? 14);
      return buildFixture(days ?? 14) as Awaited<ReturnType<typeof actual.fetchAdminStats>>;
    }) as typeof actual.fetchAdminStats,
  };
});

function asAdmin(): void {
  useAuthStore.getState().setSession(
    { id: 'u-admin-01', email: 'admin@sango.vn', fullName: 'Quản Trị', role: UserRole.ADMIN },
    'token-test',
  );
}

describe('AdminStatsPage — Thống kê nền tảng (/dashboard/admin-stats)', () => {
  beforeEach(() => {
    resetMockSession();
    mocks.daysCalls = [];
    mocks.fetchError = null;
  });

  it('render đủ 4 KPI card, biểu đồ 14 ngày mặc định, top cụm sân và feed hoạt động', async () => {
    asAdmin();
    renderApp({ route: '/dashboard/admin-stats' });
    expect(await screen.findByRole('heading', { name: 'Thống kê nền tảng' })).toBeTruthy();

    // 4 KPI bắt buộc theo t6.
    await waitFor(() => {
      expect(screen.getByTestId('admin-kpi-users').textContent).toBe('42');
      expect(screen.getByTestId('admin-kpi-venues-approved').textContent).toBe('20');
      expect(screen.getByTestId('admin-kpi-bookings-today').textContent).toBe('8');
      expect(screen.getByTestId('admin-kpi-revenue-today').textContent).toContain('950');
    });

    // Mặc định ?days=14 và biểu đồ 2 dataset được gắn vào trang.
    expect(screen.getByRole('heading', { name: 'Lượt đặt & doanh thu 14 ngày' })).toBeTruthy();
    expect(await screen.findByTestId('admin-stats-chart')).toBeTruthy();
    await waitFor(() => expect(mocks.daysCalls.at(-1)).toBe(14));

    // Bảng top cụm sân — thứ hạng do backend sắp sẵn.
    expect(screen.getByTestId('admin-top-venues')).toBeTruthy();
    expect(screen.getByTestId('admin-top-venue-row-0')).toBeTruthy();
    expect(screen.getByText('Cụm thể thao Tây Hồ')).toBeTruthy();
    expect(screen.getByTestId('admin-top-venue-row-1')).toBeTruthy();

    // Feed hoạt động có icon/badge theo type (2 sự kiện).
    expect(screen.getAllByTestId(/^admin-activity-item-/).length).toBe(2);
    expect(screen.getByText('Cụm sân ABC gửi duyệt')).toBeTruthy();

    // Trang chỉ đọc — KHÔNG nút duyệt/huỷ/check-in nào.
    expect(screen.queryByRole('button', { name: /duyệt|huỷ|check-in/i })).toBeNull();
  });

  it('toggle khoảng ngày 7/14/30/90 -> gọi lại GET /admin/stats với ?days mới', async () => {
    const user = userEvent.setup();
    asAdmin();
    renderApp({ route: '/dashboard/admin-stats' });
    await screen.findByTestId('admin-kpi-users');

    await user.click(screen.getByTestId('admin-range-30'));
    expect(
      await screen.findByRole('heading', { name: 'Lượt đặt & doanh thu 30 ngày' }),
    ).toBeTruthy();
    await waitFor(() => expect(mocks.daysCalls.at(-1)).toBe(30));
    expect(screen.getByTestId('admin-stats-chart')).toBeTruthy();

    await user.click(screen.getByTestId('admin-range-90'));
    expect(
      await screen.findByRole('heading', { name: 'Lượt đặt & doanh thu 90 ngày' }),
    ).toBeTruthy();
    await waitFor(() => expect(mocks.daysCalls.at(-1)).toBe(90));

    // aria-pressed phản ánh lựa chọn hiện tại.
    expect(screen.getByTestId('admin-range-90').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('admin-range-7').getAttribute('aria-pressed')).toBe('false');
  });

  it('lỗi tải /admin/stats -> hộp lỗi role="alert", không crash', async () => {
    mocks.fetchError = new Error('stats boom');
    asAdmin();
    renderApp({ route: '/dashboard/admin-stats' });

    const alert = await screen.findByTestId('admin-stats-error');
    expect(alert.getAttribute('role')).toBe('alert');
    expect(screen.getByText(/Không tải được thống kê nền tảng/)).toBeTruthy();
    expect(screen.queryByTestId('admin-kpi-users')).toBeNull();
  });
});