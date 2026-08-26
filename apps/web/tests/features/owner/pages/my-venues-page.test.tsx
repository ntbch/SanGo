import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserRole } from '@sango/shared';

import { resetMockSession } from '../../../../src/lib/api/mock-server';
import { useAuthStore } from '../../../../src/lib/auth/auth-store';
import { renderApp } from '../../../test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('MyVenuesPage (owner dashboard)', () => {
  beforeEach(() => {
    useAuthStore
      .getState()
      .setSession(
        { id: 'u-owner', email: 'owner@sango.vn', role: UserRole.OWNER, fullName: 'Chủ Sân' },
        'tok',
      );
    resetMockSession();
  });

  it('hiển thị danh sách sân của owner kèm badge trạng thái', async () => {
    renderApp({ route: '/dashboard/manage' });
    await waitFor(() => {
      expect(screen.getByText('Sân Pickleball Saigon')).toBeTruthy();
      expect(screen.getByText('Đã duyệt')).toBeTruthy();
      expect(screen.getByText('Chờ duyệt')).toBeTruthy();
      expect(screen.getByText('Bị từ chối')).toBeTruthy();
    });
  });

  it('chọn cụm sân hiển thị panel sân con và giá', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/dashboard/manage' });
    const item = await screen.findByText('Sân Pickleball Saigon');
    await user.click(item);
    await waitFor(() => {
      expect(screen.getByText('Sân 1')).toBeTruthy();
      expect(screen.getByText('Sân 2')).toBeTruthy();
      expect(screen.getAllByText('Bảo trì').length).toBeGreaterThan(0);
    });
  });

  it('mở form tạo cụm sân mới qua wizard 3 bước', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/dashboard/manage' });
    await user.click(await screen.findByRole('button', { name: /tạo cụm sân mới/i }));
    await waitFor(() => {
      expect(screen.getByText(/Bước 1\/3/)).toBeTruthy();
      expect(screen.getByLabelText('Tên cụm sân')).toBeTruthy();
    });
  });
});
