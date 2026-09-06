import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TeamsPage, TeamDetailPage } from '../src/features/teams/pages';
import { TeamCard } from '../src/features/teams/components/team-card';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';

const { mockTeam } = vi.hoisted(() => ({
  mockTeam: {
    id: 'team-fc-sango',
    name: 'SanGo Warriors FC',
    sportType: 'FOOTBALL',
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
      totalIncomeThisMonth: 2000000,
      totalExpenseThisMonth: 500000,
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

  it('renders TeamCard with athletic roster stats, font-mono-num badges, and active scale transition', () => {
    const mockMembership = {
      membershipId: 'mem-1',
      role: 'CAPTAIN' as const,
      status: 'ACTIVE' as const,
      joinedAt: new Date().toISOString(),
      team: mockTeam,
    };

    const { container } = render(
      <MemoryRouter>
        <TeamCard membership={mockMembership} />
      </MemoryRouter>,
    );

    // Member count & captain name
    expect(screen.getByText(/2 Cầu thủ/i)).toBeDefined();
    expect(screen.getByText(/Trần Đức Người Chơi/i)).toBeDefined();

    // Badges font-mono-num font-bold
    const roleBadge = screen.getByText('Đội Trưởng');
    expect(roleBadge.className).toContain('font-mono-num');
    expect(roleBadge.className).toContain('font-bold');

    const memberStat = screen.getByText(/2 Cầu thủ/i);
    expect(memberStat.className).toContain('font-mono-num');
    expect(memberStat.className).toContain('font-bold');

    // Link has active:scale-[0.98] and NO hover:opacity
    const link = screen.getByRole('link', { name: /Vào phòng đội/i });
    expect(link.className).toContain('active:scale-[0.98]');
    expect(link.className).not.toContain('hover:opacity');

    // Card should not contain group-hover:scale-105 or animate-pulse
    expect(container.innerHTML).not.toContain('group-hover:scale-105');
    expect(container.innerHTML).not.toContain('animate-pulse');
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

    // Income transaction: + xanh lá (text-emerald-600)
    const incomeAmount = screen.getByText(/\+.*500\.000/);
    expect(incomeAmount.className).toContain('font-mono-num');
    expect(incomeAmount.className).toContain('text-emerald-600');

    // Expense transaction: - text-foreground (no raw rose-500)
    const expenseAmount = screen.getByText(/-.*200\.000/);
    expect(expenseAmount.className).toContain('font-mono-num');
    expect(expenseAmount.className).toContain('text-foreground');
    expect(expenseAmount.className).not.toContain('rose-500');

    // 2. Switch to Split tab -> Test Split bill reconciliation
    const splitTabBtn = screen.getByRole('button', { name: /Chia Tiền Sân Tự Động/i });
    expect(splitTabBtn).toBeDefined();
    fireEvent.click(splitTabBtn);

    expect(screen.getByRole('heading', { name: /Tạo Khoản Chia Tiền Sân/i })).toBeDefined();
    expect(screen.getByRole('heading', { name: /Nhật Ký Các Khoản Chia Tiền/i })).toBeDefined();
    expect(screen.getByText(/Nguyễn Văn Nam nợ Trần Đức Người Chơi/i)).toBeDefined();
    expect(screen.getByText(/Chưa Trả/i)).toBeDefined();
  });
});
