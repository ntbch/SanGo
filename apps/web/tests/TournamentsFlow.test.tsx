import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TournamentsPage, TournamentDetailPage } from '../src/features/tournaments/pages';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';

describe('Tournaments Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: {
        id: 'u-1',
        email: 'player1@sango.vn',
        fullName: 'Trần Đức Người Chơi',
        role: UserRole.CUSTOMER,
      },
      accessToken: 'test-token',
      status: 'authenticated',
    });
  });

  it('renders TournamentsPage with filters, create modal and listings', async () => {
    render(
      <MemoryRouter initialEntries={['/tournaments']}>
        <Routes>
          <Route path="/tournaments" element={<TournamentsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Giải Đấu & Cup Vô Địch/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Tất Cả Môn/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Bóng Đá/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Pickleball/i })).toBeDefined();

    // Open create tournament modal
    const createBtn = screen.getByRole('button', { name: /Tạo Giải Đấu/i });
    fireEvent.click(createBtn);
    expect(screen.getByText(/Tạo Giải Đấu Thể Thao Mới/i)).toBeDefined();
  });

  it('renders TournamentDetailPage with knockout bracket and tabs', async () => {
    render(
      <MemoryRouter initialEntries={['/tournaments/tour-1']}>
        <Routes>
          <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /SanGo Championship 2026/i })).toBeDefined();
    });

    // Check bracket tab
    expect(screen.getByRole('heading', { name: /Sơ Đồ Cây Loại Trực Tiếp/i })).toBeDefined();

    // Switch to Teams tab
    const teamsTabBtn = screen.getByRole('button', { name: /Danh Sách Đội Tham Gia/i });
    expect(teamsTabBtn).toBeDefined();
    fireEvent.click(teamsTabBtn);
    expect(screen.getByRole('heading', { name: /Danh Sách Câu Lạc Bộ Ghi Danh/i })).toBeDefined();

    // Switch to Matches tab
    const matchesTabBtn = screen.getByRole('button', { name: /Lịch Thi Đấu & Tỷ Số/i });
    expect(matchesTabBtn).toBeDefined();
    fireEvent.click(matchesTabBtn);
    expect(screen.getByRole('heading', { name: /Lịch Thi Đấu & Nhập/i })).toBeDefined();
  });
});
