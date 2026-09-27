import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TeamsPage, TeamDetailPage } from '../src/features/teams/pages';
import { TeamCard } from '../src/features/teams/components/team-card';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';
import * as teamsApi from '../src/features/teams/api/teams-api';
import { ApiError } from '../src/lib/api-client';

const { mockTeam } = vi.hoisted(() => ({
  mockTeam: {
    id: 'team-fc-sango',
    name: 'SanGo Warriors FC',
    sportType: 'FOOTBALL5',
    logoUrl: null,
    description: 'Đội bóng giao lưu sân 5 tại Cầu Giấy.',
    captainId: 'u-1',
    createdAt: new Date().toISOString(),
    memberCount: 2,
    captain: {
      id: 'u-1',
      fullName: 'Trần Đức Người Chơi',
      email: 'player1@sango.vn',
      phone: '0912345678',
      avatarUrl: null,
    },
    members: [
      {
        id: 'mem-1',
        teamId: 'team-fc-sango',
        userId: 'u-1',
        role: 'CAPTAIN' as const,
        status: 'ACTIVE' as const,
        joinedAt: new Date().toISOString(),
        user: { id: 'u-1', fullName: 'Trần Đức Người Chơi', avatarUrl: null, phone: '0912345678', email: 'player1@sango.vn' },
      },
      {
        id: 'mem-2',
        teamId: 'team-fc-sango',
        userId: 'u-2',
        role: 'MEMBER' as const,
        status: 'ACTIVE' as const,
        joinedAt: new Date().toISOString(),
        user: { id: 'u-2', fullName: 'Nguyễn Văn Nam', avatarUrl: null, phone: '0908765432', email: 'nam@sango.vn' },
      },
    ],
  },
}));

vi.mock('../src/features/teams/api/teams-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/features/teams/api/teams-api')>();
  return {
    ...actual,
    listMyTeamsApi: vi.fn().mockResolvedValue([]),
    getTeamApi: vi.fn().mockResolvedValue(mockTeam),
    respondInviteApi: vi.fn().mockResolvedValue(undefined),
    contributeTreasuryApi: vi.fn().mockResolvedValue({ success: true }),
    createTeamApi: vi.fn().mockRejectedValue(new Error('Unavailable')),
    getTeamExpensesApi: vi.fn().mockResolvedValue([
      {
        id: 'exp-1',
        teamId: 'team-fc-sango',
        bookingId: 'bk-1',
        payerId: 'u-1',
        debtorId: 'u-2',
        amount: 150000,
        note: 'Tiền sân Cầu Giấy',
        status: 'UNPAID',
        createdAt: '2026-09-02T18:00:00.000Z',
        payer: { id: 'u-1', fullName: 'Trần Đức Người Chơi', avatarUrl: null },
        debtor: { id: 'u-2', fullName: 'Nguyễn Văn Nam', avatarUrl: null },
        booking: { id: 'bk-1', code: 'SG-20260902-001', date: '2026-09-02' },
      },
    ]),
    getTreasuryOverviewApi: vi.fn().mockResolvedValue({
      teamId: 'team-fc-sango',
      balance: 1500000,
      monthIncome: 2000000,
      monthExpense: 500000,
      recentTransactions: [
        {
          id: 'tx-1',
          type: 'INCOME',
          amount: 500000,
          description: 'Đóng quỹ tháng 9',
          createdAt: '2026-09-01T10:00:00.000Z',
          createdByName: 'Trần Đức Người Chơi',
        },
        {
          id: 'tx-2',
          type: 'EXPENSE',
          amount: 200000,
          description: 'Nước uống trận giao hữu',
          createdAt: '2026-09-02T16:30:00.000Z',
          createdByName: 'Nguyễn Văn Nam',
        },
      ],
    }),
  };
});

vi.mock('../src/features/wallet/api/wallet-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/features/wallet/api/wallet-api')>();
  return {
    ...actual,
    getMyWalletApi: vi.fn().mockResolvedValue({
      balance: 2500000,
      page: 1,
      pageSize: 10,
      total: 0,
      items: [],
    }),
  };
});

describe('Teams Flow Integration', () => {
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

  it('renders TeamsPage with sport filter bar, search input, and EmptyState 3-line formula', async () => {
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
    const searchInput = screen.getByPlaceholderText(/Tìm tên đội/i) as HTMLInputElement;
    expect(searchInput).toBeDefined();
    fireEvent.change(searchInput, { target: { value: 'Warriors' } });
    expect(searchInput.value).toBe('Warriors');

    // EmptyState with 3-line formula
    await waitFor(() => {
      expect(screen.getByText('Chưa tham gia đội thể thao nào')).toBeDefined();
      expect(
        screen.getByText('Tạo đội mới để cùng quản lý quỹ, đặt lịch và chia tiền trận đấu.'),
      ).toBeDefined();
      expect(screen.getByRole('button', { name: 'Tạo Đội Đầu Tiên' })).toBeDefined();
    });

    // Open Create Team Modal via EmptyState button
    const firstTeamBtn = screen.getByRole('button', { name: 'Tạo Đội Đầu Tiên' });
    fireEvent.click(firstTeamBtn);
    expect(screen.getByText(/Tạo Đội Thể Thao Mới/i)).toBeDefined();
  });

  it('renders TeamCard member count and captain identity', () => {
    const mockMembership = {
      membershipId: 'mem-1',
      role: 'CAPTAIN' as const,
      status: 'ACTIVE' as const,
      joinedAt: new Date().toISOString(),
      team: mockTeam,
    };

    render(
      <MemoryRouter>
        <TeamCard membership={mockMembership} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Phòng điều hành đội/i)).toBeDefined();

    // Member count & captain name
    expect(screen.getByText(/2 Cầu thủ/i)).toBeDefined();
    expect(screen.getByText(/Trần Đức Người Chơi/i)).toBeDefined();

  });

  it('renders TeamDetailPage with General Ledger Table and Split Bill reconciliation', async () => {
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

    // 1. Switch to Treasury tab -> Test Financial General Ledger Table
    const treasuryTabBtn = screen.getByRole('button', { name: /Quỹ Đội Minh Bạch/i });
    expect(treasuryTabBtn).toBeDefined();
    fireEvent.click(treasuryTabBtn);

    // Big balance in primary font-mono-num
    expect(screen.getByText(/Số Dư Quỹ Đội Hiện Tại/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Xác Nhận Đóng Quỹ/i })).toBeDefined();

    // Sổ Cái Thu Chi Quỹ Đội header and columns
    expect(screen.getByRole('heading', { name: /Sổ Cái Thu Chi Quỹ Đội/i })).toBeDefined();
    expect(screen.getByText('Thời gian')).toBeDefined();
    expect(screen.getByText('Khoản mục diễn giải')).toBeDefined();
    expect(screen.getByText('Người thực hiện')).toBeDefined();
    expect(screen.getByText('Số tiền')).toBeDefined();
    expect(screen.getByText('Số dư')).toBeDefined();

    // Transaction rows in General Ledger Table
    expect(screen.getByText('Đóng quỹ tháng 9')).toBeDefined();
    expect(screen.getByText('Nước uống trận giao hữu')).toBeDefined();


    // 2. Switch to Split tab -> Test Split bill reconciliation
    const splitTabBtn = screen.getByRole('button', { name: /Chia Tiền Sân Tự Động/i });
    expect(splitTabBtn).toBeDefined();
    fireEvent.click(splitTabBtn);

    expect(screen.getByRole('heading', { name: /Tạo Khoản Chia Tiền Sân/i })).toBeDefined();
    expect(screen.getByRole('heading', { name: /Nhật Ký Các Khoản Chia Tiền/i })).toBeDefined();
    expect(screen.getByText(/Nguyễn Văn Nam nợ Trần Đức Người Chơi/i)).toBeDefined();
    expect(screen.getByText(/Chưa Trả/i)).toBeDefined();
  });

  it('loads financial data only after accepting the pending invitation', async () => {
    useAuthStore.setState({ user: { ...useAuthStore.getState().user!, id: 'u-2' } });
    vi.mocked(teamsApi.getTeamApi).mockResolvedValueOnce({
      ...mockTeam,
      members: mockTeam.members.map((m) => m.userId === 'u-2' ? { ...m, status: 'PENDING' as const } : m),
    });
    render(<MemoryRouter initialEntries={['/teams/team-fc-sango']}><Routes><Route path="/teams/:id" element={<TeamDetailPage />} /></Routes></MemoryRouter>);
    const accept = await screen.findByRole('button', { name: 'Chấp nhận' });
    expect(teamsApi.getTeamExpensesApi).not.toHaveBeenCalled();
    expect(teamsApi.getTreasuryOverviewApi).not.toHaveBeenCalled();
    fireEvent.click(accept);
    await screen.findByRole('heading', { name: /SanGo Warriors FC/i });
    expect(teamsApi.respondInviteApi).toHaveBeenCalledWith('team-fc-sango', true);
    expect(teamsApi.getTreasuryOverviewApi).toHaveBeenCalledTimes(1);
  });

  it('shows a recoverable error when team loading fails', async () => {
    vi.mocked(teamsApi.getTeamApi).mockRejectedValueOnce(new Error('Offline'));
    render(<MemoryRouter initialEntries={['/teams/team-fc-sango']}><Routes><Route path="/teams/:id" element={<TeamDetailPage />} /></Routes></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));
    await screen.findByRole('heading', { name: /SanGo Warriors FC/i });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('excludes pending invitations from split participants', async () => {
    vi.mocked(teamsApi.getTeamApi).mockResolvedValueOnce({
      ...mockTeam,
      members: mockTeam.members.map((m) => m.userId === 'u-2' ? { ...m, status: 'PENDING' as const } : m),
    });
    render(<MemoryRouter initialEntries={['/teams/team-fc-sango']}><Routes><Route path="/teams/:id" element={<TeamDetailPage />} /></Routes></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: /Chia Tiền Sân Tự Động/i }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    expect((screen.getByRole('checkbox', { name: 'Trần Đức Người Chơi' }) as HTMLInputElement).checked).toBe(true);
    expect(screen.queryByRole('checkbox', { name: 'Nguyễn Văn Nam' })).toBeNull();
  });

  it('locks contribution submission until the financial refresh completes', async () => {
    let resolveContribution!: (value: unknown) => void;
    vi.mocked(teamsApi.contributeTreasuryApi).mockImplementationOnce(() => new Promise((resolve) => { resolveContribution = resolve; }));
    render(<MemoryRouter initialEntries={['/teams/team-fc-sango']}><Routes><Route path="/teams/:id" element={<TeamDetailPage />} /></Routes></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: /Quỹ Đội Minh Bạch/i }));
    const submit = screen.getByRole('button', { name: /Xác Nhận Đóng Quỹ/i });
    fireEvent.submit(submit.closest('form')!);
    fireEvent.submit(submit.closest('form')!);
    expect(teamsApi.contributeTreasuryApi).toHaveBeenCalledTimes(1);
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    resolveContribution({ success: true });
    await waitFor(() => expect((submit as HTMLButtonElement).disabled).toBe(false));
    expect(screen.getByText(/Đã đóng quỹ/)).toBeDefined();
  });

  it.each([
    ['a generic failure', new Error('Unavailable'), 'Không thể tạo đội. Vui lòng thử lại.'],
    ['an ApiError from the server', new ApiError('Tên đội đã tồn tại', 409), 'Tên đội đã tồn tại'],
  ])('keeps the create modal open and shows the message after %s', async (_label, error, message) => {
    vi.mocked(teamsApi.createTeamApi).mockRejectedValueOnce(error);
    render(
      <MemoryRouter initialEntries={['/teams']}>
        <Routes>
          <Route path="/teams" element={<TeamsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Tạo Đội Đầu Tiên' }));
    const nameInput = screen.getByPlaceholderText(/Ví dụ: SanGo United FC/) as HTMLInputElement;
    const submit = screen.getByRole('button', { name: 'Tạo Đội Ngay' });
    expect((submit as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(nameInput, { target: { value: 'SanGo United FC' } });
    expect((submit as HTMLButtonElement).disabled).toBe(false);
    await waitFor(() => expect(teamsApi.listMyTeamsApi).toHaveBeenCalledTimes(1));

    fireEvent.submit(submit.closest('form')!);

    expect((await screen.findByRole('alert')).textContent).toBe(message);
    expect(teamsApi.createTeamApi).toHaveBeenCalledWith({
      name: 'SanGo United FC',
      sportType: 'FOOTBALL5',
      description: '',
    });
    // Modal stays open on the typed values and the roster is never refetched.
    expect(screen.getByText(/Tạo Đội Thể Thao Mới/i)).toBeDefined();
    expect((screen.getByPlaceholderText(/Ví dụ: SanGo United FC/) as HTMLInputElement).value).toBe('SanGo United FC');
    expect(teamsApi.listMyTeamsApi).toHaveBeenCalledTimes(1);
    await waitFor(() => expect((screen.getByRole('button', { name: 'Tạo Đội Ngay' }) as HTMLButtonElement).disabled).toBe(false));
  });
});
