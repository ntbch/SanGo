import { UserRole } from '@courthub/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { resetMockSession } from '../../../lib/api/mock-server';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { renderApp } from '../../../test/test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('NotificationsPage', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession(
      {
        id: 'u-cust',
        email: 'customer@courthub.vn',
        role: UserRole.CUSTOMER,
        fullName: 'Khách Hàng',
      },
      'tok',
    );
    resetMockSession();
  });

  it('hiển thị hộp thư kèm badge số chưa đọc', async () => {
    renderApp({ route: '/dashboard/notifications' });
    await waitFor(() => {
      expect(screen.getByText('Đặt sân thành công')).toBeTruthy();
      expect(screen.getByText('Thanh toán thành công')).toBeTruthy();
      expect(screen.getByText('3 chưa đọc')).toBeTruthy();
    });
  });

  it('lọc Chưa đọc ẩn các mục đã đọc và trả lại khi chọn Tất cả', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/dashboard/notifications' });
    await waitFor(() => {
      expect(screen.getByText('Đặt sân thành công')).toBeTruthy();
    });

    await user.click(screen.getByRole('button', { name: 'Chưa đọc' }));
    await waitFor(() => {
      expect(screen.queryByText('Đơn đặt đã bị huỷ')).toBeNull(); // đã đọc từ seed
      expect(screen.getByText('Nhắc lịch: trận đấu sau 2 giờ')).toBeTruthy(); // chưa đọc
    });

    await user.click(screen.getByRole('button', { name: 'Tất cả' }));
    await waitFor(() => {
      expect(screen.getByText('Đơn đặt đã bị huỷ')).toBeTruthy();
    });
  });

  it('đánh dấu tất cả đã đọc làm badge chưa đọc biến mất', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/dashboard/notifications' });
    await waitFor(() => {
      expect(screen.getByText('3 chưa đọc')).toBeTruthy();
    });

    await user.click(screen.getByRole('button', { name: /Đánh dấu tất cả đã đọc/ }));
    await waitFor(() => {
      expect(screen.queryByTestId('unread-badge')).toBeNull();
    });
  });
});
