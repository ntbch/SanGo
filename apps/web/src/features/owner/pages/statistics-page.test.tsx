import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserRole } from '@courthub/shared';

import { resetMockSession } from '../../../lib/api/mock-server';
import { handleMockRequest } from '../../../lib/api/mock-server';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { renderApp } from '../../../test/test-utils';
import type { OwnerAnalyticsResponse, Paginated, OwnerVenue } from '../types';
import { formatVnd } from '../format';

// jsdom không có canvas — thay Chart.js bằng stub để test KPI/bảng.
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

vi.stubEnv('VITE_USE_MOCK', 'true');

async function mockAnalytics(venueId: string, days: number): Promise<OwnerAnalyticsResponse> {
  return handleMockRequest<OwnerAnalyticsResponse>(
    '/owner/analytics?venueId=' + venueId + '&days=' + String(days),
  );
}

describe('StatisticsPage', () => {
  beforeEach(() => {
    useAuthStore
      .getState()
      .setSession(
        { id: 'u-owner', email: 'owner@courthub.vn', role: UserRole.OWNER, fullName: 'Chủ Sân' },
        'tok',
      );
    resetMockSession();
  });

  it('render đủ 4 thẻ KPI với doanh thu định dạng VND khớp dữ liệu mock', async () => {
    renderApp({ route: '/dashboard/statistics' });
    const mine = await handleMockRequest<Paginated<OwnerVenue>>('/venues/mine?page=1&limit=20');
    const payload = await mockAnalytics(mine.items[0].id, 30);
    await waitFor(() => {
      expect(screen.getByTestId('kpi-revenue').textContent).toBe(
        formatVnd(payload.summary.revenueConfirmed),
      );
    });
    expect(screen.getByTestId('kpi-bookings').textContent).toBe(
      payload.summary.totalBookings.toLocaleString('vi-VN'),
    );
    expect(screen.getByTestId('kpi-cancel-rate').textContent).toMatch(/%$/);
    expect(screen.getByTestId('kpi-noshow-rate').textContent).toMatch(/%$/);
  });

  it('bảng xếp hạng sân con sắp giảm dần theo lượt đặt và format VND', async () => {
    renderApp({ route: '/dashboard/statistics' });
    const mine = await handleMockRequest<Paginated<OwnerVenue>>('/venues/mine?page=1&limit=20');
    const payload = await mockAnalytics(mine.items[0].id, 30);
    await waitFor(() => {
      expect(screen.getByText(payload.topCourts[0].courtName)).toBeTruthy();
    });
    const rows = screen.getAllByRole('row');
    // bỏ hàng header của bảng xếp hạng
    const bodyRows = rows.filter((row) => row.querySelector('td') !== null);
    expect(bodyRows.length).toBe(payload.topCourts.length);
    const bookings = bodyRows.map((row) =>
      Number((row as HTMLTableRowElement).cells[2].textContent),
    );
    const sorted = [...bookings].sort((a, b) => b - a);
    expect(bookings).toEqual(sorted);
    expect((bodyRows[0] as HTMLTableRowElement).cells[3].textContent).toBe(
      formatVnd(payload.topCourts[0].revenue),
    );
  });

  it('đổi khoảng thời gian sang 90 ngày gọi lại API với tổng mới', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/dashboard/statistics' });
    const mine = await handleMockRequest<Paginated<OwnerVenue>>('/venues/mine?page=1&limit=20');
    const venueId = mine.items[0].id;
    await waitFor(() => {
      expect(screen.getByTestId('kpi-bookings')).toBeTruthy();
    });
    const payload90 = await mockAnalytics(venueId, 90);
    await user.click(screen.getByRole('button', { name: '90 ngày' }));
    await waitFor(() => {
      expect(screen.getByTestId('kpi-bookings').textContent).toBe(
        payload90.summary.totalBookings.toLocaleString('vi-VN'),
      );
    });
    expect(screen.getByRole('button', { name: '90 ngày' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });
});
