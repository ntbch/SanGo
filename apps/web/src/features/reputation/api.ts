/** Lớp gọi API F2 Uy tín — khớp reputation.controller.ts. */
import { apiFetch } from '../../lib/api/client';
import { endpoints } from '../../lib/api/endpoints';
import type { LeaderboardResponse, MyReputation } from './types';

/** GET /reputation/me — điểm + badge của tôi (cache 5 phút phía server). */
export function fetchMyReputation(): Promise<MyReputation> {
  return apiFetch<MyReputation>(endpoints.reputation.me());
}

/** GET /reputation/leaderboard — bảng xếp hạng theo score giảm dần. */
export function fetchLeaderboard(limit = 20): Promise<LeaderboardResponse> {
  return apiFetch<LeaderboardResponse>(endpoints.reputation.leaderboard(limit));
}
