import { screen } from '@testing-library/react';
import { UserRole } from '@sango/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resetMockSession } from '../src/lib/api/mock-server';
import { useAuthStore } from '../src/lib/auth/auth-store';
import { type AuthUser } from '../src/lib/api/types';
import { renderApp } from './test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

const sampleUser: AuthUser = {
  id: 'u-1',
  email: 'customer@sango.vn',
  fullName: 'Nguyễn Văn Bình',
  role: UserRole.CUSTOMER,
};

describe('App smoke', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    resetMockSession();
  });

  it('chưa đăng nhập truy cập "/" → thấy landing công khai thay vì bị đẩy sang /login', async () => {
    renderApp({ route: '/' });

    // Hero landing hiển thị cho khách.
    expect(await screen.findByRole('heading', { level: 1, name: /SanGo/ })).toBeTruthy();
    // CTA chính của landing.
    expect(screen.getByRole('link', { name: 'Khám phá sân' })).toBeTruthy();
    // Top sân nổi bật nạp từ GET /venues public (mock Hà Nội).
    expect(await screen.findByText('Sân Thể Thao Quần Ngựa')).toBeTruthy();
    // Không còn redirect sang trang đăng nhập.
    expect(screen.queryByRole('heading', { name: 'Đăng nhập SanGo' })).toBeNull();
  });

  it('customer đăng nhập truy cập "/" → KHÔNG thấy Bảng điều khiển, CTA là Đơn đặt sân', async () => {
    useAuthStore.getState().setSession(sampleUser, 'token-test');
    renderApp({ route: '/' });

    expect(await screen.findByRole('heading', { level: 1, name: /SanGo/ })).toBeTruthy();
    // Quyết định UX mới: khái niệm "Bảng điều khiển" chỉ dành cho chủ sân/quản trị.
    expect(screen.queryByRole('link', { name: /Bảng điều khiển/i })).toBeNull();
    expect((await screen.findAllByRole('link', { name: 'Đơn đặt sân' })).length).toBeGreaterThan(0);
    // Người dùng đã đăng nhập không còn thấy CTA Đăng ký ở hero (header cũng ẩn).
    expect(screen.queryByRole('link', { name: 'Đăng ký' })).toBeNull();
  });
});
