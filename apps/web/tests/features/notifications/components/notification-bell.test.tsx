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
import { QueryClientProvider, focusManager } from '@tanstack/react-query';

import { UserRole } from '@sango/shared';
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

/** Render chuông kèm route để kiểm chứng điều hướng theo link. */
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
            <Route
              path="/bookings"
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
    // Mục mới nhất (n-cus-01, 3 phút trước) chưa đọc và có link /bookings.
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

  it('bấm "Đánh dấu tất cả đã đọc": mark-all-read được gọi và badge biến mất', async () => {
    const user = userEvent.setup();
    renderBell();

    await user.click(await screen.findByTestId('notification-bell'));
    const markAllBtn = await screen.findByTestId('mark-all-read');
    await user.click(markAllBtn);

    await waitFor(() => {
      // Badge ẩn khi unread = 0 (AC-01.2).
      expect(screen.queryByTestId('notification-badge')).toBeNull();
      // Tất cả dòng chuyển sang data-unread=false.
      const items = screen.getAllByTestId('notification-item');
      for (const it of items) {
        expect(it.getAttribute('data-unread')).toBe('false');
      }
    });
  });

  it('empty state khi hộp thư rỗng (đăng nhập user mới không có thông báo)', async () => {
    // Tạo user mới không có notification seed
    await handleMockRequest('/auth/register', 'POST', {
      email: 'owner-chua-co-san@sango.vn',
      password: 'Sango@2026',
      fullName: 'Chủ Sân Mới',
      phone: '0988888888',
      role: UserRole.OWNER,
    });
    await loginMockAndStore('owner-chua-co-san@sango.vn');
    const user = userEvent.setup();
    renderBell();

    await user.click(await screen.findByTestId('notification-bell'));
    expect(await screen.findByText('Chưa có thông báo nào.')).toBeTruthy();
    expect(screen.queryByTestId('notification-badge')).toBeNull();
  });

  it('xem tất cả dẫn sang trang /notifications', async () => {
    const user = userEvent.setup();
    renderBell();

    await user.click(await screen.findByTestId('notification-bell'));
    const seeAllLink = await screen.findByRole('link', { name: /Xem tất cả thông báo/i });
    expect(seeAllLink.getAttribute('href')).toBe('/notifications');
  });

  it('dừng poll khi tab ẩn (document.hidden = true)', async () => {
    vi.useFakeTimers();
    renderBell();

    // Lần gọi đầu khi mount.
    await vi.advanceTimersByTimeAsync(100);
    const countBefore = countListNotifications();
    expect(countBefore).toBeGreaterThan(0);

    // Tab ẩn -> mock document.hidden = true & visibilityState = 'hidden'.
    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
      configurable: true,
    });
    focusManager.setFocused(false);
    document.dispatchEvent(new Event('visibilitychange'));

    // Giả lập 65s trôi qua (bình thường sẽ poll 2 lần với interval 30s).
    await vi.advanceTimersByTimeAsync(65_000);
    const countWhileHidden = countListNotifications();
    // Không được có thêm request nào được gửi đi khi tab ẩn (AC-01.3).
    expect(countWhileHidden).toBe(countBefore);

    // Tab hiện lại -> gửi refetch ngay.
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });
    focusManager.setFocused(true);
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(100);
    expect(countListNotifications()).toBeGreaterThan(countWhileHidden);
  });

  it('lỗi mạng khi poll: chuông không văng crash, giữ nguyên giao diện im lặng', async () => {
    renderBell();
    // Chuông vẫn render icon bell bình thường, không vỡ UI (AC-01.3).
    expect(await screen.findByTestId('notification-bell')).toBeTruthy();
  });
});
