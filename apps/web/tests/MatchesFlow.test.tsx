import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MatchesPage, MatchDetailPage } from '../src/features/matches/pages/matches-pages';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';

describe('Matches Flow Integration', () => {
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

  it('renders MatchesPage with filter bar and match listings', async () => {
    render(
      <MemoryRouter initialEntries={['/matches']}>
        <Routes>
          <Route path="/matches" element={<MatchesPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Tìm Kèo Giao Hữu & Tuyển Slot Lẻ/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Tất Cả Môn/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Pickleball/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Cầu Lông/i })).toBeDefined();
  });

  it('renders MatchDetailPage with line-up and join request form', async () => {
    render(
      <MemoryRouter initialEntries={['/matches/match-1']}>
        <Routes>
          <Route path="/matches/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Ghi Chú & Thể Thức Thi Đấu/i })).toBeDefined();
    });

    expect(screen.getByRole('heading', { name: /Đội Hình Đã Tham Gia/i })).toBeDefined();
    expect(screen.getByRole('heading', { name: /Đăng Ký Tham Gia Kèo/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Gửi Yêu Cầu Xin Slot/i })).toBeDefined();
    expect(screen.getByRole('heading', { name: /Giao Lưu & Bình Luận Trước Trận/i })).toBeDefined();
  });
});
