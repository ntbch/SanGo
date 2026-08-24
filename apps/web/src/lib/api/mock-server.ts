/**
 * API giả lập trong bộ nhớ — dùng khi chưa có backend thật (VITE_USE_MOCK=true).
 * Mô phỏng đúng hợp đồng REST của module auth (đặc tả §3.1) và shape lỗi
 * thống nhất { statusCode, message, code } để UI chạy đứng yên không lỗi.
 */
import { UserRole } from '@courthub/shared';

import { ApiError } from './api-error';
import { type AuthUser } from './types';

/** Độ trễ giả lập giúp trạng thái loading của UI nhìn thấy được. */
export const MOCK_LATENCY_MS = 150;

interface MockAccount extends AuthUser {
  password: string;
}

const accounts: MockAccount[] = [
  {
    id: 'u-customer-01',
    email: 'customer@courthub.vn',
    password: 'Courthub@2026',
    fullName: 'Nguyễn Văn Bình',
    phone: '0901234567',
    role: UserRole.CUSTOMER,
  },
  {
    id: 'u-owner-01',
    email: 'owner@courthub.vn',
    password: 'Courthub@2026',
    fullName: 'Trần Thị Cẩm Lan',
    phone: '0912345678',
    role: UserRole.OWNER,
  },
  {
    id: 'u-admin-01',
    email: 'admin@courthub.vn',
    password: 'Courthub@2026',
    fullName: 'Phạm Quốc Dũng',
    role: UserRole.ADMIN,
  },
];

/** Phiên đăng nhập hiện tại của mock — mô phỏng refresh cookie phía server. */
let sessionEmail: string | null = null;

/** Xoá phiên mock (dùng trong unit test để cách ly trạng thái giữa các case). */
export function resetMockSession(): void {
  sessionEmail = null;
}

function toAuthUser(account: MockAccount): AuthUser {
  return {
    id: account.id,
    email: account.email,
    fullName: account.fullName,
    ...(account.phone !== undefined ? { phone: account.phone } : {}),
    role: account.role,
  };
}

function makeAccessToken(email: string): string {
  return 'mock-access-' + btoa(email).replace(/=/g, '') + '-' + Date.now().toString(36);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requireString(payload: Record<string, unknown>, key: string): string {
  return typeof payload[key] === 'string' ? (payload[key] as string) : '';
}

/* ------------------------------------------------------------------ */
/* Dữ liệu sân public cho demo khi VITE_USE_MOCK — khớp shape phản hồi */
/* của backend t5 (venues.service.ts).                                 */
/* ------------------------------------------------------------------ */

interface MockVenue {
  id: string;
  name: string;
  slug: string;
  address: string;
  lat: number;
  lng: number;
  images: string[];
  amenities: string[];
  depositPercent: number;
  openMinute: number;
  closeMinute: number;
  ratingAvg?: number;
  ratingCount?: number;
  courts: Array<{
    id: string;
    name: string;
    sportType: string;
    slotMinutes: number;
    defaultPricePerSlot: number;
  }>;
  reviews: Array<{
    id: string;
    author: string;
    rating: number;
    comment?: string;
    createdAt: string;
  }>;
}

const img = (seed: string): string => `https://picsum.photos/seed/${seed}/800/450`;

export const MOCK_VENUES: MockVenue[] = [
  {
    id: 'v-1',
    name: 'Sân Pickleball Saigon',
    slug: 'san-pickleball-saigon',
    address: '12 Nguyễn Văn Bảo, P.4, Q. Gò Vấp, TP.HCM',
    lat: 10.8205,
    lng: 106.6894,
    images: [img('pickle-a'), img('pickle-b'), img('pickle-c')],
    amenities: ['Toilet', 'Ánh sáng', 'Trạm nước', 'Bãi xe'],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1380,
    ratingAvg: 4.8,
    ratingCount: 36,
    courts: [
      {
        id: 'c-1',
        name: 'Sân 1',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 120000,
      },
      {
        id: 'c-2',
        name: 'Sân 2',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 120000,
      },
      {
        id: 'c-3',
        name: 'Sân 3',
        sportType: 'FOOTBALL_5',
        slotMinutes: 90,
        defaultPricePerSlot: 400000,
      },
    ],
    reviews: [
      {
        id: 'rv-1',
        author: 'Minh T.',
        rating: 5,
        comment: 'Sân mới, bóng đẹp, staff thân thiện.',
        createdAt: '12/08/2026',
      },
      {
        id: 'rv-2',
        author: 'Lan H.',
        rating: 4,
        comment: 'Ánh sáng tốt nhưng cuối tuần đông.',
        createdAt: '02/08/2026',
      },
    ],
  },
  {
    id: 'v-2',
    name: 'Cụm Cầu lông Thủ Đức',
    slug: 'cum-cau-long-thu-duc',
    address: '456 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP.HCM',
    lat: 10.8539,
    lng: 106.7614,
    images: [img('badminton-a'), img('badminton-b')],
    amenities: ['Toilet', 'Phòng tắm', 'Nước uống miễn phí'],
    depositPercent: 30,
    openMinute: 300,
    closeMinute: 1410,
    ratingAvg: 4.6,
    ratingCount: 21,
    courts: [
      {
        id: 'c-4',
        name: 'Sân A1',
        sportType: 'BADMINTON',
        slotMinutes: 60,
        defaultPricePerSlot: 90000,
      },
      {
        id: 'c-5',
        name: 'Sân A2',
        sportType: 'BADMINTON',
        slotMinutes: 60,
        defaultPricePerSlot: 90000,
      },
      {
        id: 'c-6',
        name: 'Sân Pickle',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 100000,
      },
    ],
    reviews: [
      {
        id: 'rv-3',
        author: 'Hoàng N.',
        rating: 5,
        comment: 'Sàn BWF chuẩn, giá hợp lý.',
        createdAt: '19/08/2026',
      },
    ],
  },
  {
    id: 'v-3',
    name: 'Tennis Bình Thạnh',
    slug: 'tennis-binh-thanh',
    address: '78 Ngo Sĩ Liên, P.11, Q. Bình Thạnh, TP.HCM',
    lat: 10.8017,
    lng: 106.7066,
    images: [img('tennis-a'), img('tennis-b'), img('tennis-c'), img('tennis-d')],
    amenities: ['Toilet', 'Ánh sáng LED', 'Bãi xe'],
    depositPercent: 50,
    openMinute: 330,
    closeMinute: 1380,
    courts: [
      {
        id: 'c-7',
        name: 'Sân chính',
        sportType: 'TENNIS',
        slotMinutes: 90,
        defaultPricePerSlot: 350000,
      },
    ],
    reviews: [],
  },
];

export async function handleMockRequest<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  await delay(MOCK_LATENCY_MS);

  // GET /venues, /venues/:slugOrId và /venues/:slugOrId/reviews — mock public.
  if (
    method === 'GET' &&
    (path === '/venues' || path.startsWith('/venues?') || path.startsWith('/venues/'))
  ) {
    const [rawPath, rawQuery = ''] = path.split('?');
    const search = new URLSearchParams(rawQuery);
    if (rawPath === '/venues') {
      const q = (search.get('q') ?? '').trim().toLowerCase();
      const sportType = search.get('sportType');
      const page = Math.max(1, Number(search.get('page') ?? '1') || 1);
      const limit = Math.max(1, Number(search.get('limit') ?? '9') || 9);
      const filtered = MOCK_VENUES.filter((venue) => {
        const matchQ =
          q === '' ||
          venue.name.toLowerCase().includes(q) ||
          venue.address.toLowerCase().includes(q);
        const matchSport =
          sportType === null ||
          sportType === '' ||
          venue.courts.some((court) => court.sportType === sportType);
        return matchQ && matchSport;
      });
      const start = (page - 1) * limit;
      return {
        items: filtered.slice(start, start + limit),
        total: filtered.length,
        page,
        limit,
        pages: Math.max(1, Math.ceil(filtered.length / limit)),
      } as T;
    }
    const segments = rawPath.split('/').filter((segment) => segment !== '');
    // segments: ['venues', slugOrId, ('reviews')?]
    const slugOrId = segments[1];
    const venue = MOCK_VENUES.find((item) => item.slug === slugOrId || item.id === slugOrId);
    if (venue === undefined) {
      throw new ApiError(404, 'Không tìm thấy sân', 'VENUE_NOT_FOUND');
    }
    if (segments[2] === 'reviews') {
      const pageNum = Math.max(1, Number(search.get('page') ?? '1') || 1);
      const size = Math.max(1, Number(search.get('size') ?? '5') || 5);
      const start = (pageNum - 1) * size;
      return {
        items: venue.reviews.slice(start, start + size),
        total: venue.reviews.length,
        page: pageNum,
        size,
        pages: Math.max(1, Math.ceil(venue.reviews.length / size)),
      } as T;
    }
    return venue as T;
  }

  const payload = (typeof body === 'object' && body !== null ? body : {}) as Record<
    string,
    unknown
  >;
  const route = method + ' ' + path;

  switch (route) {
    case 'POST /auth/login': {
      const email = requireString(payload, 'email').trim().toLowerCase();
      const password = requireString(payload, 'password');
      const account = accounts.find((a) => a.email === email);
      if (!account || account.password !== password) {
        throw new ApiError(401, 'Email hoặc mật khẩu không đúng.', 'INVALID_CREDENTIALS');
      }
      sessionEmail = account.email;
      return { accessToken: makeAccessToken(account.email), user: toAuthUser(account) } as T;
    }

    case 'POST /auth/register': {
      const email = requireString(payload, 'email').trim().toLowerCase();
      const fullName = requireString(payload, 'fullName').trim();
      const password = requireString(payload, 'password');
      if (accounts.some((a) => a.email === email)) {
        throw new ApiError(409, 'Email này đã được sử dụng.', 'EMAIL_TAKEN');
      }
      const phone = requireString(payload, 'phone').trim();
      const account: MockAccount = {
        id: 'u-' + Date.now().toString(36),
        email,
        password,
        fullName,
        ...(phone !== '' ? { phone } : {}),
        role: UserRole.CUSTOMER,
      };
      accounts.push(account);
      return { accessToken: makeAccessToken(email), user: toAuthUser(account) } as T;
    }

    case 'POST /auth/forgot-password': {
      // Mock luôn trả thành công để không lộ email nào tồn tại (giống backend thật).
      return {
        message: 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.',
      } as T;
    }

    case 'POST /auth/refresh': {
      const current = sessionEmail ? accounts.find((a) => a.email === sessionEmail) : undefined;
      if (!current) {
        throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.', 'SESSION_EXPIRED');
      }
      return { accessToken: makeAccessToken(current.email), user: toAuthUser(current) } as T;
    }

    case 'POST /auth/logout': {
      sessionEmail = null;
      return { ok: true } as T;
    }

    default:
      throw new ApiError(404, 'Chưa có API mock cho ' + route + '.', 'MOCK_NOT_FOUND');
  }
}
