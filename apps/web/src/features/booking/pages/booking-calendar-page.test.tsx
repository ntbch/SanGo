import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserRole } from '@courthub/shared';
import { resetMockSession } from '../../../lib/api/mock-server';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { renderApp } from '../../../test/test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('BookingCalendarPage', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession(
      {
        id: 'u-cust',
        email: 'cust@courthub.vn',
        role: UserRole.CUSTOMER,
        fullName: 'Khách Hàng',
      },
      'tok',
    );
    resetMockSession();
  });

  it('render lịch tuần, danh sách sân con và thông tin giờ mở cửa', async () => {
    renderApp({ route: '/venues/san-pickleball-saigon/book' });
    await waitFor(() => {
      expect(screen.getByText('Chọn giờ đặt sân')).toBeTruthy();
      expect(screen.getByText(/Sân 1/)).toBeTruthy();
      expect(screen.getByText(/06:00 – 23:00/)).toBeTruthy();
    });
  });

  it('cho phép chọn slot trống và hiển thị thanh tính tiền', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/venues/san-pickleball-saigon/book' });
    await waitFor(() => {
      expect(screen.getByText('Chọn giờ đặt sân')).toBeTruthy();
    });

    const availableSlots = await screen.findAllByText('Trống');
    expect(availableSlots.length).toBeGreaterThan(0);

    await user.click(availableSlots[0]);
    await waitFor(() => {
      expect(screen.getByText(/Đã chọn 1 slot/)).toBeTruthy();
      expect(screen.getByText(/Giữ chỗ & Thanh toán/)).toBeTruthy();
    });
  });
});
