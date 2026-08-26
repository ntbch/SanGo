import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserRole } from '@sango/shared';

import { resetMockSession } from '../../../../src/lib/api/mock-server';
import { useAuthStore } from '../../../../src/lib/auth/auth-store';
import { renderApp } from '../../../test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('OwnerBookingsPage', () => {
  beforeEach(() => {
    useAuthStore
      .getState()
      .setSession(
        { id: 'u-owner', email: 'owner@sango.vn', role: UserRole.OWNER, fullName: 'Chủ Sân' },
        'tok',
      );
    resetMockSession();
  });

  it('hiển thị bảng đơn đặt và các hành động', async () => {
    renderApp({ route: '/dashboard/bookings' });
    await waitFor(() => {
      expect(screen.getByText('Minh T.')).toBeTruthy();
      expect(screen.getByText('Lan H.')).toBeTruthy();
      expect(screen.getAllByText('No-show').length).toBeGreaterThan(0);
    });
  });

  it('mở modal check-in khi nhấn nút', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/dashboard/bookings' });
    const btn = await screen.findByRole('button', { name: /check-in/i });
    await user.click(btn);
    await waitFor(() => {
      expect(screen.getByText('Check-in bằng mã đơn')).toBeTruthy();
    });
  });
});
