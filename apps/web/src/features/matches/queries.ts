import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { OpenMatchesResponse } from './types';

import { fetchMatchParticipants, fetchOpenMatches, joinOpenMatch, leaveOpenMatch } from './api';

/** Danh sách trận mở — queryKey gồm filter để đổi sportType/ngày refetch đúng. */
export function useOpenMatches(filters: {
  sportType?: string;
  /** Nhóm môn gộp (vd FOOTBALL = sân 5 + sân 7). */
  sportGroup?: string;
  date?: string;
  page?: number;
}): ReturnType<typeof useQuery<OpenMatchesResponse>> {
  return useQuery({
    queryKey: ['matches', 'open', filters],
    queryFn: () =>
      fetchOpenMatches({
        ...(filters.sportType ? { sportType: filters.sportType as never } : {}),
        ...(filters.sportGroup ? { sportGroup: filters.sportGroup as never } : {}),
        ...(filters.date ? { date: filters.date } : {}),
        page: filters.page ?? 1,
      }),
  });
}

/** Tham gia ghép trận — invalidate danh sách để X/Y cập nhật ngay. */
export function useJoinMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => joinOpenMatch(bookingId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

/** Rời ghép trận. */
export function useLeaveMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => leaveOpenMatch(bookingId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

/** Người đã tham gia của một đơn — chỉ bật khi có bookingId (modal chủ đơn). */
export function useMatchParticipants(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['matches', 'participants', bookingId],
    queryFn: () => fetchMatchParticipants(bookingId as string),
    enabled: bookingId !== undefined && bookingId !== '',
  });
}
