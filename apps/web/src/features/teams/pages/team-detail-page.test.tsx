import { UserRole } from '@courthub/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { resetMockSession } from '../../../lib/api/mock-server';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { renderApp } from '../../../test/test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('TeamDetailPage', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession(
      {
        id: 'u-customer-01',
        email: 'customer@courthub.vn',
        role: UserRole.CUSTOMER,
        fullName: 'Nguyễn Văn Bình',
      },
      'tok',
    );
    resetMockSession();
  });

  it('hiển thị thông tin đội, danh sách thành viên và sổ quỹ', async () => {
    renderApp({ route: '/dashboard/teams/team-01' });
    await waitFor(() => {
      expect(screen.getByText('Dragon Pickleball Club')).toBeTruthy();
      expect(screen.getByText(/Thành viên \(3\)/)).toBeTruthy();
      expect(screen.getByText('Sổ quỹ chia tiền')).toBeTruthy();
      expect(screen.getAllByText(/80\.000₫/).length).toBeGreaterThan(0);
    });
  });

  it('S2-F1: hiển thị lịch sử đặt sân của đội từ các đơn gắn teamId', async () => {
    renderApp({ route: '/dashboard/teams/team-01' });
    await waitFor(() => {
      expect(screen.getByText('Lịch sử đặt sân của đội')).toBeTruthy();
      // Đơn CH-20260828-0001 trong mock được gắn teamId 'team-01'
      expect(screen.getAllByText(/CH-20260828-0001/).length).toBeGreaterThan(0);
    });
  });

  it('sao chép link mời thành công hiển thị trạng thái đã sao chép', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    renderApp({ route: '/dashboard/teams/team-01' });
    await waitFor(() => {
      expect(screen.getByText(/Sao chép link mời/)).toBeTruthy();
    });

    await user.click(screen.getByRole('button', { name: /Sao chép link mời/ }));
    await waitFor(() => {
      expect(screen.getByText('Đã sao chép')).toBeTruthy();
    });
  });

  it('đánh dấu khoản chia tiền là đã trả cập nhật badge trạng thái', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/dashboard/teams/team-01' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Đánh dấu đã thanh toán/ })).toBeTruthy();
    });

    await user.click(screen.getByRole('button', { name: /Đánh dấu đã thanh toán/ }));
    await waitFor(() => {
      const badges = screen.getAllByText('Đã trả');
      expect(badges.length).toBeGreaterThan(0);
    });
  });
});
