import { UserRole } from '@sango/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { resetMockSession } from '../../../../src/lib/api/mock-server';
import { useAuthStore } from '../../../../src/lib/auth/auth-store';
import { renderApp } from '../../../test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('OwnerVouchersPage', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession(
      {
        id: 'u-owner',
        email: 'owner@sango.vn',
        role: UserRole.OWNER,
        fullName: 'Chủ Sân',
      },
      'tok',
    );
    resetMockSession();
  });

  it('hiển thị danh sách voucher seed kèm số lượt dùng', async () => {
    renderApp({ route: '/dashboard/vouchers' });
    await waitFor(() => {
      expect(screen.getByText('MUA50')).toBeTruthy();
      expect(screen.getByText('SALE10')).toBeTruthy();
      expect(screen.getByText('3/100')).toBeTruthy();
      expect(screen.getAllByText('Đang chạy').length).toBeGreaterThan(0);
    });
  });

  it('tạo voucher mới qua dialog rồi thấy mã trong danh sách', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/dashboard/vouchers' });
    await waitFor(() => {
      expect(screen.getByText('MUA50')).toBeTruthy();
    });

    await user.click(screen.getByRole('button', { name: 'Tạo voucher' }));
    await user.type(screen.getByLabelText('Mã voucher'), 'TESTR20');
    await user.click(screen.getByRole('button', { name: 'Tạo mã' }));

    await waitFor(() => {
      expect(screen.getByText('TESTR20')).toBeTruthy();
      expect(screen.queryByLabelText('Mã voucher')).toBeNull();
    });
  });
});
