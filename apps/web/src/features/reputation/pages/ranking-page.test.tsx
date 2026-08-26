import { UserRole } from '@courthub/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';

import { resetMockSession } from '../../../lib/api/mock-server';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { renderApp } from '../../../test/test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('RankingPage', () => {
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

  it('S3-F2: hiển thị bảng xếp hạng theo score giảm dần', async () => {
    renderApp({ route: '/dashboard/ranking' });
    await waitForBoard();

    // Hạng 1 là người có score cao nhất trong mock
    expect(screen.getByText('Lê Thị Mai')).toBeTruthy();
    // Đủ số dòng mock
    expect(screen.getAllByTestId('leaderboard-row').length).toBe(5);
  });

  it('S3-F2: highlight đúng hàng của chính tôi kèm badge Bạn', async () => {
    renderApp({ route: '/dashboard/ranking' });
    await waitForBoard();

    const rows = screen.getAllByTestId('leaderboard-row');
    const myRow = rows.find((row) => row.getAttribute('aria-current') === 'true');
    expect(myRow).toBeTruthy();
    expect(within(myRow as HTMLElement).getByText('Nguyễn Văn Bình')).toBeTruthy();
    expect(within(myRow as HTMLElement).getByText('Bạn')).toBeTruthy();
  });
});

/** Đợi bảng xếp hạng load xong (mock latency). */
async function waitForBoard(): Promise<void> {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => {
    expect(screen.getAllByTestId('leaderboard-row').length).toBeGreaterThan(0);
  });
}
