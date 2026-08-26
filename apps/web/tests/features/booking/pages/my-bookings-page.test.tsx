import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserRole } from '@sango/shared';
import { resetMockSession } from '../../../../src/lib/api/mock-server';
import { useAuthStore } from '../../../../src/lib/auth/auth-store';
import { renderApp } from '../../../test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('MyCustomerBookingsPage', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession(
      {
        id: 'u-cust',
        email: 'cust@sango.vn',
        role: UserRole.CUSTOMER,
        fullName: 'Khách Hàng',
      },
      'tok',
    );
    resetMockSession();
  });

  it('hiển thị danh sách đơn sắp chơi và nút huỷ đơn', async () => {
    renderApp({ route: '/dashboard/my-bookings' });
    await waitFor(() => {
      expect(screen.getByText('Đơn đặt sân của tôi')).toBeTruthy();
      expect(screen.getByText('CH-20260828-0001')).toBeTruthy();
      expect(screen.getByText('Huỷ đơn')).toBeTruthy();
    });
  });

  it('mở modal huỷ đơn hiển thị mức hoàn dự kiến', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/dashboard/my-bookings' });
    await waitFor(() => {
      expect(screen.getByText('CH-20260828-0001')).toBeTruthy();
    });

    const cancelBtn = screen.getByText('Huỷ đơn');
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(screen.getByText(/Mức hoàn dự kiến/)).toBeTruthy();
      expect(screen.getByText('Xác nhận huỷ')).toBeTruthy();
    });
  });

  it('đơn công khai có badge Đang tìm người và mở modal người tham gia', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/dashboard/my-bookings' });
    await waitFor(() => {
      expect(screen.getByText('CH-20260828-0001')).toBeTruthy();
    });

    // Badge ghép trận trên đơn CONFIRMED công khai
    expect(screen.getByTestId('open-match-badge').textContent).toContain('Đang tìm người');

    // Mở modal danh sách người tham gia (chủ đơn xem được)
    await user.click(screen.getByTestId('view-participants'));
    expect(await screen.findByText(/Người tham gia CH-20260828-0001/)).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn Bình')).toBeTruthy();
      expect(screen.getByText('1/4 người')).toBeTruthy();
    });
  });
});
