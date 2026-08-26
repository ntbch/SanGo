/** Test trang hồ sơ cá nhân /dashboard/profile (P1-F2) chạy ở chế độ mock. */
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { handleMockRequest, resetMockSession } from '../../../../src/lib/api/mock-server';
import { useAuthStore } from '../../../../src/lib/auth/auth-store';
import { type AuthResponse } from '../../../../src/lib/api/types';
import { renderApp } from '../../../test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

const DEMO_EMAIL = 'customer@sango.vn';
const DEMO_PASSWORD = 'Sango@2026';

/** Đăng nhập qua mock server để tạo phiên (PATCH/change-password cần phiên). */
async function loginMockAndStore(): Promise<AuthResponse> {
  const session = await handleMockRequest<AuthResponse>('/auth/login', 'POST', {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  useAuthStore.getState().setSession(session.user, session.accessToken);
  return session;
}

describe('ProfilePage (/dashboard/profile)', () => {
  // Toaster nằm ngoài container của render -> phải cleanup thủ công giữa các case.
  afterEach(() => cleanup());

  beforeEach(async () => {
    useAuthStore.getState().clearSession();
    resetMockSession();
    await loginMockAndStore();
  });

  it('avatar không có ảnh -> fallback chữ cái đầu họ tên', async () => {
    renderApp({ route: '/dashboard/profile' });

    const fallback = await screen.findByTestId('avatar-fallback');
    expect(fallback.textContent).toBe('N'); // Nguyễn Văn Bình
  });

  it('lưu hồ sơ gọi PATCH /users/me: đổi fullName rồi đăng nhập lại thấy tên mới', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/dashboard/profile' });

    const fullNameInput = await screen.findByLabelText('Họ tên');
    await user.clear(fullNameInput);
    await user.type(fullNameInput, 'Nguyễn Văn Bình Mới');
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    // Thông báo thành công hiển thị.
    expect(await screen.findByText('Đã lưu hồ sơ')).toBeTruthy();

    // Bằng chứng endpoint + payload đúng: mock account đã đổi, login trả tên mới.
    const relogin = await handleMockRequest<{ user: { fullName: string } }>('/auth/login', 'POST', {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    expect(relogin.user.fullName).toBe('Nguyễn Văn Bình Mới');
  });

  it('phone sai định dạng bị chặn bởi validate zod', async () => {
    const user = userEvent.setup();
    // Baseline tên hiện tại của account (test trước có thể đã đổi).
    const baseline = await handleMockRequest<{ user: { fullName: string } }>(
      '/auth/login',
      'POST',
      {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      },
    );
    const baselineName = baseline.user.fullName;
    renderApp({ route: '/dashboard/profile' });

    const phoneInput = await screen.findByLabelText('Số điện thoại');
    await user.clear(phoneInput);
    await user.type(phoneInput, 'abc123');
    await user.type(screen.getByLabelText('Họ tên'), 'X'); // đuổi focus cho ổn định
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    expect(await screen.findByText(/Số điện thoại Việt Nam không hợp lệ/)).toBeTruthy();
    // Bằng chứng không gọi PATCH: tên trên account KHÔNG đổi so với baseline
    // (các test trước có thể đã sửa tên, nên so tương đối chứ không so seed).
    const relogin = await handleMockRequest<{ user: { fullName: string } }>('/auth/login', 'POST', {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    expect(relogin.user.fullName).toBe(baselineName);
  });

  it('đổi mật khẩu sai mật khẩu hiện tại -> thông báo lỗi từ API', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/dashboard/profile' });

    await user.type(await screen.findByLabelText('Mật khẩu hiện tại'), 'SaiMatKhau@1');
    await user.type(screen.getByLabelText(/^Mật khẩu mới$/), 'MatKhauMoi@2027');
    await user.type(screen.getByLabelText('Nhập lại mật khẩu mới'), 'MatKhauMoi@2027');
    await user.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    await waitFor(() => {
      expect(screen.getByText('Mật khẩu hiện tại không đúng')).toBeTruthy();
    });
    // Vẫn ở trang profile — chưa bị đăng xuất.
    expect(screen.getByRole('heading', { name: 'Hồ sơ cá nhân' })).toBeTruthy();
  });

  it('đổi mật khẩu đúng -> về /login và mật khẩu mới đăng nhập được', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/dashboard/profile' });

    await user.type(await screen.findByLabelText('Mật khẩu hiện tại'), DEMO_PASSWORD);
    await user.type(screen.getByLabelText(/^Mật khẩu mới$/), 'MatKhauMoi@2027');
    await user.type(screen.getByLabelText('Nhập lại mật khẩu mới'), 'MatKhauMoi@2027');
    await user.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));

    // Thành công -> đẩy về trang đăng nhập.
    expect(await screen.findByRole('heading', { name: 'Đăng nhập SanGo' })).toBeTruthy();

    // Endpoint đúng: mock account đã đổi sang mật khẩu mới.
    await expect(
      handleMockRequest('/auth/login', 'POST', {
        email: DEMO_EMAIL,
        password: 'MatKhauMoi@2027',
      }),
    ).resolves.toBeTruthy();
  });
});
