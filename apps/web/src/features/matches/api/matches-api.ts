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
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    reputationScore?: number;
    phone?: string;
  };
}

export interface MatchComment {
  id: string;
  matchId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
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
  costPerPerson: number;
  description?: string;
  /** P5a O1: true = kèo cần duyệt (join trực tiếp 409 APPROVAL_REQUIRED); null/false = join trực tiếp. */
  requiresApproval?: boolean | null;
  hostUser: MatchHostUser;
  participants?: MatchParticipant[];
  comments?: MatchComment[];
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
  reason?: string;
}

export interface CreateMatchCommentDto {
  content: string;
}

function minuteToTimeStr(minute?: number): string {
  if (minute === undefined || minute === null || isNaN(minute)) return '18:00';
  const h = Math.floor(minute / 60).toString().padStart(2, '0');
  const m = (minute % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function normalizeMatchItem(item: any): OpenMatch {
  const id = item.id || item.bookingId || '';
  const hostName = item.host?.fullName || item.hostName || item.hostUser?.fullName || item.customer?.fullName || 'Chủ kèo';
  const slotsNeeded = item.slotsNeeded ?? 2;
  const joinedCount = item.joinedCount ?? (item.participants ? item.participants.filter((p: any) => p.status === 'APPROVED').length : 1);
  const totalSlots = item.totalSlots ?? (slotsNeeded + joinedCount);
  const filledSlots = item.filledSlots ?? joinedCount;
  const cost =
    item.costPerPerson ??
    (item.subtotal && totalSlots ? Math.round(item.subtotal / totalSlots) : 50000);

  const dateStr = item.date
    ? typeof item.date === 'string'
      ? item.date.slice(0, 10)
      : new Date(item.date).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return {
    id,
    title:
      item.title ||
      `Kèo ${item.courtName || item.court?.name || 'Sân'} - Cần ghép ${slotsNeeded} người`,
    sportType: item.sportType || item.court?.sportType || 'FOOTBALL7',
    skillLevel: item.skillLevel || 'Phong trào',
    date: dateStr,
    startTime: item.startTime || minuteToTimeStr(item.startMinute || 1080),
    endTime: item.endTime || minuteToTimeStr(item.endMinute || 1170),
    venueName: item.venueName || item.court?.venue?.name || 'Sân Thể Thao',
    venueAddress:
      item.venueAddress || item.court?.venue?.address || '',
    city: item.city || item.court?.venue?.city || 'Hà Nội',
    district: item.district || item.court?.venue?.district || '',
    totalSlots: Math.max(1, totalSlots),
    filledSlots: Math.max(1, filledSlots),
    costPerPerson: cost,
    description: item.description || 'Trận đấu giao lưu phong trào. có mặt đúng giờ.',
    // P5a O1: BE trả field này sau migration requiresApproval; null coi như join trực tiếp.
    requiresApproval: item.requiresApproval ?? null,
    hostUser: {
      id: item.hostUser?.id || item.customerId || '',
      fullName: hostName,
      avatarUrl: item.hostUser?.avatarUrl || item.customer?.avatarUrl || null,
      reputationScore: item.hostUser?.reputationScore ?? 100,
    },
    participants: item.participants || [],
    comments: item.comments || [],
  };
}

export async function listOpenMatchesApi(filters?: OpenMatchFilters): Promise<OpenMatch[]> {
  const params = new URLSearchParams();
  if (filters?.sportType) params.append('sportType', filters.sportType);
  if (filters?.city) params.append('city', filters.city);
  if (filters?.district) params.append('district', filters.district);
  if (filters?.date) params.append('date', filters.date);

  const qs = params.toString() ? `?${params.toString()}` : '';
  const raw = await apiClient<any>(`/matches/open${qs}`);
  const items = Array.isArray(raw) ? raw : (raw?.items || []);
  return items.map(normalizeMatchItem);
}

export async function getMatchDetailApi(matchId: string): Promise<OpenMatch> {
  const raw = await apiClient<any>(`/matches/${matchId}`);
  return normalizeMatchItem(raw);
}

export async function createJoinRequestApi(matchId: string, data: CreateJoinRequestDto): Promise<any> {
  return apiClient(`/matches/${matchId}/requests`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function listJoinRequestsApi(matchId: string): Promise<MatchParticipant[]> {
  const raw = await apiClient<any[]>(`/matches/${matchId}/requests`);
  return Array.isArray(raw) ? raw : [];
}

export async function reviewJoinRequestApi(
  matchId: string,
  requestId: string,
  data: ReviewJoinRequestDto,
): Promise<any> {
  return apiClient(`/matches/${matchId}/requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function listMatchCommentsApi(matchId: string): Promise<MatchComment[]> {
  const raw = await apiClient<any[]>(`/matches/${matchId}/comments`);
  return Array.isArray(raw) ? raw : [];
}

export async function createMatchCommentApi(
  matchId: string,
  data: CreateMatchCommentDto,
): Promise<MatchComment> {
  return apiClient<MatchComment>(`/matches/${matchId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
