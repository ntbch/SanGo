/** Lớp gọi API F1 Team Profile & Sổ quỹ chia tiền — khớp teams.controller.ts. */
import { apiFetch } from '../../lib/api/client';
import { endpoints } from '../../lib/api/endpoints';
import type { ExpenseShareItem, MyTeamMembership, Team, TeamExpensesResponse } from './types';

export interface CreateTeamPayload {
  name: string;
  logoUrl?: string;
  description?: string;
  sportType: string;
}

export type UpdateTeamPayload = Partial<CreateTeamPayload>;

/** POST /teams — tạo đội, người tạo là CAPTAIN. */
export function createTeam(payload: CreateTeamPayload): Promise<Team> {
  return apiFetch<Team>(endpoints.teams.create(), { method: 'POST', body: payload });
}

/** GET /teams/my-teams — các đội tôi tham gia (ACTIVE hoặc PENDING). */
export function fetchMyTeams(): Promise<MyTeamMembership[]> {
  return apiFetch<MyTeamMembership[]>(endpoints.teams.myTeams());
}

/** GET /teams/:id — chi tiết đội + thành viên. */
export function fetchTeam(id: string): Promise<Team> {
  return apiFetch<Team>(endpoints.teams.detail(id));
}

/** PATCH /teams/:id — chỉnh sửa đội (chỉ CAPTAIN). */
export function updateTeam(id: string, payload: UpdateTeamPayload): Promise<Team> {
  return apiFetch<Team>(endpoints.teams.update(id), { method: 'PATCH', body: payload });
}

/** POST /teams/:id/invite — mời userId vào đội (CAPTAIN). */
export function inviteMember(
  id: string,
  payload: { userId: string; role?: 'CAPTAIN' | 'MEMBER' },
): Promise<{ success: boolean }> {
  return apiFetch(endpoints.teams.invite(id), { method: 'POST', body: payload });
}

/** POST /teams/:id/respond-invite — chấp nhận/từ chối lời mời. */
export function respondInvite(id: string, accept: boolean): Promise<{ success: boolean }> {
  return apiFetch(endpoints.teams.respondInvite(id), {
    method: 'POST',
    body: { accept },
  });
}

/** DELETE /teams/:id/members/:userId — xoá member / tự rời đội. */
export function removeMember(id: string, userId: string): Promise<{ success: boolean }> {
  return apiFetch(endpoints.teams.removeMember(id, userId), { method: 'DELETE' });
}

/** GET /teams/:id/expenses — quỹ chia tiền + tổng quan nợ. */
export function fetchTeamExpenses(id: string): Promise<TeamExpensesResponse> {
  return apiFetch<TeamExpensesResponse>(endpoints.teams.expenses(id));
}

/** POST /teams/:id/expenses — ghi nợ thủ công cho một thành viên. */
export function createExpenseShare(
  id: string,
  payload: { debtorId: string; amount: number; note?: string },
): Promise<ExpenseShareItem> {
  return apiFetch<ExpenseShareItem>(endpoints.teams.createExpense(id), {
    method: 'POST',
    body: payload,
  });
}

/** POST /teams/:id/expenses/split-booking — chia đều tiền sân cho members. */
export function splitBookingExpense(
  id: string,
  payload: { bookingId: string; memberIds: string[]; note?: string },
): Promise<{
  bookingId: string;
  bookingCode: string;
  totalAmount: number;
  sharePerPerson: number;
  sharesCreated: number;
}> {
  return apiFetch(endpoints.teams.splitBooking(id), { method: 'POST', body: payload });
}

/** PATCH /teams/:id/expenses/:shareId/status — đánh dấu đã trả/chưa trả. */
export function updateExpenseStatus(
  id: string,
  shareId: string,
  status: 'UNPAID' | 'PAID',
): Promise<ExpenseShareItem> {
  return apiFetch(endpoints.teams.updateExpenseStatus(id, shareId), {
    method: 'PATCH',
    body: { status },
  });
}
