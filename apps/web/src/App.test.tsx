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

  it('chưa đăng nhập truy cập "/" → thấy landing công khai thay vì bị đẩy sang /login', async () => {
    renderApp({ route: '/' });

    // Hero landing hiển thị cho khách.
    expect(await screen.findByRole('heading', { level: 1, name: /CourtHub/ })).toBeTruthy();
    // CTA chính của landing.
    expect(screen.getByRole('link', { name: 'Khám phá sân' })).toBeTruthy();
    // Top sân nổi bật nạp từ GET /venues public (mock Hà Nội).
    expect(await screen.findByText('Sân Thể Thao Quần Ngựa')).toBeTruthy();
    // Không còn redirect sang trang đăng nhập.
    expect(screen.queryByRole('heading', { name: 'Đăng nhập CourtHub' })).toBeNull();
  });

  it('đã đăng nhập truy cập "/" → landing đổi CTA sang bảng điều khiển', async () => {
    useAuthStore.getState().setSession(sampleUser, 'token-test');
    renderApp({ route: '/' });

    expect(await screen.findByRole('heading', { level: 1, name: /CourtHub/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Vào bảng điều khiển' })).toBeTruthy();
    // Người dùng đã đăng nhập không còn thấy CTA Đăng ký ở hero (header cũng ẩn).
    expect(screen.queryByRole('link', { name: 'Đăng ký' })).toBeNull();
  });
});
