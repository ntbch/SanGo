import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TeamsPage, TeamDetailPage } from '../src/features/teams/pages/teams-pages';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';

describe('Teams Flow Integration', () => {
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

  it('renders TeamsPage with sport filter bar, search input, and team cards', async () => {
    render(
      <MemoryRouter initialEntries={['/teams']}>
        <Routes>
          <Route path="/teams" element={<TeamsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Đội Nhóm Của Bạn/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Tạo Đội Mới/i })).toBeDefined();

    // Sport filter pills
    expect(screen.getByRole('button', { name: /Tất Cả Môn/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Bóng Đá/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Pickleball/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Cầu Lông/i })).toBeDefined();

    // Search input
    const searchInput = screen.getByPlaceholderText(/Tìm tên đội.../i) as HTMLInputElement;
    expect(searchInput).toBeDefined();
    fireEvent.change(searchInput, { target: { value: 'Warriors' } });
    expect(searchInput.value).toBe('Warriors');

    // Open Create Team Modal
    const createBtn = screen.getByRole('button', { name: /Tạo Đội Mới/i });
    fireEvent.click(createBtn);
    expect(screen.getByText(/Tạo Đội Thể Thao Mới/i)).toBeDefined();
  });

  it('renders TeamDetailPage with 3 main tabs and interactions', async () => {
    render(
      <MemoryRouter initialEntries={['/teams/team-fc-sango']}>
        <Routes>
          <Route path="/teams/:id" element={<TeamDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Wait for team details to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /SanGo Warriors FC/i })).toBeDefined();
    });

    const splitTabBtn = screen.getByRole('button', { name: /Chia Tiền Sân Tự Động/i });
    expect(splitTabBtn).toBeDefined();
    fireEvent.click(splitTabBtn);

    expect(screen.getByRole('heading', { name: /Tạo Khoản Chia Tiền Sân/i })).toBeDefined();

    // Switch to Treasury tab
    const treasuryTabBtn = screen.getByRole('button', { name: /Quỹ Đội Minh Bạch/i });
    expect(treasuryTabBtn).toBeDefined();
    fireEvent.click(treasuryTabBtn);

    expect(screen.getByText(/Số Dư Quỹ Đội Hiện Tại/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Xác Nhận Đóng Quỹ/i })).toBeDefined();
  });
});
