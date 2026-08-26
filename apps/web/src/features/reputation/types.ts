/**
 * Kiểu dữ liệu F2 Điểm uy tín & Badge (Sprint 3) — khớp contract backend
 * reputation.controller.ts (compute-on-read từ Booking, cache 5 phút).
 */

export interface ReputationBreakdown {
  /** Số lần CHECKED_IN với checkedInAt <= giờ bắt đầu. */
  onTimeCheckIns: number;
  /** Số lần hủy sát giờ (<12h trước giờ chơi). */
  lateCancels: number;
  /** COMPLETED mà không có checkedInAt. */
  noShows: number;
}

/** Một huy hiệu — unlocked khi current >= target. */
export interface ReputationBadge {
  code: string;
  name: string;
  unlocked: boolean;
  current: number;
  target: number;
}

/** GET /reputation/me — điểm uy tín của chính tôi (0..100). */
export interface MyReputation {
  score: number;
  breakdown: ReputationBreakdown;
  badges: ReputationBadge[];
}

/** Một dòng trên bảng xếp hạng — sắp theo score giảm dần. */
export interface LeaderboardEntry {
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  score: number;
  breakdown: ReputationBreakdown;
  /** Cờ đánh dấu dòng của chính người xem (mock gắn; API thật so userId ở FE). */
  isMe?: boolean;
}

/** GET /reputation/leaderboard?limit=N. */
export interface LeaderboardResponse {
  items: LeaderboardEntry[];
}
