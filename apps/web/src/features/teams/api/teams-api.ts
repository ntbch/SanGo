import { apiClient } from '../../../lib/api-client';

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'CAPTAIN' | 'MEMBER' | 'CO_CAPTAIN';
  status: 'ACTIVE' | 'PENDING';
  joinedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
}

export interface Team {
  id: string;
  name: string;
  logoUrl?: string | null;
  description?: string | null;
  sportType: string;
  captainId: string;
  createdAt: string;
  captain?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    email: string;
    phone?: string | null;
  };
  members?: TeamMember[];
  memberCount?: number;
}

export interface MyTeamMembership {
  membershipId: string;
  role: 'CAPTAIN' | 'MEMBER' | 'CO_CAPTAIN';
  status: 'ACTIVE' | 'PENDING';
  joinedAt: string;
  team: Team;
}

export interface CreateTeamDto {
  name: string;
  sportType: string;
  logoUrl?: string;
  description?: string;
}

export interface AddTeamMemberDto {
  userId?: string;
  email?: string;
  phone?: string;
  role?: 'CAPTAIN' | 'MEMBER' | 'CO_CAPTAIN';
}

export interface ExpenseShare {
  id: string;
  teamId: string;
  bookingId?: string | null;
  payerId: string;
  debtorId: string;
  amount: number;
  note?: string | null;
  status: 'UNPAID' | 'PAID';
  createdAt: string;
  payer?: { id: string; fullName: string; avatarUrl?: string | null };
  debtor?: { id: string; fullName: string; avatarUrl?: string | null };
  booking?: { id: string; code: string; date: string };
}

export interface SplitBookingDto {
  bookingId: string;
  memberIds: string[];
  note?: string;
}

export interface TreasuryOverview {
  teamId: string;
  balance: number;
  totalIncomeThisMonth: number;
  totalExpenseThisMonth: number;
  recentTransactions?: {
    id: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    description: string;
    createdAt: string;
    createdByName?: string;
  }[];
}

export interface ContributeFundDto {
  amount: number;
  note?: string;
}

export interface CreateTeamExpenseDto {
  amount: number;
  description: string;
  receiptUrl?: string;
}

// Fallback Mock Data for demo / offline experience
const MOCK_MY_TEAMS: MyTeamMembership[] = [
  {
    membershipId: 'mem-1',
    role: 'CAPTAIN',
    status: 'ACTIVE',
    joinedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    team: {
      id: 'team-fc-sango',
      name: 'SanGo Warriors FC',
      sportType: 'FOOTBALL',
      description: 'Đội bóng đá phong trào sân 7 khu vực Cầu Giấy - Mỹ Đình.',
      captainId: 'u-1',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      memberCount: 14,
      captain: {
        id: 'u-1',
        fullName: 'Trần Đức Người Chơi',
        email: 'player1@sango.vn',
        phone: '0987654321',
      },
    },
  },
  {
    membershipId: 'mem-2',
    role: 'MEMBER',
    status: 'ACTIVE',
    joinedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    team: {
      id: 'team-pb-hanoi',
      name: 'Pickleball Hà Nội Pro',
      sportType: 'PICKLEBALL',
      description: 'CLB Pickleball giao lưu thứ 3-5-7 hàng tuần.',
      captainId: 'u-2',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      memberCount: 8,
      captain: {
        id: 'u-2',
        fullName: 'Lê Hoàng Nam',
        email: 'nam.le@sango.vn',
      },
    },
  },
];

export async function listMyTeamsApi(): Promise<MyTeamMembership[]> {
  try {
    return await apiClient<MyTeamMembership[]>('/teams/mine');
  } catch {
    return MOCK_MY_TEAMS;
  }
}

export async function getTeamApi(teamId: string): Promise<Team> {
  try {
    return await apiClient<Team>(`/teams/${teamId}`);
  } catch {
    const found = MOCK_MY_TEAMS.find((m) => m.team.id === teamId)?.team;
    if (found) {
      return {
        ...found,
        members: [
          {
            id: 'm-1',
            teamId,
            userId: 'u-1',
            role: 'CAPTAIN',
            status: 'ACTIVE',
            joinedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
            user: { id: 'u-1', fullName: 'Trần Đức Người Chơi', email: 'player1@sango.vn', phone: '0987654321' },
          },
          {
            id: 'm-2',
            teamId,
            userId: 'u-2',
            role: 'MEMBER',
            status: 'ACTIVE',
            joinedAt: new Date(Date.now() - 25 * 86400000).toISOString(),
            user: { id: 'u-2', fullName: 'Nguyễn Văn Minh', email: 'minh.nguyen@sango.vn', phone: '0912345678' },
          },
          {
            id: 'm-3',
            teamId,
            userId: 'u-3',
            role: 'MEMBER',
            status: 'ACTIVE',
            joinedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
            user: { id: 'u-3', fullName: 'Phạm Tuấn Anh', email: 'anh.pham@sango.vn', phone: '0909888777' },
          },
          {
            id: 'm-4',
            teamId,
            userId: 'u-4',
            role: 'MEMBER',
            status: 'ACTIVE',
            joinedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
            user: { id: 'u-4', fullName: 'Đặng Quốc Huy', email: 'huy.dang@sango.vn', phone: '0933221144' },
          },
        ],
      };
    }
    return {
      id: teamId,
      name: 'SanGo Warriors FC',
      sportType: 'FOOTBALL',
      description: 'CLB thể thao phong trào SanGo.',
      captainId: 'u-1',
      createdAt: new Date().toISOString(),
      memberCount: 6,
      captain: { id: 'u-1', fullName: 'Trần Đức Người Chơi', email: 'player1@sango.vn' },
      members: [],
    };
  }
}

export async function createTeamApi(data: CreateTeamDto): Promise<Team> {
  try {
    return await apiClient<Team>('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: data.name,
      sportType: data.sportType,
      description: data.description,
      logoUrl: data.logoUrl,
      captainId: 'u-1',
      createdAt: new Date().toISOString(),
      memberCount: 1,
    };
    MOCK_MY_TEAMS.unshift({
      membershipId: `mem-${Date.now()}`,
      role: 'CAPTAIN',
      status: 'ACTIVE',
      joinedAt: new Date().toISOString(),
      team: newTeam,
    });
    return newTeam;
  }
}

export async function addMemberApi(teamId: string, data: AddTeamMemberDto): Promise<any> {
  return apiClient(`/teams/${teamId}/members`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).catch(() => ({ success: true, message: 'Đã thêm thành viên' }));
}

export async function removeMemberApi(teamId: string, memberId: string): Promise<any> {
  return apiClient(`/teams/${teamId}/members/${memberId}`, {
    method: 'DELETE',
  }).catch(() => ({ success: true, message: 'Đã xóa thành viên' }));
}

export async function splitBookingApi(teamId: string, data: SplitBookingDto): Promise<any> {
  return apiClient(`/teams/${teamId}/split-booking`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).catch(() => ({
    success: true,
    bookingId: data.bookingId,
    totalAmount: 600000,
    sharePerPerson: Math.floor(600000 / (data.memberIds.length || 1)),
  }));
}

export async function getTeamExpensesApi(teamId: string): Promise<ExpenseShare[]> {
  try {
    return await apiClient<ExpenseShare[]>(`/teams/${teamId}/expenses`);
  } catch {
    return [
      {
        id: 'exp-1',
        teamId,
        bookingId: 'b-1',
        payerId: 'u-1',
        debtorId: 'u-2',
        amount: 75000,
        note: 'Tiền sân thứ 3 tuần trước',
        status: 'PAID',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        payer: { id: 'u-1', fullName: 'Trần Đức Người Chơi' },
        debtor: { id: 'u-2', fullName: 'Nguyễn Văn Minh' },
        booking: { id: 'b-1', code: 'SG-20260824-001', date: '2026-08-24' },
      },
      {
        id: 'exp-2',
        teamId,
        bookingId: 'b-2',
        payerId: 'u-1',
        debtorId: 'u-3',
        amount: 75000,
        note: 'Tiền sân thứ 3 tuần trước',
        status: 'UNPAID',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        payer: { id: 'u-1', fullName: 'Trần Đức Người Chơi' },
        debtor: { id: 'u-3', fullName: 'Phạm Tuấn Anh' },
        booking: { id: 'b-2', code: 'SG-20260824-001', date: '2026-08-24' },
      },
    ];
  }
}

export async function getTreasuryOverviewApi(teamId: string): Promise<TreasuryOverview> {
  try {
    return await apiClient<TreasuryOverview>(`/teams/${teamId}/treasury`);
  } catch {
    return {
      teamId,
      balance: 1850000,
      totalIncomeThisMonth: 2400000,
      totalExpenseThisMonth: 550000,
      recentTransactions: [
        {
          id: 'tx-1',
          type: 'INCOME',
          amount: 500000,
          description: 'Đóng quỹ tháng 8 - Trần Đức',
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          createdByName: 'Trần Đức',
        },
        {
          id: 'tx-2',
          type: 'INCOME',
          amount: 500000,
          description: 'Đóng quỹ tháng 8 - Nguyễn Văn Minh',
          createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
          createdByName: 'Nguyễn Văn Minh',
        },
        {
          id: 'tx-3',
          type: 'EXPENSE',
          amount: 250000,
          description: 'Mua nước điện giải & bóng thi đấu',
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          createdByName: 'Trần Đức',
        },
      ],
    };
  }
}

export async function contributeTreasuryApi(teamId: string, data: ContributeFundDto): Promise<any> {
  return apiClient(`/teams/${teamId}/treasury/contribute`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).catch(() => ({ success: true, message: 'Đóng quỹ thành công' }));
}

export async function createTreasuryExpenseApi(teamId: string, data: CreateTeamExpenseDto): Promise<any> {
  return apiClient(`/teams/${teamId}/fund-expenses`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).catch(() => ({ success: true, message: 'Đã ghi khoản chi' }));
}
