import { apiFetch } from '../../lib/api/client';
import { endpoints, type OpenMatchesQuery } from '../../lib/api/endpoints';
import type {
  JoinMatchResponse,
  LeaveMatchResponse,
  MatchParticipantsResponse,
  OpenMatchesResponse,
} from './types';

/**
 * [Public] Danh sách trận mở chưa đủ người (§3.11). Backend trả shape lồng
 * (host.fullName, venue.name...) — normalize về shape phẳng cho card UI.
 */
export async function fetchOpenMatches(query: OpenMatchesQuery): Promise<OpenMatchesResponse> {
  const raw = await apiFetch<OpenMatchesResponse>(endpoints.matches.open(query));
  const items = (raw.items ?? []).map((it) => ({
    ...it,
    hostName: it.host?.fullName ?? 'Ẩn danh',
    venueName: it.venue?.name ?? '',
    district: it.venue?.district ?? '',
    courtName: it.courtName ?? 'Sân không xác định',
    slotsNeeded: it.slotsNeeded ?? 0,
    joinedCount: it.joinedCount ?? 0,
    subtotal: it.subtotal ?? 0,
    depositAmount: it.depositAmount ?? 0,
  }));
  return { ...raw, items };
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
