import { UserRole } from '@courthub/shared';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { useLocation } from 'react-router-dom';

import { resetMockSession } from '../lib/api/mock-server';
import { useAuthStore } from '../lib/auth/auth-store';
import { type AuthUser } from '../lib/api/types';
import { renderApp } from '../test/test-utils';

import { AppRoutes } from './router';

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

/** Đọc URL hiện tại của MemoryRouter để khẳng định redirect login?next. */
function RouteProbe(): ReactElement {
  const location = useLocation();
  return <div data-testid="route-loc">{location.pathname + location.search}</div>;
}

describe('guest browsing công khai (P1-F1)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    resetMockSession();
  });

  it('guest vào /venues xem được danh sách sân thay vì bị đẩy /login', async () => {
    renderApp({ route: '/venues' });

    expect(await screen.findByText('Sân Thể Thao Quần Ngựa')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Đăng nhập CourtHub' })).toBeNull();
  });

  it('guest vào /matches xem được danh sách trận mở', async () => {
    renderApp({ route: '/matches' });

    expect(await screen.findByText(/Sân Pickleball Saigon · Sân 1/)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Đăng nhập CourtHub' })).toBeNull();
  });

  it('guest vào /venues/:slug xem được chi tiết sân', async () => {
    renderApp({ route: '/venues/san-the-thao-quan-ngua' });

    expect(await screen.findByRole('heading', { name: 'Sân Thể Thao Quần Ngựa' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Đăng nhập CourtHub' })).toBeNull();
  });

  it('guest bấm Giữ chỗ & Thanh toán → /login?next=<đường hiện tại>', async () => {
    const user = userEvent.setup();
    renderApp({
      route: '/venues/san-pickleball-saigon/book',
      ui: (
        <>
          <AppRoutes />
          <RouteProbe />
        </>
      ),
    });
    await screen.findByText('Chọn giờ đặt sân');
    const availableSlots = await screen.findAllByText('Trống');
    await user.click(availableSlots[0]);
    await user.click(await screen.findByRole('button', { name: /Giữ chỗ & Thanh toán/ }));

    await waitFor(() => {
      expect(screen.getByTestId('route-loc').textContent).toBe(
        '/login?next=%2Fvenues%2Fsan-pickleball-saigon%2Fbook',
      );
    });
  });

  it('guest bấm Tham gia trận → /login?next=%2Fmatches', async () => {
    const user = userEvent.setup();
    renderApp({
      route: '/matches',
      ui: (
        <>
          <AppRoutes />
          <RouteProbe />
        </>
      ),
    });
    const joinButtons = await screen.findAllByRole('button', { name: 'Tham gia' });
    expect(joinButtons.length).toBeGreaterThan(0);
    await user.click(joinButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('route-loc').textContent).toBe('/login?next=%2Fmatches');
    });
  });

  it('?next= hợp lệ → sau đăng nhập về đúng trang đích thay vì /dashboard', async () => {
    const user = userEvent.setup();
    renderApp({
      route: '/login?next=%2Fvenues',
      ui: (
        <>
          <AppRoutes />
          <RouteProbe />
        </>
      ),
    });
    await user.type(screen.getByLabelText('Email'), 'customer@courthub.vn');
    await user.type(screen.getByLabelText('Mật khẩu'), 'Courthub@2026');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    await waitFor(() => {
      expect(screen.getByTestId('route-loc').textContent).toBe('/venues');
    });
    // Đích đến thực sự render được: danh sách sân public hiện ra.
    expect(await screen.findByText('Sân Thể Thao Quần Ngựa')).toBeTruthy();
  });

  it('?next= ngoài domain (//evil.com) → bỏ qua, về /dashboard sau đăng nhập', async () => {
    const user = userEvent.setup();
    renderApp({
      route: '/login?next=' + encodeURIComponent('//evil.com'),
      ui: (
        <>
          <AppRoutes />
          <RouteProbe />
        </>
      ),
    });
    await user.type(screen.getByLabelText('Email'), 'customer@courthub.vn');
    await user.type(screen.getByLabelText('Mật khẩu'), 'Courthub@2026');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    await waitFor(() => {
      expect(screen.getByTestId('route-loc').textContent).toBe('/dashboard');
    });
  });
});
