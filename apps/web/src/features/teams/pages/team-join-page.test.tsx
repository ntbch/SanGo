import { UserRole } from '@courthub/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import { resetMockSession } from '../../../lib/api/mock-server';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { renderApp } from '../../../test/test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('TeamJoinPage', () => {
  beforeEach(() => {
    resetMockSession();
  });

  it('S2-F1: thành viên mở link mời thấy thông tin đội và nút vào trang đội', async () => {
    useAuthStore.getState().setSession(
      {
        id: 'u-customer-01',
        email: 'customer@courthub.vn',
        role: UserRole.CUSTOMER,
        fullName: 'Nguyễn Văn Bình',
      },
      'tok',
    );

    renderApp({ route: '/dashboard/teams/join?team=team-01' });
    await waitFor(() => {
      expect(screen.getByText('Dragon Pickleball Club')).toBeTruthy();
      expect(screen.getByText('Bạn đã là thành viên của đội này')).toBeTruthy();
      expect(screen.getByRole('link', { name: /Vào trang đội/i })).toBeTruthy();
    });
  });

  it('S2-F1: link trỏ tới đội không tồn tại hiển thị thông báo lỗi rõ ràng', async () => {
    // Mock dùng sessionEmail nội bộ (mặc định customer-01 — thành viên team-01),
    // nên case "người lạ" không dựng được bằng account seed; kiểm tra nhánh 404.
    useAuthStore.getState().setSession(
      {
        id: 'u-customer-01',
        email: 'customer@courthub.vn',
        role: UserRole.CUSTOMER,
        fullName: 'Nguyễn Văn Bình',
      },
      'tok',
    );

    renderApp({ route: '/dashboard/teams/join?team=team-404' });
    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy đội thể thao')).toBeTruthy();
    });
  });

  it('S2-F1: link thiếu mã đội hiển thị thông báo không hợp lệ', async () => {
    useAuthStore.getState().setSession(
      {
        id: 'u-customer-01',
        email: 'customer@courthub.vn',
        role: UserRole.CUSTOMER,
        fullName: 'Nguyễn Văn Bình',
      },
      'tok',
    );

    renderApp({ route: '/dashboard/teams/join' });
    await waitFor(() => {
      expect(screen.getByText('Liên kết mời không hợp lệ')).toBeTruthy();
    });
  });
});
