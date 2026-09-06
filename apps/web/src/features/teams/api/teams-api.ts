import { apiClient } from '../../../lib/api-client';

export interface TeamMemberItem {
  id: string;
  teamId: string;
  userId: string;
  role: 'CAPTAIN' | 'VICE_CAPTAIN' | 'MEMBER';
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    phone?: string | null;
    email?: string | null;
    preferredPositions?: string[];
  };
}

export interface Team {
  id: string;
  name: string;
  sportType: string;
  logoUrl?: string | null;
  description?: string | null;
  captainId: string;
  createdAt: string;
  memberCount?: number;
  captain?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    avatarUrl?: string | null;
  };
  members?: TeamMemberItem[];
}

export interface MyTeamMembership {
  membershipId: string;
  role: 'CAPTAIN' | 'VICE_CAPTAIN' | 'MEMBER';
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
  joinedAt: string;
  team: Team;
}

export interface CreateTeamDto {
  name: string;
  sportType: string;
  description?: string;
  logoUrl?: string;
}

export interface AddTeamMemberDto {
  emailOrPhone: string;
  role?: 'MEMBER' | 'VICE_CAPTAIN';
}

export interface SplitBookingDto {
  bookingId: string;
  memberIds: string[];
  note?: string;
}

export interface ExpenseShare {
  id: string;
  teamId: string;
  bookingId: string | null;
  payerId: string;
  debtorId: string;
  amount: number;
  note?: string | null;
  status: 'UNPAID' | 'PAID';
  createdAt: string;
  payer: { id: string; fullName: string; avatarUrl?: string | null };
  debtor: { id: string; fullName: string; avatarUrl?: string | null };
  booking?: { id: string; code: string; date: string };
}

export interface TreasuryOverview {
  teamId: string;
  balance: number;
  totalIncomeThisMonth: number;
  totalExpenseThisMonth: number;
  recentTransactions: Array<{
    id: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    description: string;
    createdAt: string;
    createdByName?: string;
  }>;
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

export async function listMyTeamsApi(): Promise<MyTeamMembership[]> {
  return apiClient<MyTeamMembership[]>('/teams/my-teams');
}

export async function getTeamApi(teamId: string): Promise<Team> {
  return apiClient<Team>(`/teams/${teamId}`);
}

export async function createTeamApi(data: CreateTeamDto): Promise<Team> {
  return apiClient<Team>('/teams', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function addMemberApi(teamId: string, data: AddTeamMemberDto): Promise<any> {
  return apiClient(`/teams/${teamId}/invite`, {
    method: 'POST',
    body: JSON.stringify({
      targetPhone: data.emailOrPhone,
      role: data.role || 'MEMBER',
    }),
  });
}

export async function removeMemberApi(teamId: string, memberId: string): Promise<any> {
  return apiClient(`/teams/${teamId}/members/${memberId}`, {
    method: 'DELETE',
  });
}

export async function splitBookingApi(teamId: string, data: SplitBookingDto): Promise<any> {
  return apiClient(`/teams/${teamId}/expenses/split-booking`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getTeamExpensesApi(teamId: string): Promise<ExpenseShare[]> {
  // BE trả object tổng quan { ..., shares } — chuẩn hoá về mảng shares cho FE. 
  const data = await apiClient<ExpenseShare[] | { shares?: ExpenseShare[] }>(
    `/teams/${teamId}/expenses`,
  );
  return Array.isArray(data) ? data : (data.shares ?? []);
}

/** Phase 1 (T1.1): payer/captain xác nhận khoản nợ đã trả (UNPAID -> PAID). */
export async function updateExpenseShareStatusApi(
  teamId: string,
  shareId: string,
  status: 'PAID' | 'UNPAID',
): Promise<any> {
  return apiClient(`/teams/${teamId}/expenses/${shareId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/** Phase 1 (T1.3): debtor trả nợ chia tiền bằng Ví nội bộ (atomic, idempotent). */
export async function payExpenseShareApi(teamId: string, shareId: string): Promise<any> {
  return apiClient(`/teams/${teamId}/expenses/${shareId}/pay`, { method: 'POST' });
}

export async function getTreasuryOverviewApi(teamId: string): Promise<TreasuryOverview> {
  return apiClient<TreasuryOverview>(`/teams/${teamId}/treasury`);
}

export async function contributeTreasuryApi(teamId: string, data: ContributeFundDto): Promise<any> {
  return apiClient(`/teams/${teamId}/treasury/contribute`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createTreasuryExpenseApi(teamId: string, data: CreateTeamExpenseDto): Promise<any> {
  return apiClient(`/teams/${teamId}/fund-expenses`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
