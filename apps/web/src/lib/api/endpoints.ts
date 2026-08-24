/**
 * Bản đồ endpoint REST CHÍNH THỨC của backend (contract chốt cho t7→t11).
 * Nguồn sự thật khi merge là Swagger, nhưng web tập trung path vào một chỗ
 * này để t9–t11 dùng chung, tránh rải chuỗi URL trong component.
 */

type QueryValue = string | number | boolean | undefined;

function qs(params: object = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params) as [string, QueryValue][]) {
    if (value === undefined || value === '') continue;
    search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? '?' + encoded : '';
}

function seg(value: string | number): string {
  return encodeURIComponent(String(value));
}

/** Bộ lọc tìm kiếm sân public — GET /venues (contract backend). */
export interface VenueListQuery {
  sportType?: string;
  q?: string;
  date?: string;
  startMinute?: number;
  endMinute?: number;
  maxPrice?: number;
  /** Danh sách tiện ích, vd 'parking,shower'. */
  amenities?: string;
  sort?: string;
  page?: number;
}

export interface SlotsQuery {
  /** Ngày bắt đầu, định dạng YYYY-MM-DD. */
  from: string;
  /** Số ngày lấy lịch, mặc định 7 (một tuần). */
  days?: number;
}

export interface MyBookingsQuery {
  filter?: 'upcoming' | 'history' | 'cancelled';
  page?: number;
}

export interface AdminVenuesQuery {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  page?: number;
  q?: string;
}

export interface OwnerBookingsQuery {
  /** Bắt buộc theo contract. */
  venueId: string;
  date?: string;
  status?: string;
}

export interface OwnerAnalyticsQuery {
  /** Bắt buộc theo contract — UUID cụm sân của chủ đang đăng nhập. */
  venueId: string;
  /** Số ngày thống kê tính đến hôm nay; backend chặn 1..90, mặc định 30. */
  days?: number;
}

export interface ReviewsQuery {
  page?: number;
  size?: number;
}

export const endpoints = {
  auth: {
    login: (): string => '/auth/login',
    register: (): string => '/auth/register',
    forgotPassword: (): string => '/auth/forgot-password',
    /** Đặt lại mật khẩu bằng token trong email (contract t4). */
    resetPassword: (): string => '/auth/reset-password',
    refresh: (): string => '/auth/refresh',
    logout: (): string => '/auth/logout',
  },

  users: {
    /** Thông tin người dùng hiện tại — cần Bearer token. */
    me: (): string => '/users/me',
  },

  venues: {
    /** Tìm kiếm public. */
    list: (query: VenueListQuery = {}): string => '/venues' + qs(query),
    /** Chi tiết sân theo slug (hoặc id) + courts[]. */
    detail: (slugOrId: string): string => '/venues/' + seg(slugOrId),
    reviews: (slugOrId: string, query: ReviewsQuery = {}): string =>
      '/venues/' + seg(slugOrId) + '/reviews' + qs(query),
    /** Sân của owner đăng nhập (mọi trạng thái); ADMIN xem tất cả. */
    mine: (query: { page?: number; limit?: number } = {}): string => '/venues/mine' + qs(query),
    // Owner:
    create: (): string => '/venues',
    remove: (id: string): string => '/venues/' + seg(id),
    removeCourt: (courtId: string): string => '/courts/' + seg(courtId),
    update: (id: string): string => '/venues/' + seg(id),
    courtsByVenue: (venueId: string): string => '/venues/' + seg(venueId) + '/courts',
    addCourt: (venueId: string): string => '/venues/' + seg(venueId) + '/courts',
    updateCourt: (courtId: string): string => '/courts/' + seg(courtId),
    /** REPLACE-ALL semantics, idempotent theo contract. */
    replacePricingRules: (courtId: string): string => '/courts/' + seg(courtId) + '/pricing-rules',
    /** Đọc quy tắc giá hiện tại của sân con. */
    getPricingRules: (courtId: string): string => '/courts/' + seg(courtId) + '/pricing-rules',
    /** Lịch trống tuần theo sân con. */
    courtSlots: (courtId: string, query: SlotsQuery): string =>
      '/courts/' + seg(courtId) + '/slots' + qs({ ...query, days: query.days ?? 7 }),
  },

  bookings: {
    /** Swagger t5: POST /bookings/holds (số nhiều) — nguồn sự thật. */
    hold: (): string => '/bookings/holds',
    holdById: (id: string): string => '/bookings/holds/' + seg(id),
    mine: (query: MyBookingsQuery = {}): string => '/bookings/me' + qs(query),
    refundPreview: (id: string): string => '/bookings/' + seg(id) + '/refund-preview',
    cancel: (id: string): string => '/bookings/' + seg(id),
    review: (id: string): string => '/bookings/' + seg(id) + '/review',
    checkIn: (): string => '/bookings/check-in',
    noShow: (id: string): string => '/bookings/' + seg(id) + '/no-show',
  },

  payments: {
    checkout: (): string => '/payments/checkout',
    vnpayCallback: (): string => '/payments/vnpay/callback',
    mockCallback: (txnRef: string): string => '/payments/mock/callback' + qs({ txnRef }),
  },

  uploads: {
    /** Trả chữ ký để client PUT thẳng lên Cloudinary. */
    sign: (): string => '/uploads/sign',
  },

  admin: {
    venues: (query: AdminVenuesQuery = {}): string => '/admin/venues' + qs(query),
    venue: (id: string): string => '/admin/venues/' + seg(id),
    approve: (id: string): string => '/admin/venues/' + seg(id) + '/approve',
    reject: (id: string): string => '/admin/venues/' + seg(id) + '/reject',
  },

  owner: {
    bookings: (query: OwnerBookingsQuery): string => '/owner/bookings' + qs(query),
    /** Thống kê cụm sân (§3.10) — venueId bắt buộc, days 1..90 (backend mặc định 30). */
    analytics: (query: OwnerAnalyticsQuery): string => '/owner/analytics' + qs(query),
  },
} as const;
