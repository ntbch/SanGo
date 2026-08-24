import { apiFetch } from '../../lib/api/client';
import { endpoints, type OpenMatchesQuery } from '../../lib/api/endpoints';
import type {
  JoinMatchResponse,
  LeaveMatchResponse,
  MatchParticipantsResponse,
  OpenMatchesResponse,
} from './types';

/** [Public] Danh sách trận mở chưa đủ người, lọc loại sân/ngày (§3.11). */
export function fetchOpenMatches(query: OpenMatchesQuery): Promise<OpenMatchesResponse> {
  return apiFetch<OpenMatchesResponse>(endpoints.matches.open(query));
}

/** Tham gia ghép trận trên đơn của người khác (chặn tự join, trùng, đủ người). */
export function joinOpenMatch(bookingId: string): Promise<JoinMatchResponse> {
  return apiFetch<JoinMatchResponse>(endpoints.bookings.joinMatch(bookingId), { method: 'POST' });
}

/** Rời ghép trận đã tham gia. */
export function leaveOpenMatch(bookingId: string): Promise<LeaveMatchResponse> {
  return apiFetch<LeaveMatchResponse>(endpoints.bookings.joinMatch(bookingId), {
    method: 'DELETE',
  });
}

/** Danh sách người đã tham gia — chỉ chủ đơn hoặc ADMIN gọi được. */
export function fetchMatchParticipants(bookingId: string): Promise<MatchParticipantsResponse> {
  return apiFetch<MatchParticipantsResponse>(endpoints.bookings.matchParticipants(bookingId));
}
