/**
 * Test chuông thông báo in-app (P2-F1) — chế độ mock (VITE_USE_MOCK=true).
 * Đăng nhập qua mock thật (handleMockRequest /auth/login) để hộp thư theo
 * đúng user như backend: badge đếm đúng, mark-read + điều hướng, read-all,
 * empty state, poll dừng khi tab ẩn, lỗi tải im lặng thân thiện.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import { handleMockRequest, resetMockSession } from '../../../../src/lib/api/mock-server';
import { useAuthStore } from '../../../../src/lib/auth/auth-store';
import { createTestQueryClient } from '../../../test-utils';
import { ThemeProvider } from '../../../../src/components/theme/theme-provider';
import type { AuthResponse } from '../../../../src/lib/api/types';
import type * as NotificationsApi from '../../../../src/features/notifications/api';

vi.stubEnv('VITE_USE_MOCK', 'true');

// Đếm số lần GET /notifications: bọc hàm api qua vi.mock (giữ nguyên hành vi).
let listCallCount = 0;
vi.mock('../../../../src/features/notifications/api', async (importOriginal) => {
  const actual = await importOriginal<typeof NotificationsApi>();
  return {
    ...actual,
    fetchNotifications: (page = 1) => {
      listCallCount += 1;
      return actual.fetchNotifications(page);
    },
  };
});

function countListNotifications(): number {
  return listCallCount;
}

/** Đăng nhập mock + đồng bộ auth store — khớp pattern profile-page.test.tsx. */
async function loginMockAndStore(email: string): Promise<AuthResponse> {
  const session = await handleMockRequest<AuthResponse>('/auth/login', 'POST', {
    email,
    password: 'Sango@2026',
  });
  useAuthStore.getState().setSession(session.user, session.accessToken);
  return session;
}

/** Render chuông kèm 2 route tối giản để kiểm chứng điều hướng theo link. */
function renderBell(route = '/dashboard'): ReturnType<typeof render> {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <ThemeProvider defaultTheme="light">
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="/dashboard" element={<div data-testid="page-dashboard" />} />
            <Route
              path="/dashboard/my-bookings"
              element={<div data-testid="page-my-bookings">Đơn của tôi</div>}
            />
            <Route path="*" element={<div data-testid="page-other" />} />
          </Routes>
          <NotificationBell />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

import { NotificationBell } from '../../../../src/features/notifications/components/notification-bell';

describe('NotificationBell (chuông thông báo P2-F1)', () => {
  beforeEach(async () => {
    resetMockSession();
    await loginMockAndStore('customer@sango.vn');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('hiển thị badge số chưa đọc đúng từ mock (3 chưa đọc cho customer seed)', async () => {
    renderBell();
    const badge = await screen.findByTestId('notification-badge');
    await waitFor(() => {
      expect(badge.textContent).toBe('3');
    });
  });

  it('bấm thông báo chưa đọc: gọi mark-read + điều hướng theo link + badge giảm', async () => {
    const user = userEvent.setup();
    renderBell();

    await user.click(await screen.findByTestId('notification-bell'));
    const items = await screen.findAllByTestId('notification-item');
    // Mục mới nhất (n-cus-01, 3 phút trước) chưa đọc và có link /dashboard/my-bookings.
    const first = items[0];
    expect(first.getAttribute('data-unread')).toBe('true');
    await user.click(first);

    // Điều hướng theo link của thông báo.
    expect(await screen.findByTestId('page-my-bookings')).toBeTruthy();
    // Dòng chuyển đã đọc, badge giảm còn 2.
    await waitFor(() => {
      expect(screen.getAllByTestId('notification-item')[0].getAttribute('data-unread')).toBe(
        'false',
      );
      expect(screen.getByTestId('notification-badge').textContent).toBe('2');
    });
  });

  it('nút "Đánh dấu tất cả đã đọc" xoá sạch badge unread', async () => {
    const user = userEvent.setup();
    renderBell();
    await screen.findByTestId('notification-badge');

    await user.click(screen.getByTestId('notification-bell'));
    await user.click(await screen.findByTestId('mark-all-read'));

    await waitFor(() => {
      expect(screen.queryByTestId('notification-badge')).toBeNull();
    });
    const items = await screen.findAllByTestId('notification-item');
    for (const item of items) {
      expect(item.getAttribute('data-unread')).toBe('false');
    }
  });

  it('mỗi vai có hộp thư riêng — owner thấy seed owner với badge riêng', async () => {
    resetMockSession();
    await loginMockAndStore('owner@sango.vn');
    const user = userEvent.setup();
    renderBell();
    const badge = await screen.findByTestId('notification-badge');
    await waitFor(() => {
      expect(badge.textContent).toBe('2');
    });
    await user.click(await screen.findByTestId('notification-bell'));
    await waitFor(() => {
      expect(screen.getByText('Có đơn đặt mới')).toBeTruthy();
    });
  });

  it('empty state "Chưa có thông báo nào" với tài khoản mới chưa có thông báo', async () => {
    // Đăng ký tài khoản mới qua mock -> hộp thư trống thật sự (không phải pending).
    const session = await handleMockRequest<AuthResponse>('/auth/register', 'POST', {
      email: 'fresh@sango.vn',
      fullName: 'Người Dùng Mới',
      password: 'Sango@2026',
    });
    useAuthStore.getState().setSession(session.user, session.accessToken);

    const user = userEvent.setup();
    renderBell();
    await user.click(await screen.findByTestId('notification-bell'));
    // Chờ query settle (150ms latency) rồi mới assert — tránh dính trạng thái pending.
    await waitFor(() => {
      expect(screen.getByTestId('notifications-empty')).toBeTruthy();
      expect(screen.getByText('Chưa có thông báo nào')).toBeTruthy();
    });
  });

  it('poll tạm dừng khi tab ẩn và chạy lại khi tab hiển thị', async () => {
    vi.useFakeTimers();
    try {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      const utils = renderBell();

      // Lần tải đầu.
      await vi.advanceTimersByTimeAsync(300);
      const initialCalls = countListNotifications();
      expect(initialCalls).toBeGreaterThan(0);

      // Hai chu kỳ poll liên tiếp đều tăng số lần gọi GET /notifications.
      await vi.advanceTimersByTimeAsync(30_000 + 100);
      const afterVisible = countListNotifications();
      expect(afterVisible).toBeGreaterThan(initialCalls);

      // Tab ẩn: cùng khoảng thời gian, KHÔNG có lần gọi nào nữa.
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      const beforeHidden = countListNotifications();
      await vi.advanceTimersByTimeAsync(60_000 + 200);
      expect(countListNotifications()).toBe(beforeHidden);

      utils.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('lỗi tải hộp thư được xử lý im lặng thân thiện (không văng lỗi)', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const api = await import('../../../../src/features/notifications/api');
    const spy = vi
      .spyOn(api, 'fetchNotifications')
      .mockImplementation(() => Promise.reject(new Error('network down')));

    try {
      const user = userEvent.setup();
      renderBell();
      await user.click(await screen.findByTestId('notification-bell'));
      await waitFor(
        () => {
          expect(screen.getByTestId('notifications-error')).toBeTruthy();
          expect(screen.getByText(/không tải được thông báo/i)).toBeTruthy();
        },
        { timeout: 4000 },
      );
      // Không crash: bell vẫn còn trong DOM.
      expect(screen.getByTestId('notification-bell')).toBeTruthy();
    } finally {
      spy.mockRestore();
      consoleError.mockRestore();
    }
  });
});
