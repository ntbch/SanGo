/** Lớp gọi API F2 Uy tín — khớp reputation.controller.ts. */
import { apiFetch } from '../../lib/api/client';
import { endpoints } from '../../lib/api/endpoints';
import type { LeaderboardResponse, MyReputation } from './types';

/** GET /reputation/me — điểm + badge của tôi (cache 5 phút phía server). */
export function fetchMyReputation(): Promise<MyReputation> {
  return apiFetch<MyReputation>(endpoints.reputation.me());
}

/**
 * GET /reputation/leaderboard — bảng xếp hạng theo score giảm dần.
 * BE trả item phẳng {userId, fullName, score, onTime, noShow} (fa1dfcb) còn mock
 * trả breakdown lồng nhau — chuẩn hóa về LeaderboardEntry ở đây để trang dùng chung.
 */
export async function fetchLeaderboard(limit = 20): Promise<LeaderboardResponse> {
  const raw = await apiFetch<{
    items: Array<{
      userId: string;
      fullName: string;
      avatarUrl?: string | null;
      score: number;
      onTime?: number;
      noShow?: number;
      breakdown?: { onTimeCheckIns: number; lateCancels: number; noShows: number };
      isMe?: boolean;
    }>;
    total?: number;
    generatedAt?: string;
  }>(endpoints.reputation.leaderboard(limit));

  return {
    items: raw.items.map((item) => ({
      userId: item.userId,
      fullName: item.fullName,
      avatarUrl: item.avatarUrl ?? null,
      score: item.score,
      breakdown: {
        onTimeCheckIns: item.onTime ?? item.breakdown?.onTimeCheckIns ?? 0,
        lateCancels: item.breakdown?.lateCancels ?? 0,
        noShows: item.noShow ?? item.breakdown?.noShows ?? 0,
      },
      isMe: item.isMe,
    })),
  };
}
