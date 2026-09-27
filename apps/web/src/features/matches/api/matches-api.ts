import { z } from 'zod';
import { apiClient } from '../../../lib/api-client';

export interface MatchHostUser {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  reputationScore?: number;
  phone?: string;
}

export interface MatchParticipant {
  id: string;
  matchId: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  preferredPosition?: string | null;
  note?: string | null;
  joinedAt: string;
  user: MatchHostUser;
}

export interface MatchComment {
  id: string;
  matchId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: MatchHostUser;
}

export interface OpenMatch {
  id: string;
  title: string;
  sportType: string;
  skillLevel?: string;
  date: string;
  startTime: string;
  endTime: string;
  venueName: string;
  venueAddress: string;
  city?: string;
  district?: string;
  totalSlots: number;
  filledSlots: number;
  costPerPerson?: number;
  description?: string;
  requiresApproval?: boolean | null;
  /** null khi booking không có tài khoản (đơn quầy) — Booking.customerId nullable. */
  hostUser: MatchHostUser | null;
  participants?: MatchParticipant[];
  comments?: MatchComment[];
  targetPositions?: string[];
}

export interface OpenMatchFilters {
  sportType?: string;
  city?: string;
  district?: string;
  date?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  page?: number;
  limit?: number;
}

export interface CreateJoinRequestDto {
  preferredPosition?: string;
  note?: string;
}

export interface ReviewJoinRequestDto {
  status: 'APPROVED' | 'REJECTED';
}

export interface CreateMatchCommentDto {
  content: string;
}

const userSchema = z.object({
  id: z.string().min(1),
  fullName: z.string(),
  avatarUrl: z.string().nullable().optional(),
});
const venueSchema = z.object({
  name: z.string(),
  address: z.string(),
  city: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
});
const matchSchema = z.object({
  bookingId: z.string(),
  date: z.string(),
  startMinute: z.number(),
  endMinute: z.number(),
  slotsNeeded: z.number().nonnegative(),
  joinedCount: z.number().nonnegative(),
  costPerPerson: z.number(),
  matchLevel: z.string(),
  targetPositions: z.array(z.string()).optional(),
  requiresApproval: z.boolean().nullable(),
  host: userSchema.nullable(),
  courtName: z.string().optional(),
  sportType: z.string().optional(),
  venue: venueSchema.optional(),
  court: z.object({ name: z.string(), sportType: z.string(), venue: venueSchema }).optional(),
  participants: z.array(userSchema.extend({
    preferredPositions: z.array(z.string()),
    joinedAt: z.string(),
  })).optional(),
});
const joinRequestSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  userId: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  position: z.string().nullable(),
  message: z.string().nullable(),
  createdAt: z.string(),
  user: userSchema,
});
const commentSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  userId: z.string(),
  content: z.string(),
  createdAt: z.string(),
  user: userSchema,
});

function minuteToTimeStr(minute: number): string {
  const h = Math.floor(minute / 60).toString().padStart(2, '0');
  const m = (minute % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** Nhãn tiếng Việt cho enum MatchLevel của Prisma; giữ nguyên giá trị gốc nếu lạ. */
const MATCH_LEVEL_LABELS: Record<string, string> = {
  FRIENDLY: 'Giao lưu',
  CASUAL: 'Phong trào',
  SCRIM: 'Đấu tập',
  SEMI_PRO: 'Bán chuyên nghiệp',
};

function normalizeMatchItem(item: z.infer<typeof matchSchema>): OpenMatch {
  const venue = item.venue ?? item.court?.venue;
  return {
    id: item.bookingId,
    title: `Kèo ${item.courtName ?? item.court?.name ?? 'Sân'} - Cần ghép ${item.slotsNeeded} người`,
    sportType: item.sportType ?? item.court?.sportType ?? '',
    skillLevel: MATCH_LEVEL_LABELS[item.matchLevel] ?? item.matchLevel,
    date: item.date,
    startTime: minuteToTimeStr(item.startMinute),
    endTime: minuteToTimeStr(item.endMinute),
    venueName: venue?.name ?? '',
    venueAddress: venue?.address ?? '',
    city: venue?.city ?? '',
    district: venue?.district ?? '',
    totalSlots: item.slotsNeeded,
    filledSlots: item.joinedCount,
    costPerPerson: item.costPerPerson,
    requiresApproval: item.requiresApproval,
    targetPositions: item.targetPositions,
    hostUser: item.host,
    participants: (item.participants ?? []).map((participant) => ({
      id: participant.id,
      matchId: item.bookingId,
      userId: participant.id,
      status: 'APPROVED',
      preferredPosition: participant.preferredPositions.join(', ') || null,
      joinedAt: participant.joinedAt,
      user: participant,
    })),
  };
}

export async function listOpenMatchesApi(filters?: OpenMatchFilters): Promise<OpenMatch[]> {
  const params = new URLSearchParams();
  if (filters?.sportType) {
    params.append(filters.sportType === 'FOOTBALL' ? 'sportGroup' : 'sportType', filters.sportType);
  }
  if (filters?.city) params.append('city', filters.city);
  if (filters?.district) params.append('district', filters.district);
  if (filters?.date) params.append('date', filters.date);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));
  const qs = params.toString() ? `?${params.toString()}` : '';
  const raw = await apiClient<unknown>(`/matches/open${qs}`);
  return z.object({ items: z.array(matchSchema) }).parse(raw).items.map(normalizeMatchItem);
}

export async function getMatchDetailApi(matchId: string): Promise<OpenMatch> {
  const raw = await apiClient<unknown>(`/matches/${matchId}`);
  return normalizeMatchItem(matchSchema.parse(raw));
}

export async function createJoinRequestApi(matchId: string, data: CreateJoinRequestDto): Promise<unknown> {
  return apiClient(`/matches/${matchId}/requests`, {
    method: 'POST',
    body: JSON.stringify({ position: data.preferredPosition, message: data.note }),
  });
}

export async function listJoinRequestsApi(matchId: string): Promise<MatchParticipant[]> {
  const raw = await apiClient<unknown>(`/matches/${matchId}/requests`);
  return z.array(joinRequestSchema).parse(raw).map((request) => ({
    id: request.id,
    matchId: request.bookingId,
    userId: request.userId,
    status: request.status,
    preferredPosition: request.position,
    note: request.message,
    joinedAt: request.createdAt,
    user: request.user,
  }));
}

export async function reviewJoinRequestApi(
  matchId: string,
  requestId: string,
  data: ReviewJoinRequestDto,
): Promise<unknown> {
  return apiClient(`/matches/${matchId}/requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function listMatchCommentsApi(matchId: string): Promise<MatchComment[]> {
  const raw = await apiClient<unknown>(`/matches/${matchId}/comments`);
  return z.array(commentSchema).parse(raw).map((comment) => ({ ...comment, matchId: comment.bookingId }));
}

export async function createMatchCommentApi(
  matchId: string,
  data: CreateMatchCommentDto,
): Promise<MatchComment> {
  const raw = await apiClient<unknown>(`/matches/${matchId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const comment = commentSchema.parse(raw);
  return { ...comment, matchId: comment.bookingId };
}
