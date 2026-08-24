import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resetMockSession } from '../../../lib/api/mock-server';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { renderApp } from '../../../test/test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('Trang xác thực (mock mode)', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    resetMockSession();
  });

  it('hiển thị form đăng nhập và gợi ý tài khoản demo', async () => {
    renderApp({ route: '/login' });

    expect(await screen.findByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Mật khẩu')).toBeTruthy();
    expect(screen.getByText('Chế độ demo (mock)')).toBeTruthy();
  });

  it('submit rỗng hiện lỗi validate zod', async () => {
    renderApp({ route: '/login' });
    await screen.findByRole('button', { name: 'Đăng nhập' });

    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByText('Email là bắt buộc.')).toBeTruthy();
  });

  it('đăng nhập owner thành công → vào dashboard', async () => {
    renderApp({ route: '/login' });

    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'owner@courthub.vn' },
    });
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'Courthub@2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeTruthy();
    expect(screen.getByText(/Xin chào Trần Thị Cẩm Lan/)).toBeTruthy();
  });

  it('form đăng ký thiếu họ tên hiện lỗi', async () => {
    renderApp({ route: '/register' });
    await screen.findByRole('button', { name: 'Đăng ký' });

    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));

    expect(await screen.findByText('Họ tên tối thiểu 2 ký tự.')).toBeTruthy();
  });

  it('quên mật khẩu gửi xong hiện thông báo đã gửi email', async () => {
    renderApp({ route: '/forgot-password' });

    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'customer@courthub.vn' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Gửi hướng dẫn đặt lại mật khẩu' }));

    expect(await screen.findByText('Đã gửi email hướng dẫn')).toBeTruthy();
  });
});
