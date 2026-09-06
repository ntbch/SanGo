import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TeamsPage, TeamDetailPage } from '../src/features/teams/pages';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';

vi.mock('../src/features/teams/api/teams-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/features/teams/api/teams-api')>();
  const mockTeam = {
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
  };
  return {
    ...actual,
    listMyTeamsApi: vi.fn().mockResolvedValue([]),
    getTeamApi: vi.fn().mockResolvedValue(mockTeam),
    getTeamExpensesApi: vi.fn().mockResolvedValue([]),
    getTreasuryOverviewApi: vi.fn().mockResolvedValue({
      teamId: 'team-fc-sango',
      balance: 1500000,
      totalIncomeThisMonth: 2000000,
      totalExpenseThisMonth: 500000,
      recentTransactions: [],
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
    const searchInput = screen.getByPlaceholderText(/Tìm tên đội/i) as HTMLInputElement;
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
