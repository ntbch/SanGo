import { UserRole } from '@courthub/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { resetMockSession } from '../../../lib/api/mock-server';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { renderApp } from '../../../test/test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('TournamentDetailPage (S3-F7)', () => {
  beforeEach(() => {
    resetMockSession();
  });

  it('render bracket đủ 7 trận theo cột round QF/SF/F', async () => {
    useAuthStore.getState().setSession(
      {
        id: 'u-customer-01',
        email: 'customer@courthub.vn',
        role: UserRole.CUSTOMER,
        fullName: 'Nguyễn Văn Bình',
      },
      'tok',
    );

    renderApp({ route: '/tournaments/tour-01' });
    await waitFor(() => {
      expect(screen.getByText('CourtHub Open 2026')).toBeTruthy();
    });

    // 7 trận: 4 QF + 2 SF + 1 F
    expect(screen.getAllByTestId('bracket-match').length).toBe(7);
    expect(screen.getByText('Tứ kết')).toBeTruthy();
    expect(screen.getByText('Bán kết')).toBeTruthy();
    expect(screen.getByText('Chung kết')).toBeTruthy();

    // Đội thua mờ đi, đội thắng highlight — QF1: FC CourtHub thắng Cầu Giấy
    const rows = screen.getAllByText('FC CourtHub');
    expect(rows.length).toBeGreaterThan(0);
    // Giải ONGOING chưa có banner vô địch
    expect(screen.queryByTestId('champion-banner')).toBeNull();
  });

  it('host nhập tỷ số trận READY — winner tự đẩy sang vòng sau', async () => {
    useAuthStore.getState().setSession(
      {
        id: 'u-owner-01',
        email: 'owner@courthub.vn',
        role: UserRole.OWNER,
        fullName: 'Trần Thị Cẩm Lan',
      },
      'tok',
    );

    const user = userEvent.setup();
    renderApp({ route: '/tournaments/tour-01' });
    await waitFor(() => {
      expect(screen.getAllByTestId('bracket-match').length).toBe(7);
    });

    // SF2 là trận READY duy nhất còn lại (Rangers vs Than Xuân)
    const readyMatch = screen
      .getAllByTestId('bracket-match')
      .find((el) => el.getAttribute('data-status') === 'READY');
    expect(readyMatch).toBeTruthy();

    await user.click(
      within(readyMatch as HTMLElement).getByRole('button', { name: /Nhập tỷ số/i }),
    );
    await user.type(within(readyMatch as HTMLElement).getByLabelText('Tỷ số đội nhà'), '2');
    await user.type(within(readyMatch as HTMLElement).getByLabelText('Tỷ số đội khách'), '3');
    await user.click(within(readyMatch as HTMLElement).getByRole('button', { name: /Lưu/i }));

    // Sau khi lưu: chung kết đủ 2 đội -> READY, và Than Xuân xuất hiện ở cột chung kết
    await waitFor(() => {
      const final = screen
        .getAllByTestId('bracket-match')
        .find((el) => el.getAttribute('data-status') === 'READY');
      expect(final).toBeTruthy();
      expect(within(final as HTMLElement).getByText(/Than Xuân FC/)).toBeTruthy();
    });
  });

  it('giải FINISHED hiển thị banner đội vô địch', async () => {
    renderApp({ route: '/tournaments/tour-03' });
    await waitFor(() => {
      expect(screen.getByText('Spring Cup 2026')).toBeTruthy();
    });
    const banner = screen.getByTestId('champion-banner');
    expect(within(banner).getByText('Đội vô địch')).toBeTruthy();
    expect(within(banner).getByText('FC CourtHub')).toBeTruthy();
  });
});
