import { UserRole } from '@courthub/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import { resetMockSession } from '../../lib/api/mock-server';
import { useAuthStore } from '../../lib/auth/auth-store';
import { renderApp } from '../../test/test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('ReputationCard trên trang hồ sơ (S3-F2)', () => {
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

  it('hiển thị điểm uy tín, breakdown và huy hiệu đạt được', async () => {
    renderApp({ route: '/dashboard/profile' });
    await waitFor(() => {
      expect(screen.getByText('Điểm uy tín')).toBeTruthy();
      // Mock: customer-01 có 11 lần đúng giờ -> badge unlocked (current cap tại target)
      expect(screen.getByText(/Đúng giờ 10 lần/)).toBeTruthy();
      expect(screen.getAllByText('10/10').length).toBeGreaterThan(0);
      // Breakdown
      expect(screen.getByText(/Hủy sát giờ:/)).toBeTruthy();
      expect(screen.getByText(/No-show:/)).toBeTruthy();
    });
  });
});
