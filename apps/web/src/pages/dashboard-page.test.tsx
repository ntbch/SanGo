import { UserRole } from '@courthub/shared';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resetMockSession } from '../lib/api/mock-server';
import { useAuthStore } from '../lib/auth/auth-store';
import { type AuthUser } from '../lib/api/types';
import { renderApp } from '../test/test-utils';
import type { PaginatedCustomerBookings } from '../features/booking/types';

vi.stubEnv('VITE_USE_MOCK', 'true');

/**
 * Override dữ liệu đơn upcoming của customer để test empty state mà không
 * phải đụng vào fixtures của mock-server (mặc định vẫn đi qua mock thật).
 */
const mocks = vi.hoisted(() => ({
  customerBookingsOverride: undefined as PaginatedCustomerBookings | undefined,
}));

vi.mock('../features/booking/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/booking/queries')>();
  return {
    ...actual,
    useMyBookings: ((query: Parameters<typeof actual.useMyBookings>[0]) =>
      mocks.customerBookingsOverride !== undefined
        ? ({
            data: mocks.customerBookingsOverride,
            isPending: false,
            isError: false,
            error: null,
          } as unknown as ReturnType<typeof actual.useMyBookings>)
        : actual.useMyBookings(query)) as typeof actual.useMyBookings,
  };
});

function asUser(role: UserRole): void {
  const user: AuthUser = { id: 'u-1', email: 'u@courthub.vn', fullName: 'Người Dùng', role };
  useAuthStore.getState().setSession(user, 'token-test');
}

describe('DashboardPage — tổng quan theo vai', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    resetMockSession();
    mocks.customerBookingsOverride = undefined;
  });

  it('CUSTOMER thấy thẻ Đơn sắp tới với mã đơn + nút QR check-in và đặt sân', async () => {
    asUser(UserRole.CUSTOMER);
    renderApp({ route: '/dashboard' });

    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeTruthy();
    expect(await screen.findByTestId('customer-upcoming')).toBeTruthy();

    // Đơn CONFIRMED gần nhất trong mock: CH-20260828-0001 @ Sân Pickleball Saigon.
    expect(screen.getByText('CH-20260828-0001')).toBeTruthy();
    expect(screen.getByText(/Sân Pickleball Saigon/)).toBeTruthy();
    expect(screen.getByText('Đã xác nhận')).toBeTruthy();

    const qrLink = screen.getByRole('link', { name: /Xem QR check-in/ });
    expect(qrLink.getAttribute('href')).toBe('/dashboard/my-bookings');
    const bookLink = screen.getByRole('link', { name: 'Đặt sân ngay' });
    expect(bookLink.getAttribute('href')).toBe('/venues');
  });

  it('CUSTOMER không thấy KPI của OWNER lẫn panel của ADMIN', async () => {
    asUser(UserRole.CUSTOMER);
    renderApp({ route: '/dashboard' });

    await screen.findByTestId('customer-upcoming');
    expect(screen.queryByText('Tổng sân của tôi')).toBeNull();
    expect(screen.queryByText('Doanh thu kỳ hiện tại')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Quản lý sân' })).toBeNull(); // sidebar owner-only
    expect(screen.queryByText('Cụm sân chờ duyệt')).toBeNull();
    expect(screen.queryByRole('link', { name: /Vào hàng chờ duyệt/ })).toBeNull();
  });

  it('CUSTOMER chưa có đơn upcoming → empty state mời đặt sân đầu tiên', async () => {
    mocks.customerBookingsOverride = { items: [], total: 0, page: 1, pages: 1 };
    asUser(UserRole.CUSTOMER);
    renderApp({ route: '/dashboard' });

    expect(await screen.findByTestId('customer-upcoming-empty')).toBeTruthy();
    expect(screen.getByText(/chưa có đơn nào sắp diễn ra/i)).toBeTruthy();
    expect(screen.queryByTestId('customer-upcoming')).toBeNull();

    const cta = screen.getByRole('link', { name: 'Đặt sân đầu tiên' });
    expect(cta.getAttribute('href')).toBe('/venues');
  });

  it('OWNER thấy 4 KPI đúng số liệu mock và 2 nút nhanh quản lý/thống kê', async () => {
    asUser(UserRole.OWNER);
    renderApp({ route: '/dashboard' });
    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeTruthy();

    // Mock: u-owner có 3 cụm sân; 5 đơn hôm nay; đã thu 562.000₫; 0% huỷ.
    await waitFor(() => {
      expect(screen.getByTestId('kpi-owner-venues').textContent).toBe('3');
      expect(screen.getByTestId('kpi-owner-today').textContent).toBe('5');
      expect(screen.getByTestId('kpi-owner-revenue').textContent).toContain('562');
      expect(screen.getByTestId('kpi-owner-cancel').textContent).toBe('0%');
    });
    expect(screen.getByText('Đơn hôm nay')).toBeTruthy();
    expect(screen.getByText('Doanh thu kỳ hiện tại')).toBeTruthy();
    expect(screen.getByText('Tỷ lệ hủy')).toBeTruthy();

    // Sidebar owner cũng có link "Quản lý sân" → kiểm tra tồn tại link tới /dashboard/manage.
    const manageLinks = screen.getAllByRole('link', { name: /Quản lý sân/ });
    expect(
      manageLinks.some((link) => link.getAttribute('href') === '/dashboard/manage'),
    ).toBe(true);

    const statsLink = screen.getByRole('link', { name: 'Xem thống kê' });
    expect(statsLink.getAttribute('href')).toBe('/dashboard/statistics');
  });

  it('OWNER không thấy widget Đơn sắp tới của customer và hàng chờ của admin', async () => {
    asUser(UserRole.OWNER);
    renderApp({ route: '/dashboard' });

    await waitFor(() => expect(screen.getByTestId('kpi-owner-venues')).toBeTruthy());
    expect(screen.queryByText('Đơn sắp tới')).toBeNull();
    expect(screen.queryByRole('link', { name: /Xem QR check-in/ })).toBeNull();
    expect(screen.queryByText('Đặt sân ngay')).toBeNull();
    expect(screen.queryByTestId('kpi-admin-pending')).toBeNull();
  });

  it('ADMIN thấy số cụm sân chờ duyệt, đếm nhanh theo trạng thái và nút vào hàng chờ', async () => {
    asUser(UserRole.ADMIN);
    renderApp({ route: '/dashboard' });
    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeTruthy();

    // Mock chỉ có v-2 (Cụm Cầu lông Thủ Đức) ở trạng thái PENDING.
    await waitFor(() => {
      expect(screen.getByTestId('kpi-admin-pending').textContent).toBe('1');
    });

    const queueLink = screen.getByRole('link', { name: /Vào hàng chờ duyệt/ });
    expect(queueLink.getAttribute('href')).toBe('/dashboard/admin');

    expect(screen.getByTestId('admin-status-breakdown')).toBeTruthy();
    expect(screen.getByText('Chờ duyệt')).toBeTruthy();
    expect(screen.getByText('Đã duyệt')).toBeTruthy();
    expect(screen.getByText('Từ chối')).toBeTruthy();
  });

  it('ADMIN không thấy widget của CUSTOMER/OWNER', async () => {
    asUser(UserRole.ADMIN);
    renderApp({ route: '/dashboard' });

    await waitFor(() => expect(screen.getByTestId('kpi-admin-pending')).toBeTruthy());
    expect(screen.queryByText('Đơn sắp tới')).toBeNull();
    expect(screen.queryByRole('link', { name: /Xem QR check-in/ })).toBeNull();
    expect(screen.queryByText('Tổng sân của tôi')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Xem thống kê' })).toBeNull();
  });
});
