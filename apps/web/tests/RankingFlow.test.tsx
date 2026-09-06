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
      city: 'Hà Nội',
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
      city: 'Hà Nội',
      reputationScore: 1150,
      matchesPlayed: 22,
      mvpCount: 5,
      fairPlayBadge: 'GOLD',
    },
    {
      rank: 1,
      userId: 'u-3',
      fullName: 'Ngô Thuỳ Linh',
      avatarUrl: null,
      sportType: 'PICKLEBALL',
      city: 'Hà Nội',
      reputationScore: 1080,
      matchesPlayed: 15,
      mvpCount: 3,
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
    const { container } = render(
      <MemoryRouter initialEntries={['/ranking']}>
        <Routes>
          <Route path="/ranking" element={<RankingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Bảng Xếp Hạng Thể Thao SanGo/i })).toBeDefined();

    // Sport pills
    expect(screen.getByRole('button', { name: /Tất Cả Môn/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Bóng Đá/i })).toBeDefined();

    // Check Club ranking tab
    await waitFor(() => {
      expect(screen.getAllByText(/SanGo Warriors FC/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByRole('heading', { name: /Bảng Tổng Sắp Câu Lạc Bộ/i })).toBeDefined();

    // Verify athletic podium displays rank 1 with bold mono numbers and tabular-nums ELO score
    const rankBadges = screen.getAllByText('1');
    expect(rankBadges.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Hạng 1 Toàn Bảng/i)).toBeDefined();

    const eloElements = screen.getAllByText('1240');
    expect(eloElements.length).toBeGreaterThanOrEqual(1);
    // At least one elo display has font-mono-num and tabular-nums
    expect(eloElements.some((el) => el.className.includes('font-mono-num') && el.className.includes('tabular-nums'))).toBe(true);

    // Verify leaderboard table shows formatted rank #01 with tabular-nums
    const rankTableText = screen.getByText('#01');
    expect(rankTableText).toBeDefined();
    expect(rankTableText.className).toContain('tabular-nums');
    expect(rankTableText.className).toContain('font-mono-num');

    // Verify match stats and win rate with tabular-nums
    const matchStats = screen.getByText('12 - 3 - 3');
    expect(matchStats.className).toContain('tabular-nums');
    expect(matchStats.className).toContain('font-mono-num');

    const winRate = screen.getByText('66.7%');
    expect(winRate.className).toContain('tabular-nums');
    expect(winRate.className).toContain('font-mono-num');

    // Cliché check: no animate-pulse, no gradients, no backdrop-blur
    expect(container.querySelector('.animate-pulse')).toBeNull();
    expect(container.innerHTML).not.toContain('bg-gradient');
    expect(container.innerHTML).not.toContain('backdrop-blur');

    // Switch to Athletes ranking tab
    const athletesTabBtn = screen.getByRole('tab', { name: /Bảng Vàng Vận Động Viên/i });
    expect(athletesTabBtn).toBeDefined();
    fireEvent.click(athletesTabBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Bảng Vàng Vận Động Viên Phong Trào/i })).toBeDefined();
    });
    expect(screen.getAllByText(/Trần Đức Người Chơi/i).length).toBeGreaterThan(0);

    // Filter by Pickleball where there is 1 athlete
    const pickleballBtn = screen.getByRole('button', { name: /Pickleball/i });
    fireEvent.click(pickleballBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Ngô Thuỳ Linh/i).length).toBeGreaterThan(0);
    });

    // When 1 person in the list, their rank badge on podium is 1 and table rank is #01
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('#01')).toBeDefined();
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
