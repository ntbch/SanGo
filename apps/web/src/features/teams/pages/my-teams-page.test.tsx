import { UserRole } from '@courthub/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { resetMockSession } from '../../../lib/api/mock-server';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { renderApp } from '../../../test/test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('MyTeamsPage', () => {
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

  it('hiển thị danh sách đội tôi tham gia kèm số thành viên và vai trò', async () => {
    renderApp({ route: '/dashboard/teams' });
    await waitFor(() => {
      expect(screen.getByText('Dragon Pickleball Club')).toBeTruthy();
      expect(screen.getByText(/3 thành viên/)).toBeTruthy();
      expect(screen.getByText('Đội trưởng')).toBeTruthy();
    });
  });

  it('điều hướng tới trang tạo đội mới qua nút Tạo đội mới', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/dashboard/teams' });
    await waitFor(() => {
      expect(screen.getByText('Dragon Pickleball Club')).toBeTruthy();
    });

    const btn = screen.getByRole('link', { name: /Tạo đội mới/i });
    await user.click(btn);
    await waitFor(() => {
      expect(screen.getByText('Tạo đội thể thao mới')).toBeTruthy();
    });
  });

  it('tạo đội mới từ form và thấy đội xuất hiện trong danh sách', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/dashboard/teams/new' });
    await waitFor(() => {
      expect(screen.getByLabelText('Tên đội')).toBeTruthy();
    });

    await user.type(screen.getByLabelText('Tên đội'), 'Thunder Hawks');
    await user.click(screen.getByRole('button', { name: /Tạo đội$/i }));

    await waitFor(() => {
      // Sau tạo, điều hướng sang chi tiết đội
      expect(screen.getByText(/Thunder Hawks/)).toBeTruthy();
    });
  });
});
