/** Test quên/đặt lại mật khẩu chạy ở chế độ mock (P1-F2). */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { handleMockRequest, resetMockSession } from '../../../lib/api/mock-server';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { renderApp } from '../../../test/test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('Quên mật khẩu (/quen-mat-khau)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    resetMockSession();
  });

  it('mock mode hiển thị link đặt lại dev sau khi gửi email', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/quen-mat-khau' });

    await user.type(await screen.findByLabelText('Email'), 'customer@courthub.vn');
    await user.click(screen.getByRole('button', { name: 'Gửi hướng dẫn đặt lại mật khẩu' }));

    const link = await screen.findByRole('link', { name: /Đặt lại mật khẩu ngay/ });
    expect(link.getAttribute('href')).toMatch(/^\/dat-lai-mat-khau\?token=reset-/);
  });

  it('link "Quên mật khẩu?" trên /login trỏ tới /quen-mat-khau', async () => {
    renderApp({ route: '/login' });
    const link = await screen.findByRole('link', { name: 'Quên mật khẩu?' });
    expect(link.getAttribute('href')).toBe('/quen-mat-khau');
  });
});

describe('Đặt lại mật khẩu (/dat-lai-mat-khau?token=)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    resetMockSession();
  });

  async function requestToken(email: string): Promise<string> {
    const response = await handleMockRequest<{ message: string; devResetLink?: string }>(
      '/auth/forgot-password',
      'POST',
      { email },
    );
    return (response.devResetLink ?? '').split('token=')[1] ?? '';
  }

  it('submit form gọi POST /auth/reset-password và mật khẩu mới đăng nhập được', async () => {
    const token = await requestToken('customer@courthub.vn');
    expect(token).not.toBe('');
    const user = userEvent.setup();
    renderApp({ route: '/dat-lai-mat-khau?token=' + token });

    await user.type(await screen.findByLabelText('Mật khẩu mới'), 'MatKhauMoi@2026');
    await user.type(screen.getByLabelText('Nhập lại mật khẩu mới'), 'MatKhauMoi@2026');
    await user.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));

    // Thành công -> về trang đăng nhập.
    expect(await screen.findByRole('heading', { name: 'Đăng nhập CourtHub' })).toBeTruthy();

    // Bằng chứng endpoint đúng: mật khẩu MỚI đăng nhập được qua mock server,
    // mật khẩu CŨ bị từ chối.
    await expect(
      handleMockRequest('/auth/login', 'POST', {
        email: 'customer@courthub.vn',
        password: 'MatKhauMoi@2026',
      }),
    ).resolves.toBeTruthy();
    await expect(
      handleMockRequest('/auth/login', 'POST', {
        email: 'customer@courthub.vn',
        password: 'Courthub@2026',
      }),
    ).rejects.toThrow(/Email hoặc mật khẩu không đúng/);
  });

  it('token sai hiển thị thông báo lỗi từ API', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/dat-lai-mat-khau?token=token-khong-ton-tai' });

    await user.type(await screen.findByLabelText('Mật khẩu mới'), 'MatKhauMoi@2026');
    await user.type(screen.getByLabelText('Nhập lại mật khẩu mới'), 'MatKhauMoi@2026');
    await user.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));

    await waitFor(() => {
      // friendlyApiMessage map RESET_TOKEN_INVALID -> thông báo chuẩn hoá.
      expect(screen.getByText('Liên kết đặt lại mật khẩu không hợp lệ.')).toBeTruthy();
    });
  });

  it('hai mật khẩu không khớp bị chặn bởi validate zod', async () => {
    const token = await requestToken('customer@courthub.vn');
    const user = userEvent.setup();
    renderApp({ route: '/dat-lai-mat-khau?token=' + token });

    await user.type(await screen.findByLabelText('Mật khẩu mới'), 'MatKhauMoi@2026');
    await user.type(screen.getByLabelText('Nhập lại mật khẩu mới'), 'KhacRoif@2026');
    await user.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));

    expect(await screen.findByText('Mật khẩu nhập lại không khớp.')).toBeTruthy();
  });
});
