import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RankingPage } from '../src/features/ranking/pages';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';

vi.mock('../src/features/ranking/api/ranking-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/features/ranking/api/ranking-api')>();
  const clubRankings = [
    {
      rank: 1,
      teamId: 'team-1',
      teamName: 'SanGo Warriors FC',
      sportType: 'FOOTBALL5',
      eloScore: 1240,
      matchesPlayed: 18,
      wins: 12,
      draws: 3,
      losses: 3,
      winRate: 66.7,
      titlesCount: 2,
    },
  ];
  const athleteRankings = [
    {
      rank: 1,
      userId: 'u-1',
      fullName: 'Trần Đức Người Chơi',
      avatarUrl: null,
      sportType: 'FOOTBALL5',
      reputationScore: 90,
      matchesPlayed: 22,
      fairPlayBadge: 'GOLD',
    },
    {
      rank: 1,
      userId: 'u-3',
      fullName: 'Ngô Thuỳ Linh',
      avatarUrl: null,
      sportType: 'PICKLEBALL',
      reputationScore: 80,
      matchesPlayed: 15,
      fairPlayBadge: 'SILVER',
    },
  ];
  return {
    ...actual,
    getClubRankingsApi: vi.fn().mockImplementation((params?: { sportType?: string }) =>
      Promise.resolve(
        params?.sportType && params.sportType !== 'ALL'
          ? clubRankings.filter((c) => c.sportType === params.sportType)
          : clubRankings,
      ),
    ),
    getAthleteRankingsApi: vi.fn().mockImplementation((params?: { sportType?: string }) =>
      Promise.resolve(
        params?.sportType && params.sportType !== 'ALL'
          ? athleteRankings.filter((a) => a.sportType === params.sportType)
          : athleteRankings,
      ),
    ),
  };
});

describe('Ranking Flow Integration', () => {
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

  it('renders RankingPage with Podium and switches between Clubs and Athletes', async () => {
    render(
      <MemoryRouter initialEntries={['/ranking']}>
        <Routes>
          <Route path="/ranking" element={<RankingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Bảng Xếp Hạng Thể Thao SanGo/i })).toBeDefined();

    // Sport pills
    expect(screen.getByRole('button', { name: /Tất Cả Môn/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Bóng Đá Sân 5/i })).toBeDefined();

    // Check Club ranking tab
    await waitFor(() => {
      expect(screen.getAllByText(/SanGo Warriors FC/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByRole('heading', { name: /Bảng Tổng Sắp Câu Lạc Bộ/i })).toBeDefined();


    // Switch to Athletes ranking tab
    const athletesTabBtn = screen.getByRole('tab', { name: /Bảng Vàng Vận Động Viên/i });
    expect(athletesTabBtn).toBeDefined();
    fireEvent.click(athletesTabBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Bảng Vàng Vận Động Viên Phong Trào/i })).toBeDefined();
    });
    expect(screen.getAllByText(/Trần Đức Người Chơi/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Bóng Đá Sân 5/i }));
    await waitFor(() => {
      expect(screen.getAllByText(/Trần Đức Người Chơi/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/Ngô Thuỳ Linh/i)).toBeNull();
    });

    // Filter by Pickleball where there is 1 athlete
    const pickleballBtn = screen.getByRole('button', { name: /Pickleball/i });
    fireEvent.click(pickleballBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Ngô Thuỳ Linh/i).length).toBeGreaterThan(0);
    });

  });

  it('renders EmptyState when filter yields no results and allows resetting filters', async () => {
    render(
      <MemoryRouter initialEntries={['/ranking']}>
        <Routes>
          <Route path="/ranking" element={<RankingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/SanGo Warriors FC/i).length).toBeGreaterThan(0);
    });

    // Filter by Tennis where there are no clubs
    const tennisBtn = screen.getByRole('button', { name: /Tennis/i });
    fireEvent.click(tennisBtn);

    // Wait for EmptyState
    await waitFor(() => {
      expect(screen.getByText('Chưa có dữ liệu bảng xếp hạng')).toBeDefined();
    });

    const resetBtn = screen.getByRole('button', { name: /Đặt lại bộ lọc/i });
    expect(resetBtn).toBeDefined();

    // Click reset filters
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/SanGo Warriors FC/i).length).toBeGreaterThan(0);
    });
  });
});
