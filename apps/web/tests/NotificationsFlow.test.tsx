import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from '../src/components/layout/navbar';
import { NotificationsPage } from '../src/features/notifications/pages/notifications-page';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';

describe('Notifications Flow & Quick Read Popup Integration', () => {
  beforeEach(() => {
    localStorage.clear();
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

    // Click to open notification popup
    fireEvent.click(bellBtn);

    // Popup header & contents
    expect(screen.getByRole('heading', { name: /^Thông Báo$/i })).toBeDefined();
    expect(screen.getByText(/Đặt sân thành công/i)).toBeDefined();
    expect(screen.getByText(/Có đội nhận kèo giao lưu!/i)).toBeDefined();

    // Filter by category in dropdown
    const bookingTab = screen.getAllByRole('button', { name: /Đặt sân/i })[0];
    fireEvent.click(bookingTab);
    expect(screen.getByText(/Đặt sân thành công/i)).toBeDefined();

    // Mark all as read
    const markAllBtn = screen.queryByRole('button', { name: /Đã đọc tất cả/i });
    if (markAllBtn) {
      fireEvent.click(markAllBtn);
    }
  });

  it('renders full NotificationsPage with KPI stats, category filters, and search bar', async () => {
    render(
      <MemoryRouter initialEntries={['/notifications']}>
        <Routes>
          <Route path="/notifications" element={<NotificationsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Hộp Thư Thông Báo/i })).toBeDefined();
    expect(screen.getByText(/Lịch Đặt & Vé Sân/i)).toBeDefined();
    expect(screen.getByText(/Kèo Đấu & Giải/i)).toBeDefined();

    // Search bar
    const searchInput = screen.getByPlaceholderText(/Tìm nội dung thông báo.../i) as HTMLInputElement;
    expect(searchInput).toBeDefined();
    fireEvent.change(searchInput, { target: { value: 'VietQR' } });
    expect(searchInput.value).toBe('VietQR');
    expect(screen.getByText(/Biến động số dư: \+500\.000 đ/i)).toBeDefined();

    // Filter pills
    const allTab = screen.getByRole('button', { name: /^Tất Cả$/i });
    fireEvent.click(allTab);
  });
});
