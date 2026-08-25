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
  city?: string;
  district?: string;
  userLat?: number;
  userLng?: number;
  radiusKm?: number;
  date?: string;
  startMinute?: number;
  endMinute?: number;
  maxPrice?: number;
  /** Danh sách tiện ích, vd 'parking,shower'. */
  amenities?: string;
  sort?: string;
  sortBy?: string;
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

export interface OpenMatchesQuery {
  sportType?: 'FOOTBALL5' | 'FOOTBALL7' | 'PICKLEBALL' | 'BADMINTON' | 'TENNIS';
  /** YYYY-MM-DD. */
  date?: string;
  page?: number;
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
    /** Đổi mật khẩu khi đang đăng nhập — thu hồi mọi phiên cũ (P1-B1/F2). */
    changePassword: (): string => '/auth/change-password',
    refresh: (): string => '/auth/refresh',
    logout: (): string => '/auth/logout',
  },

  users: {
    /** Thông tin người dùng hiện tại — cần Bearer token. */
    me: (): string => '/users/me',
    /** Cập nhật hồ sơ fullName/phone/avatarUrl (P1-F2) — cần Bearer token. */
    updateMe: (): string => '/users/me',
  },

  venues: {
    /** Tìm kiếm public. */
    list: (query: VenueListQuery = {}): string => '/venues' + qs(query),
    /** F5 Map nâng cao: Tìm kiếm theo khung nhìn viewport bounding box. */
    map: (query: { bbox: string; sportType?: string; q?: string; limit?: number }): string =>
      '/venues/map' + qs(query),
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
    /** Ghép trận mở (§3.11): tham gia / rời ghép trên đơn của người khác. */
    joinMatch: (id: string): string => '/bookings/' + seg(id) + '/join',
    /** [Chủ đơn/ADMIN] Danh sách người đã tham gia. */
    matchParticipants: (id: string): string => '/bookings/' + seg(id) + '/participants',
    noShow: (id: string): string => '/bookings/' + seg(id) + '/no-show',
  },

  payments: {
    checkout: (): string => '/payments/checkout',
    vnpayCallback: (): string => '/payments/vnpay/callback',
    mockCallback: (txnRef: string): string => '/payments/mock/callback' + qs({ txnRef }),
  },

  wallet: {
    /** Ví của tôi — số dư + lịch sử ledger phân trang (F6). */
    me: (query: { page?: number; pageSize?: number } = {}): string => '/wallet/me' + qs(query),
    /** Nạp tiền qua cổng mock — trả txnRef + paymentUrl (F6). */
    topup: (): string => '/wallet/topup',
  },

  uploads: {
    /** Trả chữ ký để client PUT thẳng lên Cloudinary. */
    sign: (): string => '/uploads/sign',
  },

  vouchers: {
    /** [OWNER] Danh sách voucher của mình kèm số lượt đã dùng (F3). */
    mine: (): string => '/owner/vouchers',
    /** [OWNER] Tạo voucher mới (F3). */
    create: (): string => '/owner/vouchers',
    /** [OWNER] Cập nhật một phần (percentOff/cửa sổ/limit/active). */
    update: (id: string): string => '/owner/vouchers/' + seg(id),
    /** [OWNER] Xoá voucher (F3). */
    remove: (id: string): string => '/owner/vouchers/' + seg(id),
    /** Khách áp mã vào hold của mình — snapshot giá NGAY LÚC ÁP MÃ (F3). */
    applyToHold: (holdId: string): string => '/holds/' + seg(holdId) + '/voucher',
  },

  admin: {
    venues: (query: AdminVenuesQuery = {}): string => '/admin/venues' + qs(query),
    venue: (id: string): string => '/admin/venues/' + seg(id),
    approve: (id: string): string => '/admin/venues/' + seg(id) + '/approve',
    reject: (id: string): string => '/admin/venues/' + seg(id) + '/reject',
  },

  matches: {
    /** [Public] Danh sách trận mở chưa đủ người (§3.11). */
    open: (query: OpenMatchesQuery = {}): string => '/matches/open' + qs(query),
  },

  ai: {
    /** [Public] Trợ lý đặt sân tiếng Việt — Bearer tuỳ chọn (§3.12). */
    chat: (): string => '/ai/chat',
    /** [Public] Gợi ý khung giờ AI-2 (§3.13). */
    suggestedSlots: (query: { courtId: string; date?: string }): string =>
      '/ai/suggested-slots' + qs(query),
    /** [Bearer bắt buộc] Giữ chỗ 10 phút từ chat — guardrail §3.12. */
    hold: (): string => '/ai/hold',
  },

  owner: {
    bookings: (query: OwnerBookingsQuery): string => '/owner/bookings' + qs(query),
    /** Thống kê cụm sân (§3.10) — venueId bắt buộc, days 1..90 (backend mặc định 30). */
    analytics: (query: OwnerAnalyticsQuery): string => '/owner/analytics' + qs(query),
  },

  notifications: {
    /** Hộp thư của tôi — mới nhất trước, kèm unreadCount (contract t1). */
    list: (query: { page?: number } = {}): string => '/notifications' + qs(query),
    /** Đánh dấu MỘT thông báo đã đọc (idempotent). */
    markRead: (id: string): string => '/notifications/' + seg(id) + '/read',
    /** Đánh dấu TOÀN BỘ chưa đọc là đã đọc -> { updated }. */
    markAllRead: (): string => '/notifications/read-all',
  },

  teams: {
    /** Tạo đội mới (người tạo là CAPTAIN). */
    create: (): string => '/teams',
    /** Danh sách đội tôi tham gia (ACTIVE hoặc PENDING). */
    myTeams: (): string => '/teams/my-teams',
    /** Chi tiết đội + thành viên. */
    detail: (id: string): string => '/teams/' + seg(id),
    /** Cập nhật đội (chỉ CAPTAIN). */
    update: (id: string): string => '/teams/' + seg(id),
    /** Mời thành viên vào đội (PENDING invite, CAPTAIN). */
    invite: (id: string): string => '/teams/' + seg(id) + '/invite',
    /** Chấp nhận/từ chối lời mời. */
    respondInvite: (id: string): string => '/teams/' + seg(id) + '/respond-invite',
    /** Xoá thành viên (CAPTAIN xoá / member tự rời). */
    removeMember: (id: string, userId: string): string =>
      '/teams/' + seg(id) + '/members/' + seg(userId),
    /** Xem quỹ chia tiền + tổng quan nợ. */
    expenses: (id: string): string => '/teams/' + seg(id) + '/expenses',
    /** Tạo khoản chia tiền thủ công. */
    createExpense: (id: string): string => '/teams/' + seg(id) + '/expenses',
    /** Chia đều tiền sân cho các thành viên. */
    splitBooking: (id: string): string => '/teams/' + seg(id) + '/expenses/split-booking',
    /** Cập nhật trạng thái khoản nợ (UNPAID <-> PAID). */
    updateExpenseStatus: (id: string, shareId: string): string =>
      '/teams/' + seg(id) + '/expenses/' + seg(shareId) + '/status',
  },

  services: {
    /** [OWNER] Menu dịch vụ của một cụm sân (kể cả đã tắt) — GET/POST. */
    byVenue: (venueId: string): string => '/owner/venues/' + seg(venueId) + '/services',
    /** [OWNER] Cập nhật giá/tên/trạng thái hoặc xoá-tắt một dịch vụ. */
    item: (venueId: string, id: string): string =>
      '/owner/venues/' + seg(venueId) + '/services/' + seg(id),
    /** [Public] Menu đang mở bán của cụm sân — khách chọn kèm lúc gọi thêm. */
    publicByVenue: (venueId: string): string => '/venues/' + seg(venueId) + '/services',
    /** Danh sách dịch vụ đã đặt của đơn + số tiền chưa trả (F4). */
    bookingAddOns: (bookingId: string): string => '/bookings/' + seg(bookingId) + '/addons',
    /** Chọn mua/thuê dịch vụ cho đơn CONFIRMED/CHECKED_IN. */
    addBookingAddOns: (bookingId: string): string => '/bookings/' + seg(bookingId) + '/addons',
    /** Tạo lệnh thanh toán riêng type ADD_ON cho phần chưa trả. */
    checkoutBookingAddOns: (bookingId: string): string =>
      '/bookings/' + seg(bookingId) + '/addons/checkout',
  },
} as const;
