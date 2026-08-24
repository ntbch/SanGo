import { UserRole } from '@courthub/shared';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resetMockSession } from '../lib/api/mock-server';
import { useAuthStore } from '../lib/auth/auth-store';
import { type AuthUser } from '../lib/api/types';
import { renderApp } from '../test/test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

function asUser(role: UserRole): void {
  const user: AuthUser = { id: 'u-1', email: 'u@courthub.vn', fullName: 'Người Dùng', role };
  useAuthStore.getState().setSession(user, 'token-test');
}

describe('routing + role guards', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    resetMockSession();
  });

  it('/dashboard chưa đăng nhập → về /login', async () => {
    renderApp({ route: '/dashboard' });

    expect(await screen.findByRole('heading', { name: 'Đăng nhập CourtHub' })).toBeTruthy();
  });

  it('CUSTOMER thấy tổng quan nhưng không thấy mục quản trị', async () => {
    asUser(UserRole.CUSTOMER);
    renderApp({ route: '/dashboard' });

    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeTruthy();
    expect(screen.queryByText('Quản trị hệ thống')).toBeNull();
  });

  it('CUSTOMER lách vào /dashboard/admin → bị đẩy về tổng quan', async () => {
    asUser(UserRole.CUSTOMER);
    renderApp({ route: '/dashboard/admin' });

    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Quản trị hệ thống' })).toBeNull();
  });

  it('OWNER vào được trang quản lý sân', async () => {
    asUser(UserRole.OWNER);
    renderApp({ route: '/dashboard/manage' });

    expect(await screen.findByRole('heading', { name: 'Sân của tôi' })).toBeTruthy();
  });

  it('đã đăng nhập vào /login → chuyển tới dashboard', async () => {
    asUser(UserRole.ADMIN);
    renderApp({ route: '/login' });

    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeTruthy();
  });
});
