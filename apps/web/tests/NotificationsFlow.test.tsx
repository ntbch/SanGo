import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from '../src/components/layout/navbar';
import { NotificationsPage } from '../src/features/notifications/pages/notifications-page';
import { useAuthStore } from '../src/lib/auth-store';
import { useNotificationsStore } from '../src/features/notifications/store/notifications-store';
import { UserRole } from '../src/lib/constants';

const seedNotifications: {
  id: string;
  type: 'BOOKING' | 'MATCH' | 'TOURNAMENT' | 'WALLET' | 'SYSTEM';
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}[] = [
  {
    id: 'n-1',
    type: 'BOOKING',
    title: 'Đặt sân thành công',
    message: 'Bạn đã đặt sân Bóng Đá 5A lúc 20:00-21:30. Vé QR đã sẵn sàng trong mục Vé của tôi.',
    link: '/my-bookings',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'n-2',
    type: 'MATCH',
    title: 'Có đội nhận kèo giao lưu!',
    message: 'Đội Pickleball Vàng vừa gửi yêu cầu tham gia kèo giao lưu cuối tuần.',
    link: '/matches',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'n-3',
    type: 'WALLET',
    title: 'Biến động số dư: +500.000 đ',
    message: 'Nạp tiền qua VietQR thành công, số dư ví đã được cập nhật.',
    link: '/wallet',
    isRead: true,
    createdAt: new Date().toISOString(),
  },
];

vi.mock('../src/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/api-client')>();
  return {
    ...actual,
    apiClient: vi.fn((endpoint: string) => {
      if (String(endpoint).startsWith('/notifications')) {
        return Promise.resolve({
          items: seedNotifications.map((n) => ({
            id: n.id,
            type: n.type === 'BOOKING' ? 'BOOKING_CONFIRMED' : n.type === 'MATCH' ? 'MATCH_JOINED' : 'PAYMENT_RECEIVED',
            title: n.title,
            body: n.message,
            link: n.link,
            readAt: n.isRead ? new Date().toISOString() : null,
            createdAt: n.createdAt,
          })),
          page: 1,
          pageSize: 20,
          total: seedNotifications.length,
          unreadCount: seedNotifications.filter((n) => !n.isRead).length,
        });
      }
      return Promise.resolve({});
    }),
  };
});

vi.mock('../src/lib/socket', () => ({
  bindRealtimeToAuth: vi.fn(),
}));

describe('Notifications Flow & Quick Read Popup Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    // Inbox session is normally established by the socket/auth binding.
    useNotificationsStore.setState({
      notifications: seedNotifications,
      loaded: true,
      sessionUserId: 'u-1',
      total: seedNotifications.length,
      unreadTotal: seedNotifications.filter((n) => !n.isRead).length,
      page: 1,
      loading: false,
      error: null,
      filterType: 'ALL',
      filterUnreadOnly: false,
    });
    useAuthStore.setState({
      user: {
        id: 'u-1',
        email: 'athlete@sango.vn',
        fullName: 'Trần Đức Test',
        role: UserRole.CUSTOMER,
      },
      accessToken: 'test-token',
      status: 'authenticated',
    });
  });

  it('renders Navbar bell trigger with unread badge and opens quick read dropdown popup', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar />
      </MemoryRouter>,
    );

    // Bell trigger
    const bellBtn = screen.getAllByRole('button', { name: /Mở danh sách thông báo/i })[0];
    expect(bellBtn).toBeDefined();

    // Open popup: seeded store renders immediately
    fireEvent.click(bellBtn);
    await waitFor(() => {
      expect(screen.getByText(/Đặt sân thành công/i)).toBeDefined();
    });
    expect(screen.getByText(/Có đội nhận kèo giao lưu!/i)).toBeDefined();

    // Filter by category in dropdown
    const bookingTab = screen.getAllByRole('button', { name: /Đặt sân/i })[0];
    fireEvent.click(bookingTab);
    expect(screen.getByText(/Đặt sân thành công/i)).toBeDefined();
  });

  it('renders full NotificationsPage with KPI stats, category filters, and search bar', async () => {
    render(
      <MemoryRouter initialEntries={['/notifications']}>
        <Routes>
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Biến động số dư: \+500\.000 đ/i)).toBeDefined();
    });

    expect(screen.getByRole('heading', { name: /Hộp Thư Thông Báo/i })).toBeDefined();

    // Search bar
    const searchInput = screen.getByPlaceholderText(/Tìm nội dung thông báo/i) as HTMLInputElement;
    expect(searchInput).toBeDefined();
    fireEvent.change(searchInput, { target: { value: 'VietQR' } });
    expect(searchInput.value).toBe('VietQR');

    // Filter pills
    const allTab = screen.getAllByRole('button', { name: /^Tất Cả$/i })[0];
    fireEvent.click(allTab);
  });
});
