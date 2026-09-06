import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TournamentsPage, TournamentDetailPage } from '../src/features/tournaments/pages';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';

vi.mock('../src/features/tournaments/api/tournaments-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/features/tournaments/api/tournaments-api')>();
  const mockTournament = {
    id: 'tour-1',
    name: 'SanGo Championship 2026',
    sportType: 'FOOTBALL5',
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    status: 'ONGOING' as const,
    maxTeams: 16,
    bannerUrl: null,
    prizePool: 50000000,
    registrationDeadline: '2026-09-20',
    startDate: '2026-09-25',
    endDate: '2026-09-27',
    rules: 'Thể thức loại trực tiếp, 2 hiệp 15 phút.',
    entryFee: 500000,
    createdBy: 'u-1',
    championTeamId: null,
    championTeam: null,
    teams: [
      {
        id: 'te-1',
        tournamentId: 'tour-1',
        teamId: 'team-1',
        seed: 1,
        registeredAt: new Date().toISOString(),
        contactPhone: '0912345678',
        captainName: 'Nguyễn Văn Nam',
        team: {
          id: 'team-1',
          name: 'SanGo Warriors FC',
          logoUrl: null,
          captain: { id: 'u-2', fullName: 'Nguyễn Văn Nam', phoneNumber: '0912345678' },
        },
      },
    ],
    matches: [
      {
        id: 'tm-1',
        tournamentId: 'tour-1',
        round: 1,
        position: 1,
        matchTime: '2026-09-25T18:00:00.000Z',
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        homeScore: 2,
        awayScore: 1,
        winnerTeamId: 'team-1',
        nextMatchId: null,
        status: 'FINISHED' as const,
        homeTeam: { id: 'team-1', name: 'SanGo Warriors FC', logoUrl: null, captainName: 'Nguyễn Văn Nam' },
        awayTeam: { id: 'team-2', name: 'CLB Cầu Giấy', logoUrl: null, captainName: 'Lê Văn Bình' },
      },
    ],
  };
  return {
    ...actual,
    getTournamentDetailApi: vi.fn().mockResolvedValue(mockTournament),
    listTournamentsApi: vi.fn().mockResolvedValue([mockTournament]),
  };
});

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

    // Verify tournament card renders with tabular monospace prize and team count
    await waitFor(() => {
      expect(screen.getByText(/SanGo Championship 2026/i)).toBeDefined();
    });

    const prizeElement = screen.getByText(/50.000.000/i);
    expect(prizeElement.className).toContain('font-mono-num');
    expect(prizeElement.className).toContain('font-black');
    expect(prizeElement.className).toContain('tabular-nums');

    const teamCountElement = screen.getByText(/1 \/ 16 Đội/i);
    expect(teamCountElement.className).toContain('font-mono-num');
    expect(teamCountElement.className).toContain('font-black');
    expect(teamCountElement.className).toContain('tabular-nums');

    // Verify flat status badge tokens
    const statusBadges = screen.getAllByText(/Đang diễn ra/i);
    const statusBadge = statusBadges.find((el) => el.tagName.toLowerCase() === 'span');
    expect(statusBadge).toBeDefined();
    expect(statusBadge?.className).toContain('bg-secondary');
    expect(statusBadge?.className).toContain('text-secondary-foreground');
    expect(statusBadge?.className).toContain('border-border');

    // Test empty state when filter matches no tournaments
    const pickleballBtn = screen.getByRole('button', { name: /Pickleball/i });
    fireEvent.click(pickleballBtn);

    expect(screen.getByText(/Không tìm thấy giải đấu nào/i)).toBeDefined();
    expect(
      screen.getByText(/Thử thay đổi bộ môn thể thao hoặc địa điểm để khám phá các giải đấu khác./i),
    ).toBeDefined();

    const resetFilterBtn = screen.getByRole('button', { name: /Đặt lại bộ lọc/i });
    fireEvent.click(resetFilterBtn);
    expect(screen.getByText(/SanGo Championship 2026/i)).toBeDefined();

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

    // Check tabular scores in flat lineage bracket tree
    const homeScoreEl = screen.getByText('2');
    expect(homeScoreEl.className).toContain('font-mono-num');
    expect(homeScoreEl.className).toContain('font-extrabold');
    expect(homeScoreEl.className).toContain('tabular-nums');

    const awayScoreEl = screen.getByText('1');
    expect(awayScoreEl.className).toContain('font-mono-num');
    expect(awayScoreEl.className).toContain('font-extrabold');
    expect(awayScoreEl.className).toContain('tabular-nums');

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
