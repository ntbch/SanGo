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
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string | null;
  ownerId?: string;
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
    status?: 'ACTIVE' | 'MAINTENANCE';
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
    status: 'APPROVED',
    ownerId: 'u-owner',
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
    status: 'PENDING',
    ownerId: 'u-owner',
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
    status: 'REJECTED',
    rejectReason: 'Ảnh chưa rõ mặt sân, vui lòng bổ sung tối thiểu 3 ảnh thật.',
    ownerId: 'u-owner',
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

/** Map venue mock -> phản hồi listMine của owner (kèm _count.courts). */
function toOwnerVenue(venue: MockVenue): Record<string, unknown> {
  return {
    ...venue,
    status: venue.status ?? 'APPROVED',
    depositPercent: venue.depositPercent,
    rejectReason: venue.rejectReason ?? null,
    createdAt: new Date().toISOString(),
    _count: { courts: venue.courts.length },
  };
}

/** Map venue mock -> item hàng chờ admin. */
interface AdminVenueRow extends MockVenue {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  _count: { courts: number };
}

function toAdminVenue(venue: MockVenue): AdminVenueRow {
  return {
    ...venue,
    status: venue.status ?? 'APPROVED',
    createdAt: new Date().toISOString(),
    _count: { courts: venue.courts.length },
  };
}

/** Bảng giá REPLACE-ALL theo court — bộ nhớ tạm của mock. */
const MOCK_PRICING = new Map<
  string,
  Array<{
    dayType: 'WEEKDAY' | 'WEEKEND';
    startMinute: number;
    endMinute: number;
    pricePerSlot: number;
  }>
>();

interface MockOwnerBooking {
  id: string;
  code: string;
  venueId: string;
  courtName: string;
  customerName: string;
  date: string;
  startMinute: number;
  endMinute: number;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  amountPaid: number;
}

/** Đơn mẫu hôm nay — deterministic để test ổn định. */
let MOCK_BOOKINGS_CACHE: MockOwnerBooking[] | null = null;
function today(): string {
  const now = new Date();
  return (
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(now.getDate()).padStart(2, '0')
  );
}
function mockOwnerBookings(): MockOwnerBooking[] {
  if (MOCK_BOOKINGS_CACHE !== null) return MOCK_BOOKINGS_CACHE;
  const date = today();
  MOCK_BOOKINGS_CACHE = [
    {
      id: 'b-1',
      code: 'CH-' + date.replace(/-/g, '') + '-0001',
      venueId: 'v-1',
      courtName: 'Sân 1',
      customerName: 'Minh T.',
      date,
      startMinute: 360,
      endMinute: 420,
      status: 'CONFIRMED',
      amountPaid: 36000,
    },
    {
      id: 'b-2',
      code: 'CH-' + date.replace(/-/g, '') + '-0002',
      venueId: 'v-1',
      courtName: 'Sân 2',
      customerName: 'Lan H.',
      date,
      startMinute: 540,
      endMinute: 600,
      status: 'CONFIRMED',
      amountPaid: 36000,
    },
    {
      id: 'b-3',
      code: 'CH-' + date.replace(/-/g, '') + '-0003',
      venueId: 'v-2',
      courtName: 'Sân A1',
      customerName: 'Hoàng N.',
      date,
      startMinute: 660,
      endMinute: 720,
      status: 'CHECKED_IN',
      amountPaid: 90000,
    },
    {
      id: 'b-4',
      code: 'CH-' + date.replace(/-/g, '') + '-0004',
      venueId: 'v-2',
      courtName: 'Sân Pickle',
      customerName: 'Phúc D.',
      date,
      startMinute: 780,
      endMinute: 840,
      status: 'PENDING_PAYMENT',
      amountPaid: 0,
    },
    {
      id: 'b-5',
      code: 'CH-' + date.replace(/-/g, '') + '-0005',
      venueId: 'v-1',
      courtName: 'Sân 3',
      customerName: 'Tuấn K.',
      date,
      startMinute: 900,
      endMinute: 990,
      status: 'COMPLETED',
      amountPaid: 400000,
    },
  ];
  return MOCK_BOOKINGS_CACHE;
}

export async function handleMockRequest<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  await delay(MOCK_LATENCY_MS);

  const route = method + ' ' + path;

  const payload = (typeof body === 'object' && body !== null ? body : {}) as Record<
    string,
    unknown
  >;

  // ===================== OWNER / ADMIN mock (t10) =====================
  const [rawPath0, rawQuery0 = ''] = path.split('?');
  const search0 = new URLSearchParams(rawQuery0);

  // GET /venues/mine — sân của owner đăng nhập (mọi trạng thái).
  if (method === 'GET' && rawPath0 === '/venues/mine') {
    const page = Math.max(1, Number(search0.get('page') ?? '1') || 1);
    const limit = Math.max(1, Number(search0.get('limit') ?? '20') || 20);
    const rows = MOCK_VENUES.map((venue) => ({ ...toOwnerVenue(venue) }));
    return {
      items: rows.slice((page - 1) * limit, page * limit),
      total: rows.length,
      page,
      limit,
      pages: Math.max(1, Math.ceil(rows.length / limit)),
    } as T;
  }

  // CRUD venue của owner.
  if (method === 'POST' && rawPath0 === '/venues') {
    const now = Date.now();
    const created: MockVenue = {
      id: 'v-' + now.toString(36),
      status: 'PENDING',
      ownerId: 'u-owner',
      name: requireString(payload, 'name'),
      slug: requireString(payload, 'slug') || 'san-' + now.toString(36),
      address: requireString(payload, 'address'),
      lat: typeof payload.lat === 'number' ? payload.lat : 10.78,
      lng: typeof payload.lng === 'number' ? payload.lng : 106.7,
      images: Array.isArray(payload.images) ? (payload.images as string[]) : [],
      amenities: Array.isArray(payload.amenities) ? (payload.amenities as string[]) : [],
      depositPercent: typeof payload.depositPercent === 'number' ? payload.depositPercent : 30,
      openMinute: typeof payload.openMinute === 'number' ? payload.openMinute : 360,
      closeMinute: typeof payload.closeMinute === 'number' ? payload.closeMinute : 1380,
      courts: [],
      reviews: [],
    };
    MOCK_VENUES.unshift(created);
    return toOwnerVenue(created) as T;
  }
  if ((method === 'PUT' || method === 'DELETE') && rawPath0.startsWith('/venues/')) {
    const id = rawPath0.split('/')[2];
    const index = MOCK_VENUES.findIndex((venue) => venue.id === id);
    if (index === -1) throw new ApiError(404, 'Không tìm thấy sân', 'VENUE_NOT_FOUND');
    if (method === 'DELETE') {
      MOCK_VENUES.splice(index, 1);
      return { ok: true } as T;
    }
    Object.assign(MOCK_VENUES[index], payload);
    return toOwnerVenue(MOCK_VENUES[index]) as T;
  }

  // Sân con: GET/POST /venues/:venueId/courts + PUT/DELETE /courts/:id.
  if (method === 'GET' && /^\/venues\/[^/]+\/courts$/.test(rawPath0)) {
    const venueId = rawPath0.split('/')[2];
    const venue = MOCK_VENUES.find((item) => item.id === venueId || item.slug === venueId);
    if (venue === undefined) throw new ApiError(404, 'Không tìm thấy sân', 'VENUE_NOT_FOUND');
    return {
      items: venue.courts.map((court) => ({ ...court, status: (court.status ?? 'ACTIVE') as 'ACTIVE' | 'MAINTENANCE', venueId })),
    } as T;
  }
  if (method === 'POST' && /^\/venues\/[^/]+\/courts$/.test(rawPath0)) {
    const venueId = rawPath0.split('/')[2];
    const venue = MOCK_VENUES.find((item) => item.id === venueId);
    if (venue === undefined) throw new ApiError(404, 'Không tìm thấy sân', 'VENUE_NOT_FOUND');
    const court = {
      id: 'c-' + Date.now().toString(36),
      name: requireString(payload, 'name'),
      sportType: requireString(payload, 'sportType') || 'PICKLEBALL',
      slotMinutes: typeof payload.slotMinutes === 'number' ? payload.slotMinutes : 60,
      defaultPricePerSlot:
        typeof payload.defaultPricePerSlot === 'number' ? payload.defaultPricePerSlot : 100000,
      status: (typeof payload.status === 'string' ? payload.status : 'ACTIVE') as
        'ACTIVE' | 'MAINTENANCE',
    };
    venue.courts.push(court);
    return court as T;
  }
  if ((method === 'PUT' || method === 'DELETE') && /^\/courts\/[^/]+$/.test(rawPath0)) {
    const courtId = rawPath0.split('/')[2];
    for (const venue of MOCK_VENUES) {
      const index = venue.courts.findIndex((court) => court.id === courtId);
      if (index !== -1) {
        if (method === 'DELETE') {
          venue.courts.splice(index, 1);
          return { ok: true } as T;
        }
        venue.courts[index] = {
          ...venue.courts[index],
          ...payload,
        } as (typeof venue.courts)[number];
        return venue.courts[index] as T;
      }
    }
    throw new ApiError(404, 'Không tìm thấy sân con', 'COURT_NOT_FOUND');
  }

  // Bảng giá REPLACE-ALL theo court.
  if (rawPath0.startsWith('/courts/') && rawPath0.endsWith('/pricing-rules')) {
    const courtId = rawPath0.split('/')[2];
    if (method === 'GET') return { rules: MOCK_PRICING.get(courtId) ?? [] } as T;
    if (method === 'PUT' && Array.isArray(payload.rules)) {
      MOCK_PRICING.set(courtId, payload.rules as never);
      return { rules: payload.rules } as T;
    }
  }

  // Đơn hàng owner: lọc theo venueId/date/status.
  if (method === 'GET' && rawPath0 === '/owner/bookings') {
    let rows = mockOwnerBookings();
    const venueFilter = search0.get('venueId');
    const dateFilter = search0.get('date');
    const statusFilter = search0.get('status');
    if (venueFilter) rows = rows.filter((row) => row.venueId === venueFilter);
    if (dateFilter) rows = rows.filter((row) => row.date === dateFilter);
    if (statusFilter) rows = rows.filter((row) => row.status === statusFilter);
    return { items: rows, total: rows.length, page: 1, limit: 50, pages: 1 } as T;
  }
  if (method === 'POST' && rawPath0 === '/bookings/check-in') {
    const code = requireString(payload, 'code').trim().toUpperCase();
    const row = mockOwnerBookings().find((item) => item.code.toUpperCase() === code);
    if (row === undefined || row.status !== 'CONFIRMED') {
      throw new ApiError(
        404,
        'Mã đơn không hợp lệ hoặc không ở trạng thái chờ check-in.',
        'INVALID_CHECKIN_CODE',
      );
    }
    row.status = 'CHECKED_IN';
    return row as T;
  }
  if (method === 'POST' && /^\/bookings\/[^/]+\/no-show$/.test(rawPath0)) {
    const id = rawPath0.split('/')[2];
    const row = mockOwnerBookings().find((item) => item.id === id);
    if (row === undefined) throw new ApiError(404, 'Không tìm thấy đơn', 'BOOKING_NOT_FOUND');
    row.status = 'NO_SHOW';
    return row as T;
  }
  if (method === 'DELETE' && /^\/bookings\/[^/]+$/.test(rawPath0)) {
    const id = rawPath0.split('/')[2];
    const row = mockOwnerBookings().find((item) => item.id === id);
    if (row === undefined) throw new ApiError(404, 'Không tìm thấy đơn', 'BOOKING_NOT_FOUND');
    row.status = 'CANCELLED';
    return { ok: true } as T;
  }

  // Admin: hàng chờ duyệt.
  if (method === 'GET' && rawPath0 === '/admin/venues') {
    const status = search0.get('status');
    const q = (search0.get('q') ?? '').trim().toLowerCase();
    let rows: AdminVenueRow[] = MOCK_VENUES.map((venue) => toAdminVenue(venue));
    if (status) rows = rows.filter((venue) => venue.status === status);
    if (q !== '') rows = rows.filter((venue) => venue.name.toLowerCase().includes(q));
    return { items: rows, total: rows.length } as T;
  }
  if (method === 'POST' && /^\/admin\/venues\/[^/]+\/(approve|reject)$/.test(rawPath0)) {
    const id = rawPath0.split('/')[3];
    const venue = MOCK_VENUES.find((item) => item.id === id);
    if (venue === undefined) throw new ApiError(404, 'Không tìm thấy sân', 'VENUE_NOT_FOUND');
    if (rawPath0.endsWith('/approve')) venue.status = 'APPROVED';
    else {
      venue.status = 'REJECTED';
      venue.rejectReason = requireString(payload, 'reason');
    }
    return toAdminVenue(venue) as T;
  }

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
