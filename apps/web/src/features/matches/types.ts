/**
 * Kiểu dữ liệu Ghép trận mở (§3.11) — khớp contract backend G2-B2:
 * apps/api/src/matches/dto/open-match.dto.ts + bookings.controller (join/participants).
 */

export type MatchSportType = 'FOOTBALL5' | 'FOOTBALL7' | 'PICKLEBALL' | 'BADMINTON' | 'TENNIS';

/** Một dòng trong danh sách trận mở — phẳng, đủ thông tin cho card UI. */
export interface OpenMatchItem {
  bookingId: string;
  /** Mã đơn CH-YYYYMMDD-NNNN của chủ đơn. */
  code: string;
  courtName: string;
  sportType: MatchSportType;
  /** YYYY-MM-DD */
  date: string;
  /** Phút bắt đầu trong ngày (vd 1020 = 17:00). */
  startMinute: number;
  endMinute: number;
  /** Tổng giá trị đơn (VND) — người tham gia trả chủ đơn NGOÀI hệ thống. */
  subtotal: number;
  depositAmount: number;
  /** Tên chủ đơn. */
  hostName: string;
  slotsNeeded: number;
  joinedCount: number;
}

export interface OpenMatchesResponse {
  items: OpenMatchItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Phản hồi POST /bookings/:id/join sau khi tham gia. */
export interface JoinMatchResponse {
  joinedCount: number;
  slotsNeeded: number | null;
  matchFull: boolean;
}

/** Phản hồi DELETE /bookings/:id/join sau khi rời ghép. */
export interface LeaveMatchResponse {
  left: boolean;
  bookingId: string;
  matchFull: boolean;
}

export interface MatchParticipant {
  userId: string;
  fullName: string;
  joinedAt: string;
}

/** Phản hồi GET /bookings/:id/participants — chỉ chủ đơn hoặc ADMIN. */
export interface MatchParticipantsResponse {
  bookingId: string;
  slotsNeeded: number | null;
  matchFull: boolean;
  joinedCount: number;
  participants: MatchParticipant[];
}
