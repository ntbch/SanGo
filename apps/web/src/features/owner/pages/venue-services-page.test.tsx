import { UserRole } from '@courthub/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { resetMockSession } from '../../../lib/api/mock-server';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { renderApp } from '../../../test/test-utils';
import type { RenderResult } from '@testing-library/react';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('VenueServicesPage', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession(
      {
        id: 'u-owner',
        email: 'owner@courthub.vn',
        role: UserRole.OWNER,
        fullName: 'Chủ Sân',
      },
      'tok',
    );
    resetMockSession();
  });

  /** Radix Label không gắn htmlFor trong jsdom -> query select theo id. */
  async function chooseVenue(user: ReturnType<typeof userEvent.setup>): Promise<RenderResult> {
    const view = renderApp({ route: '/dashboard/services' });
    const select = await waitFor(() => {
      const el = view.container.querySelector<HTMLSelectElement>('#svc-venue');
      // Chờ danh sách sân từ /venues/mine đổ vào option.
      if (el === null || el.querySelector('option[value="v-1"]') === null) {
        throw new Error('Chưa render selector cụm sân');
      }
      return el;
    });
    await user.selectOptions(select, 'Sân Pickleball Saigon');
    return view;
  }

  it('hiển thị menu dịch vụ của cụm sân kèm trạng thái bán', async () => {
    const user = userEvent.setup();
    const view = await chooseVenue(user);
    expect(view.container.querySelector('#svc-venue')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText('Nước suối 500ml')).toBeTruthy();
      expect(screen.getByText('Thuê vợt Pickleball')).toBeTruthy();
    });
    expect(screen.getByText('Tạm tắt')).toBeTruthy();
    expect(screen.getAllByText('Đang bán').length).toBeGreaterThan(0);
  });

  it('thêm dịch vụ mới qua dialog rồi thấy trong danh sách', async () => {
    const user = userEvent.setup();
    await chooseVenue(user);
    await waitFor(() => {
      expect(screen.getByText('Nước suối 500ml')).toBeTruthy();
    });

    await user.click(screen.getByRole('button', { name: 'Thêm dịch vụ' }));
    await user.type(screen.getByLabelText('Tên dịch vụ'), 'Trà đá chanh');
    await user.click(screen.getByRole('button', { name: 'Thêm vào menu' }));

    await waitFor(() => {
      expect(screen.getByText('Trà đá chanh')).toBeTruthy();
      expect(screen.queryByLabelText('Tên dịch vụ')).toBeNull();
    });
  });
});
