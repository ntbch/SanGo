/** TanStack Query hooks cho F1 Teams & Sổ quỹ chia tiền. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ExpenseShareItem } from './types';

import {
  contributeTeamFund,
  createExpenseShare,
  createTeam,
  createTeamFundExpense,
  fetchMyTeams,
  fetchTeam,
  fetchTeamExpenses,
  inviteMember,
  removeMember,
  respondInvite,
  splitBookingExpense,
  updateExpenseStatus,
  updateTeam,
  type CreateTeamPayload,
  type UpdateTeamPayload,
} from './api';

/** Danh sách đội tôi tham gia. */
export function useMyTeams() {
  return useQuery({ queryKey: ['teams', 'my-teams'], queryFn: fetchMyTeams });
}

/** Chi tiết đội + thành viên. */
export function useTeam(id: string | undefined) {
  return useQuery({
    queryKey: ['teams', 'detail', id],
    queryFn: () => fetchTeam(id as string),
    enabled: Boolean(id),
  });
}

/** Quỹ chia tiền + tổng quan nợ của tôi trong đội. */
export function useTeamExpenses(id: string | undefined) {
  return useQuery({
    queryKey: ['teams', 'expenses', id],
    queryFn: () => fetchTeamExpenses(id as string),
    enabled: Boolean(id),
  });
}

function invalidateTeams(qc: ReturnType<typeof useQueryClient>): void {
  void qc.invalidateQueries({ queryKey: ['teams'] });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTeamPayload) => createTeam(payload),
    onSuccess: () => invalidateTeams(qc),
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTeamPayload }) =>
      updateTeam(id, payload),
    onSuccess: () => invalidateTeams(qc),
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      userId,
      role,
    }: {
      teamId: string;
      userId: string;
      role?: 'CAPTAIN' | 'MEMBER';
    }) => inviteMember(teamId, { userId, role }),
    onSuccess: () => invalidateTeams(qc),
  });
}

export function useRespondInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, accept }: { teamId: string; accept: boolean }) =>
      respondInvite(teamId, accept),
    onSuccess: () => invalidateTeams(qc),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      removeMember(teamId, userId),
    onSuccess: () => invalidateTeams(qc),
  });
}

export function useCreateExpenseShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      debtorId,
      amount,
      note,
    }: {
      teamId: string;
      debtorId: string;
      amount: number;
      note?: string;
    }) => createExpenseShare(teamId, { debtorId, amount, note }),
    onSuccess: () => invalidateTeams(qc),
  });
}

export function useSplitBookingExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      bookingId,
      memberIds,
      note,
    }: {
      teamId: string;
      bookingId: string;
      memberIds: string[];
      note?: string;
    }) => splitBookingExpense(teamId, { bookingId, memberIds, note }),
    onSuccess: () => invalidateTeams(qc),
  });
}

export function useUpdateExpenseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      shareId,
      status,
    }: {
      teamId: string;
      shareId: string;
      status: 'UNPAID' | 'PAID';
    }): Promise<ExpenseShareItem> => updateExpenseStatus(teamId, shareId, status),
    onSuccess: () => invalidateTeams(qc),
  });
}
export function useContributeTeamFund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, amount, note }: { teamId: string; amount: number; note?: string }) =>
      contributeTeamFund(teamId, { amount, note }),
    onSuccess: () => {
      invalidateTeams(qc);
      void qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useCreateTeamFundExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      title,
      amount,
      billImageUrl,
    }: {
      teamId: string;
      title: string;
      amount: number;
      billImageUrl?: string;
    }) => createTeamFundExpense(teamId, { title, amount, billImageUrl }),
    onSuccess: () => invalidateTeams(qc),
  });
}
