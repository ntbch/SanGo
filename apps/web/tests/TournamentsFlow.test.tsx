import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TournamentsPage, TournamentDetailPage } from '../src/features/tournaments/pages';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';
import { getTournamentDetailApi, registerTournamentTeamApi } from '../src/features/tournaments/api/tournaments-api';
import { listMyTeamsApi } from '../src/features/teams/api/teams-api';

vi.mock('../src/features/tournaments/api/tournaments-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/features/tournaments/api/tournaments-api')>();
  const mockTournament = {
    id: 'tour-1',
    name: 'SanGo Championship 2026',
    sportType: 'FOOTBALL5',
    status: 'ONGOING' as const,
    maxTeams: 8,
    description: 'Thể thức loại trực tiếp.',
    createdBy: 'u-1',
    championTeamId: null,
    champion: null,
    _count: { teams: 1 },
    teams: [
      {
        id: 'te-1',
        tournamentId: 'tour-1',
        teamId: 'team-1',
        seed: 1,
        joinedAt: new Date().toISOString(),
        team: {
          id: 'team-1',
          name: 'SanGo Warriors FC',
          logoUrl: null,
        },
      },
    ],
    matches: [
      {
        id: 'tm-1',
        tournamentId: 'tour-1',
        round: 1,
        position: 1,
        homeTeamId: 'team-1',
        awayTeamId: 'team-2',
        homeScore: 2,
        awayScore: 1,
        winnerTeamId: 'team-1',
        nextMatchId: null,
        status: 'DONE' as const,
        homeTeam: { id: 'team-1', name: 'SanGo Warriors FC', logoUrl: null },
        awayTeam: { id: 'team-2', name: 'CLB Cầu Giấy', logoUrl: null },
      },
    ],
  };
  return {
    ...actual,
    getTournamentDetailApi: vi.fn().mockResolvedValue(mockTournament),
    registerTournamentTeamApi: vi.fn().mockResolvedValue({}),
    listTournamentsApi: vi.fn().mockResolvedValue([{ ...mockTournament, teams: undefined, matches: undefined }]),
  };
});

vi.mock('../src/features/teams/api/teams-api', () => ({ listMyTeamsApi: vi.fn().mockResolvedValue([]) }));

describe('Tournaments Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    await waitFor(() => {
      expect(screen.getByText(/SanGo Championship 2026/i)).toBeDefined();
    });

    expect(screen.getByText(/1 \/ 8 Đội/i)).toBeDefined();

    // Test empty state when filter matches no tournaments
    const pickleballBtn = screen.getByRole('button', { name: /Pickleball/i });
    fireEvent.click(pickleballBtn);

    expect(screen.getByText(/Không tìm thấy giải đấu nào/i)).toBeDefined();

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
    // Bracket must render the actual match card, not just the card header
    const homeRow = screen.getByText('SanGo Warriors FC').parentElement as HTMLElement;
    const awayRow = screen.getByText('CLB Cầu Giấy').parentElement as HTMLElement;
    expect(within(homeRow).getByText('2')).toBeDefined();
    expect(within(awayRow).getByText('1')).toBeDefined();
    expect(screen.getByText('Trận #1')).toBeDefined();
    expect(screen.queryByText(/Chưa sinh nhánh đấu/i)).toBeNull();

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

  it('reloads eligible captain teams after login, registers the team and refetches the roster', async () => {
    vi.mocked(getTournamentDetailApi).mockResolvedValueOnce({
      id: 'tour-1', name: 'Registration Cup', sportType: 'FOOTBALL5', status: 'REGISTRATION',
      maxTeams: 8, createdBy: 'host', teams: [], matches: [],
    });
    // Mọi lần refetch sau khi đăng ký trả về giải đã có đội vừa ghi danh.
    vi.mocked(getTournamentDetailApi).mockResolvedValue({
      id: 'tour-1', name: 'Registration Cup', sportType: 'FOOTBALL5', status: 'REGISTRATION',
      maxTeams: 8, createdBy: 'host', _count: { teams: 1 }, matches: [],
      teams: [
        {
          id: 'tt-1', tournamentId: 'tour-1', teamId: 'team-1', seed: 1, joinedAt: '2026-09-27',
          team: { id: 'team-1', name: 'Đội Sân 5', logoUrl: null },
        },
      ],
    });
    vi.mocked(listMyTeamsApi).mockResolvedValueOnce([
      { membershipId: 'm-1', role: 'CAPTAIN', status: 'ACTIVE', joinedAt: '2026-09-01',
        team: { id: 'team-1', name: 'Đội Sân 5', captainId: 'u-1', sportType: 'FOOTBALL5', createdAt: '2026-09-01' } },
      { membershipId: 'm-2', role: 'CAPTAIN', status: 'ACTIVE', joinedAt: '2026-09-01',
        team: { id: 'team-2', name: 'Đội Tennis', captainId: 'u-1', sportType: 'TENNIS', createdAt: '2026-09-01' } },
    ]);
    useAuthStore.setState({ user: null, accessToken: null });
    render(<MemoryRouter initialEntries={['/tournaments/tour-1']}><Routes>
      <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
    </Routes></MemoryRouter>);
    await screen.findByRole('heading', { name: 'Registration Cup' });
    act(() => useAuthStore.setState({ user: { id: 'u-1', email: 'player1@sango.vn', fullName: 'Captain', role: UserRole.CUSTOMER }, accessToken: 'token' }));
    fireEvent.click(screen.getByRole('button', { name: /Đăng Ký Đội Vào Giải/i }));
    await screen.findByRole('option', { name: /Đội Sân 5/ });
    expect(screen.queryByRole('option', { name: /Đội Tennis/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận đăng ký đội/i }));
    await waitFor(() => expect(registerTournamentTeamApi).toHaveBeenCalledWith('tour-1', { teamId: 'team-1' }));
    await screen.findByText(/Đã đăng ký CLB "Đội Sân 5" thành công/i);
    // Refetch phải thực sự chạy lại và mang về danh sách đội mới.
    await waitFor(() => expect(getTournamentDetailApi).toHaveBeenCalledTimes(2));
    // Đội vừa đăng ký không còn được chào mời trong modal.
    expect(screen.queryByRole('option', { name: /Đội Sân 5/ })).toBeNull();
    expect(screen.getByText('Chọn đóng để quay lại giải đấu.')).toBeDefined();
    // Trang tự chuyển sang tab danh sách đội với dữ liệu vừa refetch.
    expect(await screen.findByRole('heading', { name: /Danh Sách Câu Lạc Bộ Ghi Danh/i })).toBeDefined();
    expect(screen.getByText('Đội Sân 5')).toBeDefined();
    expect(screen.getByText('Danh Sách Đội Ghi Danh (1)')).toBeDefined();
  });
});
