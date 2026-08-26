import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserRole } from '@sango/shared';

import { resetMockSession } from '../../../../src/lib/api/mock-server';
import { useAuthStore } from '../../../../src/lib/auth/auth-store';
import { renderApp } from '../../../test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('ApprovalQueuePage (admin)', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession(
      {
        id: 'u-admin',
        email: 'admin@sango.vn',
        role: UserRole.ADMIN,
        fullName: 'Quản Trị Viên',
      },
      'tok',
    );
    resetMockSession();
  });

  it('hiển thị hàng chờ sân PENDING', async () => {
    renderApp({ route: '/dashboard/admin' });
    await waitFor(() => {
      expect(screen.getByText('Cụm Cầu lông Thủ Đức')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Duyệt' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Từ chối' })).toBeTruthy();
    });
  });

  it('mở modal từ chối kèm lý do', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/dashboard/admin' });
    const btn = await screen.findByRole('button', { name: 'Từ chối' });
    await user.click(btn);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Từ chối/ })).toBeTruthy();
      expect(screen.getByLabelText('Lý do từ chối')).toBeTruthy();
    });
  });
});
