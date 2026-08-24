import { screen } from '@testing-library/react';
import { UserRole } from '@courthub/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resetMockSession } from './lib/api/mock-server';
import { useAuthStore } from './lib/auth/auth-store';
import { type AuthUser } from './lib/api/types';
import { renderApp } from './test/test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

const sampleUser: AuthUser = {
  id: 'u-1',
  email: 'customer@courthub.vn',
  fullName: 'Nguyễn Văn Bình',
  role: UserRole.CUSTOMER,
};

describe('App smoke', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    resetMockSession();
  });

  it('chưa đăng nhập truy cập “/” → redirect sang trang đăng nhập', async () => {
    renderApp({ route: '/' });

    expect(await screen.findByRole('heading', { name: 'Đăng nhập CourtHub' })).toBeTruthy();
  });

  it('đã đăng nhập truy cập “/” → trang chủ placeholder chào mừng', async () => {
    useAuthStore.getState().setSession(sampleUser, 'token-test');
    renderApp({ route: '/' });

    expect(await screen.findByRole('heading', { name: 'CourtHub' })).toBeTruthy();
  });
});
