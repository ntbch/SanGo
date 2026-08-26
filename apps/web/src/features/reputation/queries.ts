/** TanStack Query hooks cho F2 Điểm uy tín & Badge. */
import { useQuery } from '@tanstack/react-query';

import { fetchLeaderboard, fetchMyReputation } from './api';

/** Điểm uy tín + badge của chính tôi. */
export function useMyReputation() {
  return useQuery({ queryKey: ['reputation', 'me'], queryFn: fetchMyReputation });
}

/** Bảng xếp hạng uy tín — top N theo score giảm dần. */
export function useLeaderboard(limit = 20) {
  return useQuery({
    queryKey: ['reputation', 'leaderboard', limit],
    queryFn: () => fetchLeaderboard(limit),
  });
}
