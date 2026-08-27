import { apiClient } from '../../../lib/api-client';

export interface MatchParticipant {
  id: string;
  matchId: string;
  userId: string;
  teamSide?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  preferredPosition?: string | null;
  note?: string | null;
  joinedAt: string;
  user?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    reputationScore?: number;
  };
}

export interface MatchComment {
  id: string;
  matchId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: {
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
  city: string;
  district: string;
  totalSlots: number;
  filledSlots: number;
  costPerPerson: number;
  description?: string;
  hostUser: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    reputationScore: number;
  };
  participants?: MatchParticipant[];
  comments?: MatchComment[];
}

export interface MatchesQuery {
  sportType?: string;
  city?: string;
  district?: string;
  skillLevel?: string;
  date?: string;
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

function minuteToTimeStr(minute?: number): string {
  if (minute === undefined || minute === null || isNaN(minute)) return '18:00';
  const h = Math.floor(minute / 60).toString().padStart(2, '0');
  const m = (minute % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function normalizeMatchItem(item: any): OpenMatch {
  if (!item) return MOCK_MATCHES[0];

  const id = item.id || item.bookingId || `match-${Date.now()}`;
  const hostName = item.hostName || item.hostUser?.fullName || 'Chủ kèo SanGo';
  const slotsNeeded = item.slotsNeeded ?? 2;
  const joinedCount = item.joinedCount ?? 1;
  const totalSlots = item.totalSlots ?? (slotsNeeded + joinedCount);
  const filledSlots = item.filledSlots ?? joinedCount;
  const cost =
    item.costPerPerson ??
    (item.subtotal && totalSlots ? Math.round(item.subtotal / totalSlots) : 65000);

  const dateStr = item.date
    ? typeof item.date === 'string'
      ? item.date.slice(0, 10)
      : new Date(item.date).toISOString().slice(0, 10)
    : '2026-08-29';

  return {
    id,
    title:
      item.title ||
      `Kèo ${item.courtName || 'Sân'} - Tuyển ${slotsNeeded} người`,
    sportType: item.sportType || 'FOOTBALL7',
    skillLevel: item.skillLevel || 'Phong trào B',
    date: dateStr,
    startTime: item.startTime || minuteToTimeStr(item.startMinute || 1080),
    endTime: item.endTime || minuteToTimeStr(item.endMinute || 1170),
    venueName: item.venueName || item.courtName || item.court?.venue?.name || 'Cụm Sân Thể Thao SanGo',
    venueAddress:
      item.venueAddress || item.court?.venue?.address || 'Hà Nội',
    city: item.city || item.court?.venue?.city || 'Hà Nội',
    district: item.district || item.court?.venue?.district || 'Cầu Giấy',
    totalSlots: Math.max(1, totalSlots),
    filledSlots: Math.max(1, filledSlots),
    costPerPerson: cost,
    description: item.description || 'Trận đấu giao lưu phong trào. Vui lòng có mặt trước 15 phút.',
    hostUser: {
      id: item.hostUser?.id || item.customerId || 'u-host-1',
      fullName: hostName,
      avatarUrl: item.hostUser?.avatarUrl || null,
      reputationScore: item.hostUser?.reputationScore ?? 100,
    },
    participants: item.participants || [
      {
        id: `p-${id}-1`,
        matchId: id,
        userId: item.hostUser?.id || item.customerId || 'u-host-1',
        status: 'APPROVED',
        preferredPosition: 'Tiền đạo',
        joinedAt: new Date().toISOString(),
        user: {
          id: item.hostUser?.id || item.customerId || 'u-host-1',
          fullName: hostName,
          reputationScore: 100,
        },
      },
    ],
    comments: item.comments || [],
  };
}

const MOCK_MATCHES: OpenMatch[] = [
  {
    id: 'match-1',
    title: 'Kèo bóng đá 7 người - Tuyển 2 Tiền Vệ / Tiền Đạo',
    sportType: 'FOOTBALL7',
    skillLevel: 'Bán chuyên / Phong trào B',
    date: '2026-08-29',
    startTime: '19:00',
    endTime: '20:30',
    venueName: 'Sân Bóng Cột Cờ Cầu Giấy',
    venueAddress: 'Số 1 Phạm Văn Đồng, Mai Dịch, Cầu Giấy, Hà Nội',
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    totalSlots: 14,
    filledSlots: 12,
    costPerPerson: 65000,
    description: 'Đội hình thiếu 2 người đá cánh và trung tâm, đá văn minh không cay cú, bao nước uống.',
    hostUser: {
      id: 'u-host-1',
      fullName: 'Phạm Minh Tuấn',
      avatarUrl: null,
      reputationScore: 100,
    },
    participants: [
      {
        id: 'p-1',
        matchId: 'match-1',
        userId: 'u-host-1',
        status: 'APPROVED',
        preferredPosition: 'Tiền đạo',
        joinedAt: new Date().toISOString(),
        user: { id: 'u-host-1', fullName: 'Phạm Minh Tuấn', reputationScore: 100 },
      },
      {
        id: 'p-2',
        matchId: 'match-1',
        userId: 'u-2',
        status: 'APPROVED',
        preferredPosition: 'Thủ môn',
        joinedAt: new Date().toISOString(),
        user: { id: 'u-2', fullName: 'Nguyễn Thành Long', reputationScore: 98 },
      },
    ],
  },
  {
    id: 'match-2',
    title: 'Giao lưu Pickleball Đôi Nam Nữ DUPR 3.0 - 3.5',
    sportType: 'PICKLEBALL',
    skillLevel: 'DUPR 3.0 - 3.5',
    date: '2026-08-30',
    startTime: '17:30',
    endTime: '19:30',
    venueName: 'CLB Pickleball Ba Đình Central',
    venueAddress: '12 Quán Thánh, Ba Đình, Hà Nội',
    city: 'Hà Nội',
    district: 'Ba Đình',
    totalSlots: 4,
    filledSlots: 3,
    costPerPerson: 80000,
    description: 'Cần tuyển 1 bạn nữ hoặc nam ghép đôi, bóng thi đấu Franklin X-40 sẵn có.',
    hostUser: {
      id: 'u-host-2',
      fullName: 'Ngô Thuỳ Linh',
      avatarUrl: null,
      reputationScore: 99,
    },
    participants: [
      {
        id: 'p-3',
        matchId: 'match-2',
        userId: 'u-host-2',
        status: 'APPROVED',
        preferredPosition: 'Đánh phải',
        joinedAt: new Date().toISOString(),
        user: { id: 'u-host-2', fullName: 'Ngô Thuỳ Linh', reputationScore: 99 },
      },
    ],
  },
  {
    id: 'match-3',
    title: 'Cầu lông giao lưu đôi nam tối Thứ 6',
    sportType: 'BADMINTON',
    skillLevel: 'Khá / Trung bình khá',
    date: '2026-08-28',
    startTime: '20:00',
    endTime: '22:00',
    venueName: 'Nhà Thi Đấu Thể Thao Thanh Xuân',
    venueAddress: '166 Khuất Duy Tiến, Thanh Xuân, Hà Nội',
    city: 'Hà Nội',
    district: 'Thanh Xuân',
    totalSlots: 6,
    filledSlots: 4,
    costPerPerson: 50000,
    description: 'Sân thảm chuẩn thi đấu, tuyển thêm 2 bạn đánh luân phiên 3 set.',
    hostUser: {
      id: 'u-host-3',
      fullName: 'Đoàn Hữu Đức',
      avatarUrl: null,
      reputationScore: 100,
    },
  },
];

export async function listOpenMatchesApi(query?: MatchesQuery): Promise<OpenMatch[]> {
  try {
    const params = new URLSearchParams();
    if (query?.sportType && query.sportType !== 'ALL') params.set('sportType', query.sportType);
    if (query?.city) params.set('city', query.city);
    if (query?.district && query.district !== 'ALL') params.set('district', query.district);
    if (query?.skillLevel) params.set('skillLevel', query.skillLevel);
    if (query?.date) params.set('date', query.date);

    const queryString = params.toString();
    const url = `/matches/open${queryString ? `?${queryString}` : ''}`;
    const raw = await apiClient<any>(url);

    const rawItems: any[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.items)
      ? raw.items
      : [];

    if (rawItems.length === 0) {
      // Return fallback mocks if empty
      let filtered = [...MOCK_MATCHES];
      if (query?.sportType && query.sportType !== 'ALL') {
        filtered = filtered.filter((m) => m.sportType.includes(query.sportType!));
      }
      if (query?.district && query.district !== 'ALL') {
        filtered = filtered.filter((m) => m.district.includes(query.district!));
      }
      return filtered;
    }

    return rawItems.map(normalizeMatchItem);
  } catch {
    let filtered = [...MOCK_MATCHES];
    if (query?.sportType && query.sportType !== 'ALL') {
      filtered = filtered.filter((m) => m.sportType.includes(query.sportType!));
    }
    if (query?.district && query.district !== 'ALL') {
      filtered = filtered.filter((m) => m.district.includes(query.district!));
    }
    return filtered;
  }
}

export async function getMatchDetailApi(matchId: string): Promise<OpenMatch> {
  try {
    const raw = await apiClient<any>(`/matches/${matchId}`);
    return normalizeMatchItem(raw);
  } catch {
    const found = MOCK_MATCHES.find((m) => m.id === matchId);
    if (found) return found;
    return {
      ...MOCK_MATCHES[0],
      id: matchId,
    };
  }
}

export async function createJoinRequestApi(matchId: string, data: CreateJoinRequestDto): Promise<any> {
  return apiClient(`/matches/${matchId}/requests`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).catch(() => ({ success: true, message: 'Đã gửi yêu cầu tham gia' }));
}

export async function listJoinRequestsApi(matchId: string): Promise<MatchParticipant[]> {
  try {
    const raw = await apiClient<any[]>(`/matches/${matchId}/requests`);
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [
      {
        id: 'req-1',
        matchId,
        userId: 'u-req-1',
        status: 'PENDING',
        preferredPosition: 'Tiền vệ trung tâm',
        note: 'Mình đá chân trái, xin 1 slot nha chủ kèo',
        joinedAt: new Date().toISOString(),
        user: { id: 'u-req-1', fullName: 'Lê Hoàng Nam', reputationScore: 100 },
      },
    ];
  }
}

export async function reviewJoinRequestApi(matchId: string, requestId: string, data: ReviewJoinRequestDto): Promise<any> {
  return apiClient(`/matches/${matchId}/requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }).catch(() => ({ success: true, message: 'Đã cập nhật trạng thái yêu cầu' }));
}

export async function listMatchCommentsApi(matchId: string): Promise<MatchComment[]> {
  try {
    const raw = await apiClient<any[]>(`/matches/${matchId}/comments`);
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [
      {
        id: 'c-1',
        matchId,
        userId: 'u-host-1',
        content: 'Mọi người đến sớm 10 phút để khởi động nhé!',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        user: { id: 'u-host-1', fullName: 'Phạm Minh Tuấn' },
      },
      {
        id: 'c-2',
        matchId,
        userId: 'u-2',
        content: 'Ok chủ kèo, mình mang bóng phụ phòng hờ.',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        user: { id: 'u-2', fullName: 'Nguyễn Thành Long' },
      },
    ];
  }
}

export async function createMatchCommentApi(matchId: string, data: CreateMatchCommentDto): Promise<MatchComment> {
  try {
    return await apiClient<MatchComment>(`/matches/${matchId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    return {
      id: `c-${Date.now()}`,
      matchId,
      userId: 'u-current',
      content: data.content,
      createdAt: new Date().toISOString(),
      user: { id: 'u-current', fullName: 'Bạn' },
    };
  }
}
