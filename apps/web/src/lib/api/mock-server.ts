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
  /** Ghép trận mở (§3.11). */
  isPublicMatch?: boolean;
  slotsNeeded?: number | null;
  matchFull?: boolean;
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
      // §3.11: đơn công khai đang tìm người ghép (badge + modal chủ đơn).
      isPublicMatch: true,
      slotsNeeded: 4,
      matchFull: false,
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

/* ------------------------------------------------------------------ */
/* Thống kê owner (§3.10): sinh chuỗi ngày deterministic từ seed       */
/* venueId+days — cùng phiên luôn trả cùng số liệu, test ổn định.      */
/* ------------------------------------------------------------------ */

/** PRNG mulberry32 khởi tạo từ chuỗi — không phụ thuộc thứ tự gọi. */
function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ngày địa phương cách hôm nay n ngày, định dạng YYYY-MM-DD. */
function isoDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

interface MockAnalyticsPayload {
  meta: { venueId: string; venueName: string; days: number; from: string; to: string };
  summary: {
    revenueConfirmed: number;
    totalBookings: number;
    cancelledCount: number;
    noShowCount: number;
    cancelRate: number;
  };
  series: Array<{ date: string; bookings: number; revenue: number }>;
  topCourts: Array<{ courtId: string; courtName: string; bookings: number; revenue: number }>;
}

/** Cache theo 'venueId:days' để nhiều lần gọi trong phiên nhất quán. */
const MOCK_ANALYTICS = new Map<string, MockAnalyticsPayload>();

function buildMockAnalytics(venueId: string, days: number): MockAnalyticsPayload | null {
  const venue = MOCK_VENUES.find((item) => item.id === venueId);
  if (venue === undefined) return null;
  const cacheKey = venueId + ':' + String(days);
  const cached = MOCK_ANALYTICS.get(cacheKey);
  if (cached !== undefined) return cached;

  const rand = seededRandom(cacheKey);
  const series: MockAnalyticsPayload['series'] = [];
  let totalBookings = 0;
  let totalRevenue = 0;
  for (let i = days - 1; i >= 0; i--) {
    const date = isoDaysAgo(i);
    const weekday = new Date(date + 'T00:00:00').getDay();
    const weekend = weekday === 0 || weekday === 6;
    // Cuối tuần cao hơn + dao động dài hạn + nhiễu ngẫu nhiên ổn định.
    const wave = Math.sin((days - i) / 4.5) * 0.5 + 0.5;
    const base = weekend ? 6 : 4;
    const bookings = Math.max(0, Math.round(base * (0.5 + rand()) * (0.55 + wave * 0.9)));
    const avgPrice = 90000 + Math.floor(rand() * 5) * 30000; // 90k..210k/slot
    const revenue = bookings * avgPrice;
    totalBookings += bookings;
    totalRevenue += revenue;
    series.push({ date, bookings, revenue });
  }

  const cancelledCount = Math.round(totalBookings * (0.05 + rand() * 0.06));
  const noShowCount = Math.round(totalBookings * (0.01 + rand() * 0.03));
  const combined = totalBookings > 0 ? cancelledCount + noShowCount : 0;

  // Chia đều có trọng số cho các sân con; giữ đúng tổng để khớp summary.
  const courts =
    venue.courts.length > 0
      ? venue.courts.map((court) => ({ id: court.id, name: court.name }))
      : [{ id: venueId + '-main', name: 'Sân chính' }];
  const weights = courts.map(() => 0.4 + rand());
  const weightSum = weights.reduce((acc, value) => acc + value, 0);
  let leftBookings = totalBookings;
  let leftRevenue = totalRevenue;
  const ranked = courts.map((court, index) => {
    const isLast = index === courts.length - 1;
    const bookings = isLast
      ? leftBookings
      : Math.round((totalBookings * weights[index]) / weightSum);
    const revenue = isLast ? leftRevenue : Math.round((totalRevenue * weights[index]) / weightSum);
    leftBookings -= bookings;
    leftRevenue -= revenue;
    return { courtId: court.id, courtName: court.name, bookings, revenue };
  });
  ranked.sort(
    (a, b) =>
      b.bookings - a.bookings || b.revenue - a.revenue || a.courtName.localeCompare(b.courtName),
  );

  const payload: MockAnalyticsPayload = {
    meta: {
      venueId,
      venueName: venue.name,
      days,
      from: series[0]?.date ?? isoDaysAgo(days - 1),
      to: today(),
    },
    summary: {
      revenueConfirmed: totalRevenue,
      totalBookings,
      cancelledCount,
      noShowCount,
      cancelRate: totalBookings > 0 ? Math.round((combined / totalBookings) * 10000) / 10000 : 0,
    },
    series,
    topCourts: ranked.filter((row) => row.bookings > 0),
  };
  MOCK_ANALYTICS.set(cacheKey, payload);
  return payload;
}

/* ------------------------------------------------------------------ */
/* Ghép trận mở (§3.11): dữ liệu mẫu + trạng thái tham gia theo phiên. */
/* ------------------------------------------------------------------ */

interface MockOpenMatch {
  bookingId: string;
  code: string;
  courtName: string;
  sportType: 'FOOTBALL5' | 'FOOTBALL7' | 'PICKLEBALL' | 'BADMINTON' | 'TENNIS';
  date: string;
  startMinute: number;
  endMinute: number;
  subtotal: number;
  depositAmount: number;
  hostName: string;
  slotsNeeded: number;
  /** Số người đã tham gia ban đầu; tăng/giảm khi join/leave trong phiên. */
  joinedCount: number;
}

function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

/** Danh sách trận mở mẫu — deterministic, đủ nhiều loại sân để test filter. */
const MOCK_OPEN_MATCHES: MockOpenMatch[] = [
  {
    bookingId: 'om-1',
    code: 'CH-' + today().replace(/-/g, '') + '-0090',
    courtName: 'Sân Pickleball Saigon · Sân 1',
    sportType: 'PICKLEBALL',
    date: futureDate(1),
    startMinute: 1080,
    endMinute: 1200,
    subtotal: 480000,
    depositAmount: 144000,
    hostName: 'Trần Thị Cẩm Lan',
    slotsNeeded: 4,
    joinedCount: 2,
  },
  {
    bookingId: 'om-2',
    code: 'CH-' + today().replace(/-/g, '') + '-0091',
    courtName: 'Cụm Cầu lông Thủ Đức · Sân A1',
    sportType: 'BADMINTON',
    date: futureDate(2),
    startMinute: 1080,
    endMinute: 1170,
    subtotal: 360000,
    depositAmount: 108000,
    hostName: 'Lê Quốc Hoàng',
    slotsNeeded: 3,
    joinedCount: 1,
  },
  {
    bookingId: 'om-3',
    code: 'CH-' + today().replace(/-/g, '') + '-0092',
    courtName: 'Sân Bóng Đá Gò Vấp · Sân 5',
    sportType: 'FOOTBALL5',
    date: futureDate(3),
    startMinute: 1020,
    endMinute: 1110,
    subtotal: 900000,
    depositAmount: 270000,
    hostName: 'Phạm Quốc Dũng',
    slotsNeeded: 9,
    joinedCount: 5,
  },
];

/** bookingId đã được người dùng hiện tại tham gia (demo một người dùng). */
const MOCK_JOINED = new Set<string>();

interface MockHoldStore {
  id: string;
  courtId: string;
  courtName: string;
  venueName: string;
  date: string;
  slots: Array<{ startMinute: number; endMinute: number }>;
  subtotal: number;
  depositPercent: number;
  expiresAt: string;
  /** Ghép trận mở (§3.11) — giữ lựa chọn để hiển thị lại ở checkout. */
  isPublicMatch?: boolean;
  slotsNeeded?: number | null;
}

const MOCK_HOLDS = new Map<string, MockHoldStore>();

interface MockCustomerBookingItem {
  id: string;
  code: string;
  venueId: string;
  venueName: string;
  courtName: string;
  sportType: string;
  date: string;
  startMinute: number;
  endMinute: number;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  amountPaid: number;
  totalPrice: number;
  paymentType: 'DEPOSIT' | 'FULL';
  depositPercent: number;
  hasReviewed?: boolean;
  review?: { rating: number; comment?: string };
  createdAt: string;
  /** Ghép trận mở (§3.11). */
  isPublicMatch?: boolean;
  slotsNeeded?: number | null;
  matchFull?: boolean;
}

const MOCK_CUSTOMER_BOOKINGS: MockCustomerBookingItem[] = [
  {
    id: 'cb-1',
    code: 'CH-20260828-0001',
    venueId: 'v-1',
    venueName: 'Sân Pickleball Saigon',
    courtName: 'Sân 1',
    sportType: 'PICKLEBALL',
    date: '2026-08-28',
    startMinute: 1080,
    endMinute: 1200,
    status: 'CONFIRMED',
    amountPaid: 72000,
    totalPrice: 240000,
    paymentType: 'DEPOSIT',
    depositPercent: 30,
    // §3.11: đơn công khai đang tìm người ghép.
    isPublicMatch: true,
    slotsNeeded: 4,
    matchFull: false,
    createdAt: '2026-08-24T10:00:00.000Z',
  },
  {
    id: 'cb-2',
    code: 'CH-20260820-0002',
    venueId: 'v-2',
    venueName: 'Cụm Cầu lông Thủ Đức',
    courtName: 'Sân A1',
    sportType: 'BADMINTON',
    date: '2026-08-20',
    startMinute: 360,
    endMinute: 480,
    status: 'COMPLETED',
    amountPaid: 180000,
    totalPrice: 180000,
    paymentType: 'FULL',
    depositPercent: 30,
    hasReviewed: true,
    review: { rating: 5, comment: 'Sân rất thoáng mát, sàn BWF chuẩn thi đấu.' },
    createdAt: '2026-08-19T08:00:00.000Z',
  },
];

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

  const [rawPath0, rawQuery0 = ''] = path.split('?');
  const search0 = new URLSearchParams(rawQuery0);

  // ===================== BOOKING & PAYMENTS mock (t11) =====================
  // 1. GET /courts/:courtId/slots?from=YYYY-MM-DD&days=7
  if (method === 'GET' && /^\/courts\/[^/]+\/slots/.test(rawPath0)) {
    const courtId = rawPath0.split('/')[2];
    const fromDate = search0.get('from') || new Date().toISOString().slice(0, 10);
    const [y, m, d] = fromDate.split('-').map(Number);
    const base = new Date(y, m - 1, d);

    // Tìm court và venue tương ứng
    let courtInfo = { slotMinutes: 60, defaultPricePerSlot: 120000 };
    for (const v of MOCK_VENUES) {
      const found = v.courts.find((c) => c.id === courtId);
      if (found) {
        courtInfo = found;
        break;
      }
    }

    const byDate = [];
    for (let i = 0; i < 7; i++) {
      const curr = new Date(base);
      curr.setDate(base.getDate() + i);
      const dateStr =
        curr.getFullYear() +
        '-' +
        String(curr.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(curr.getDate()).padStart(2, '0');

      const slots = [];
      for (
        let minute = 360;
        minute + courtInfo.slotMinutes <= 1380;
        minute += courtInfo.slotMinutes
      ) {
        // Giả lập trạng thái
        let state: 'AVAILABLE' | 'BOOKED' | 'HELD' | 'MAINTENANCE' | 'PAST' = 'AVAILABLE';
        if (i === 1 && minute === 540) state = 'BOOKED';
        if (i === 2 && minute === 660) state = 'HELD';
        if (i === 4 && minute === 780) state = 'MAINTENANCE';

        slots.push({
          startMinute: minute,
          endMinute: minute + courtInfo.slotMinutes,
          state,
          price: courtInfo.defaultPricePerSlot,
        });
      }
      byDate.push({ date: dateStr, slots });
    }

    return { courtId, byDate } as T;
  }

  // 2. POST /bookings/holds
  if (method === 'POST' && (rawPath0 === '/bookings/holds' || rawPath0 === '/bookings/hold')) {
    const courtId = requireString(payload, 'courtId');
    const date = requireString(payload, 'date');
    const slots = (Array.isArray(payload.slots) ? payload.slots : []) as Array<{
      startMinute: number;
      endMinute: number;
    }>;

    let venueName = 'Sân thể thao';
    let courtName = 'Sân 1';
    let slotPrice = 120000;
    let depositPercent = 30;

    for (const v of MOCK_VENUES) {
      const found = v.courts.find((c) => c.id === courtId);
      if (found) {
        venueName = v.name;
        courtName = found.name;
        slotPrice = found.defaultPricePerSlot;
        depositPercent = v.depositPercent;
        break;
      }
    }

    const holdId = 'h-' + Date.now().toString(36);
    const subtotal = slots.length * slotPrice;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const holdObj: MockHoldStore = {
      id: holdId,
      courtId,
      courtName,
      venueName,
      date,
      slots,
      subtotal,
      depositPercent,
      expiresAt,
      // §3.11: chỉ nhận khi bật công khai và slotsNeeded hợp lệ 1..10.
      ...(payload.isPublicMatch === true
        ? (() => {
            const needed = Number(payload.slotsNeeded);
            const valid = Number.isInteger(needed) && needed >= 1 && needed <= 10;
            if (!valid) {
              throw new ApiError(
                400,
                'slotsNeeded (1..10) là bắt buộc khi bật ghép trận mở',
                'SLOTS_NEEDED_INVALID',
              );
            }
            return { isPublicMatch: true, slotsNeeded: needed };
          })()
        : {}),
    };
    MOCK_HOLDS.set(holdId, holdObj);

    return holdObj as T;
  }

  // 3. GET /bookings/holds/:id
  if (method === 'GET' && rawPath0.startsWith('/bookings/holds/')) {
    const id = rawPath0.split('/')[3];
    const hold = MOCK_HOLDS.get(id);
    if (!hold) {
      // Fallback hold mẫu
      return {
        id,
        courtId: 'c-1',
        courtName: 'Sân 1',
        venueName: 'Sân Pickleball Saigon',
        date: '2026-08-28',
        slots: [{ startMinute: 1080, endMinute: 1200 }],
        subtotal: 240000,
        depositPercent: 30,
        expiresAt: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
      } as T;
    }
    return hold as T;
  }

  // 4. DELETE /bookings/holds/:id
  if (method === 'DELETE' && rawPath0.startsWith('/bookings/holds/')) {
    const id = rawPath0.split('/')[3];
    MOCK_HOLDS.delete(id);
    return { ok: true } as T;
  }

  // 5. POST /payments/checkout
  if (method === 'POST' && rawPath0 === '/payments/checkout') {
    const holdId = requireString(payload, 'holdId');
    const type = (payload.type as 'DEPOSIT' | 'FULL') || 'DEPOSIT';
    const hold = MOCK_HOLDS.get(holdId);

    const subtotal = hold?.subtotal ?? 240000;
    const depositPercent = hold?.depositPercent ?? 30;
    const amount = type === 'DEPOSIT' ? Math.round((subtotal * depositPercent) / 100) : subtotal;
    const txnRef = 'CH-' + Date.now().toString().slice(-8);

    // Tạo booking thành công trong mock
    const newBooking: MockCustomerBookingItem = {
      id: 'cb-' + Date.now().toString(36),
      code: txnRef,
      venueId: 'v-1',
      venueName: hold?.venueName ?? 'Sân Pickleball Saigon',
      courtName: hold?.courtName ?? 'Sân 1',
      sportType: 'PICKLEBALL',
      date: hold?.date ?? '2026-08-28',
      startMinute: hold?.slots[0]?.startMinute ?? 1080,
      endMinute: hold?.slots[hold?.slots.length - 1]?.endMinute ?? 1200,
      status: 'CONFIRMED',
      amountPaid: amount,
      totalPrice: subtotal,
      paymentType: type,
      depositPercent,
      createdAt: new Date().toISOString(),
    };
    MOCK_CUSTOMER_BOOKINGS.unshift(newBooking);

    return {
      txnRef,
      amount,
      type,
      mode: 'mock',
      paymentUrl: `/thanh-toan/ket-qua?status=SUCCESS&code=${txnRef}`,
      redirectUrl: `/thanh-toan/ket-qua?status=SUCCESS&code=${txnRef}`,
    } as T;
  }

  // 6. GET /bookings/me
  if (method === 'GET' && rawPath0 === '/bookings/me') {
    const filter = search0.get('filter') || 'upcoming';
    let filtered = [...MOCK_CUSTOMER_BOOKINGS];
    if (filter === 'upcoming') {
      filtered = filtered.filter((b) => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN');
    } else if (filter === 'history') {
      filtered = filtered.filter((b) => b.status === 'COMPLETED');
    } else if (filter === 'cancelled') {
      filtered = filtered.filter((b) => b.status === 'CANCELLED' || b.status === 'NO_SHOW');
    }
    return {
      items: filtered,
      total: filtered.length,
      page: 1,
      pages: 1,
    } as T;
  }

  // 7. GET /bookings/:id/refund-preview
  if (method === 'GET' && rawPath0.endsWith('/refund-preview')) {
    const id = rawPath0.split('/')[2];
    const b = MOCK_CUSTOMER_BOOKINGS.find((item) => item.id === id);
    const amountPaid = b?.amountPaid ?? 108000;
    return {
      refundPercent: 100,
      refundAmount: amountPaid,
      amountPaid,
      hoursUntilMatch: 48,
      policyDescription: 'Hủy trước giờ chơi >24h hoàn 100% số tiền đã cọc.',
    } as T;
  }

  // 8. POST /bookings/:id/review
  if (method === 'POST' && rawPath0.endsWith('/review')) {
    const id = rawPath0.split('/')[2];
    const b = MOCK_CUSTOMER_BOOKINGS.find((item) => item.id === id);
    if (b) {
      b.hasReviewed = true;
      b.review = {
        rating: typeof payload.rating === 'number' ? payload.rating : 5,
        comment: typeof payload.comment === 'string' ? payload.comment : '',
      };
    }
    return { ok: true } as T;
  }

  // ===================== OWNER / ADMIN mock (t10) =====================

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
      items: venue.courts.map((court) => ({
        ...court,
        status: (court.status ?? 'ACTIVE') as 'ACTIVE' | 'MAINTENANCE',
        venueId,
      })),
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
  // Thống kê owner (§3.10): venueId bắt buộc, days 1..90 (mặc định 30).
  if (method === 'GET' && rawPath0 === '/owner/analytics') {
    const venueId = search0.get('venueId') ?? '';
    const daysRaw = Number(search0.get('days') ?? '30');
    const days =
      Number.isFinite(daysRaw) && daysRaw >= 1 && daysRaw <= 90 ? Math.floor(daysRaw) : 30;
    if (venueId === '') {
      throw new ApiError(400, 'venueId là bắt buộc', 'VENUE_ID_REQUIRED');
    }
    const payload = buildMockAnalytics(venueId, days);
    if (payload === null) {
      throw new ApiError(404, 'Không tìm thấy sân', 'VENUE_NOT_FOUND');
    }
    return payload as T;
  }
  // Ghép trận mở (§3.11): danh sách public, lọc sportType/date, phân trang.
  if (method === 'GET' && rawPath0 === '/matches/open') {
    const sportType = search0.get('sportType');
    const date = search0.get('date');
    const page = Math.max(1, Number(search0.get('page') ?? '1') || 1);
    let rows = MOCK_OPEN_MATCHES.filter((m) => m.joinedCount < m.slotsNeeded);
    if (sportType) rows = rows.filter((m) => m.sportType === sportType);
    if (date) rows = rows.filter((m) => m.date === date);
    const limit = 12;
    const start = (page - 1) * limit;
    return {
      items: rows.slice(start, start + limit).map((m) => ({
        ...m,
        joinedCount: m.joinedCount + (MOCK_JOINED.has(m.bookingId) ? 1 : 0),
      })),
      total: rows.length,
      page,
      limit,
      pages: Math.max(1, Math.ceil(rows.length / limit)),
    } as T;
  }

  // Tham gia ghép trận: chặn trùng (409 ALREADY_JOINED) và đầy chỗ (409 MATCH_FULL).
  if (method === 'POST' && /^\/bookings\/[^/]+\/join$/.test(rawPath0)) {
    const bookingId = rawPath0.split('/')[2];
    const match = MOCK_OPEN_MATCHES.find((m) => m.bookingId === bookingId);
    if (match !== undefined) {
      if (MOCK_JOINED.has(bookingId)) {
        throw new ApiError(409, 'Bạn đã tham gia trận này rồi', 'ALREADY_JOINED');
      }
      if (match.joinedCount >= match.slotsNeeded) {
        throw new ApiError(409, 'Trận đã đủ người', 'MATCH_FULL');
      }
      MOCK_JOINED.add(bookingId);
      const joinedCount = match.joinedCount + 1;
      return {
        joinedCount,
        slotsNeeded: match.slotsNeeded,
        matchFull: joinedCount >= match.slotsNeeded,
      } as T;
    }
    throw new ApiError(404, 'Không tìm thấy đơn đặt', 'BOOKING_NOT_FOUND');
  }

  // Rời ghép trận.
  if (method === 'DELETE' && /^\/bookings\/[^/]+\/join$/.test(rawPath0)) {
    const bookingId = rawPath0.split('/')[2];
    const match = MOCK_OPEN_MATCHES.find((m) => m.bookingId === bookingId);
    if (!MOCK_JOINED.delete(bookingId)) {
      throw new ApiError(404, 'Bạn chưa tham gia trận này', 'NOT_JOINED');
    }
    const needed = match?.slotsNeeded ?? 0;
    // Rời ghép -> nếu đơn đang đầy sẽ tự mở lại chỗ trống (khớp service thật).
    void needed;
    return { left: true, bookingId, matchFull: false } as T;
  }

  // Danh sách người tham gia — demo trả tên mẫu cho các đơn mock.
  if (method === 'GET' && /^\/bookings\/[^/]+\/participants$/.test(rawPath0)) {
    const bookingId = rawPath0.split('/')[2];
    return {
      bookingId,
      slotsNeeded: 4,
      matchFull: false,
      joinedCount: 1,
      participants: [
        {
          userId: 'u-customer-01',
          fullName: 'Nguyễn Văn Bình',
          joinedAt: new Date().toISOString(),
        },
      ],
    } as T;
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
