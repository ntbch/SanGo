/** Test landing công khai "/" (P1-F1): hero + tính năng + Top sân nổi bật + SEO cơ bản. */
import { screen, waitFor } from '@testing-library/react';
import { UserRole } from '@sango/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resetMockSession } from '../../src/lib/api/mock-server';
import { useAuthStore } from '../../src/lib/auth/auth-store';
import { type AuthUser } from '../../src/lib/api/types';
import { renderApp } from '../test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

const sampleUser: AuthUser = {
  id: 'u-2',
  email: 'guest-viewer@sango.vn',
  fullName: 'Khách Tham Quan',
  role: UserRole.CUSTOMER,
};

describe('HomePage — landing công khai', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    resetMockSession();
  });

  it('render hero, 3 khối tính năng và Top sân nổi bật từ GET /venues public', async () => {
    renderApp({ route: '/' });

    expect(screen.getByRole('heading', { level: 1, name: /SanGo/ })).toBeTruthy();
    // Ba khối tính năng chính.
    expect(screen.getByText('Tìm sân theo bản đồ')).toBeTruthy();
    expect(screen.getByText('Giữ chỗ 10 phút')).toBeTruthy();
    expect(screen.getByText('Check-in QR')).toBeTruthy();

    // Top sân nổi bật: dữ liệu public mock (chỉ sân APPROVED tại Hà Nội).
    await waitFor(() => {
      expect(screen.getByText('Sân Thể Thao Quần Ngựa')).toBeTruthy();
    });
    // Liên kết xem toàn bộ danh sách sân.
    expect(screen.getByRole('link', { name: /Xem tất cả sân/ })).toBeTruthy();
  });

  it('khách thấy CTA Khám phá sân/Đăng ký; đã đăng nhập thấy Vào bảng điều khiển', async () => {
    const guest = renderApp({ route: '/' });
    expect(screen.getByRole('link', { name: 'Khám phá sân' })).toBeTruthy();
    expect((await screen.findAllByRole('link', { name: 'Đăng ký' })).length).toBeGreaterThan(0);
    guest.unmount();

    useAuthStore.getState().setSession(sampleUser, 'token-test');
    renderApp({ route: '/' });
    // Customer: không thấy "Bảng điều khiển", chỉ có lối "Đơn đặt sân" (nav + hero).
    expect(screen.queryByRole('link', { name: /Bảng điều khiển/i })).toBeNull();
    expect(screen.getAllByRole('link', { name: 'Đơn đặt sân' }).length).toBeGreaterThan(0);
  });

  it('SEO cơ bản: đặt <title> và meta description của landing', async () => {
    renderApp({ route: '/' });

    await screen.findByRole('heading', { level: 1, name: /SanGo/ });
    await waitFor(() => {
      expect(document.title).toContain('SanGo');
      expect(document.title).toContain('sân thể thao');
    });
    const meta = document.querySelector('meta[name="description"]');
    expect(meta).toBeTruthy();
    expect(meta?.getAttribute('content') ?? '').toMatch(/giữ chỗ|đặt cọc/i);
  });
});
