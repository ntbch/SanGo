import { UserRole } from '@courthub/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import { resetMockSession } from '../../../lib/api/mock-server';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { renderApp } from '../../../test/test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

function loginAs(id: string, email: string, role: UserRole, fullName: string): void {
  useAuthStore.getState().setSession({ id, email, role, fullName }, 'tok');
}

describe('TournamentsPage (S3-F7)', () => {
  beforeEach(() => {
    loginAs('u-customer-01', 'customer@courthub.vn', UserRole.CUSTOMER, 'Nguyễn Văn Bình');
    resetMockSession();
  });

  it('hiển thị danh sách giải kèm status badge, số đội và champion', async () => {
    renderApp({ route: '/tournaments' });
    await waitFor(() => {
      expect(screen.getByText('CourtHub Open 2026')).toBeTruthy();
      expect(screen.getByText('Đang diễn ra')).toBeTruthy();
      expect(screen.getByText('Pickleball Mùa Thu Cup')).toBeTruthy();
      expect(screen.getByText('Đang mở đăng ký')).toBeTruthy();
    });
    const counts = screen.getAllByTestId('team-count');
    expect(counts.some((el) => el.textContent === '8/8 đội')).toBe(true);
    expect(counts.some((el) => el.textContent === '2/8 đội')).toBe(true);
    // Giải FINISHED hiển thị champion trên card
    expect(screen.getAllByText(/🏆/).length).toBeGreaterThan(0);
    // Champion line: "🏆 FC CourtHub" — match bằng regex vì có emoji prefix
    expect(screen.getAllByText(/FC CourtHub/).length).toBeGreaterThan(0);
  });

  it('customer không thấy nút Tạo giải mới', async () => {
    renderApp({ route: '/tournaments' });
    await waitFor(() => {
      expect(screen.getByText('CourtHub Open 2026')).toBeTruthy();
    });
    expect(screen.queryByRole('button', { name: /Tạo giải mới/i })).toBeNull();
  });

  it('owner thấy nút Tạo giải mới', async () => {
    loginAs('u-owner-01', 'owner@courthub.vn', UserRole.OWNER, 'Trần Thị Cẩm Lan');
    renderApp({ route: '/tournaments' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tạo giải mới/i })).toBeTruthy();
    });
  });
});
