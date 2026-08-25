/** Kiểu dữ liệu khu owner — khớp phản hồi thật của backend (t4+t5). */

export interface CourtRow {
  id: string;
  venueId?: string;
  name: string;
  sportType: string;
  slotMinutes: number;
  defaultPricePerSlot: number;
  status?: 'ACTIVE' | 'MAINTENANCE';
}

export interface OwnerVenue {
  id: string;
  name: string;
  slug: string;
  address: string;
  lat: number;
  lng: number;
  images: string[];
  amenities: string[];
  depositPercent: number | null;
  openMinute: number;
  closeMinute: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string | null;
  createdAt?: string;
  courtsCount?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Một quy tắc giá ghi đè — REPLACE-ALL qua PUT /courts/:id/pricing-rules. */
export interface PricingRule {
  dayType: 'WEEKDAY' | 'WEEKEND';
  startMinute: number;
  endMinute: number;
  pricePerSlot: number;
}

export type OwnerBookingStatus =
  'PENDING_PAYMENT' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

/* ---------------- Thống kê chủ sân — GET /owner/analytics (§3.10) ---------------- */

/** Khớp OwnerAnalyticsSeriesPoint của apps/api/src/analytics/dto/analytics.dto.ts. */
export interface OwnerAnalyticsPoint {
  /** YYYY-MM-DD (UTC). */
  date: string;
  /** Số đơn MỌI trạng thái phát sinh trong ngày. */
  bookings: number;
  /** Doanh thu xác nhận trong ngày (depositAmount của đơn CONFIRMED+). */
  revenue: number;
}

/** Khớp OwnerAnalyticsTopCourt — đã sắp giảm dần theo bookings từ backend. */
export interface OwnerAnalyticsTopCourt {
  courtId: string;
  courtName: string;
  bookings: number;
  revenue: number;
}

/** Khớp OwnerAnalyticsSummary của backend. */
export interface OwnerAnalyticsSummary {
  revenueConfirmed: number;
  totalBookings: number;
  cancelledCount: number;
  noShowCount: number;
  /** (cancelled + noShow) / totalBookings, làm tròn 4 chữ số; 0 nếu chưa có đơn. */
  cancelRate: number;
}

export interface OwnerAnalyticsResponse {
  meta: {
    venueId: string;
    venueName: string;
    days: number;
    from: string;
    to: string;
  };
  summary: OwnerAnalyticsSummary;
  /** Chuỗi theo ngày ĐỦ độ dài `days`, ngày không có đơn được zero-fill. */
  series: OwnerAnalyticsPoint[];
  topCourts: OwnerAnalyticsTopCourt[];
}
export interface OwnerBooking {
  id: string;
  code: string;
  courtName: string;
  customerName: string;
  date: string;
  startMinute: number;
  endMinute: number;
  status: OwnerBookingStatus;
  amountPaid: number;
}

/** F3: một dòng voucher của owner (kèm số lượt đã dùng từ _count). */
export interface OwnerVoucher {
  id: string;
  code: string;
  percentOff: number;
  /** Thứ áp dụng (0=CN..6=Thứ 7) — khớp getUTCDay() của ngày chơi. */
  dayOfWeek: number;
  validFromMinute: number;
  validToMinute: number;
  usageLimit: number;
  perUserLimit: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  _count?: { redemptions: number };
}

/** Payload tạo voucher — khớp CreateVoucherSchema của backend. */
export interface VoucherFormPayload {
  code: string;
  percentOff: number;
  dayOfWeek: number;
  validFromMinute: number;
  validToMinute: number;
  usageLimit: number;
  perUserLimit: number;
  expiresAt?: string;
}

/** PATCH /owner/vouchers/:id — cập nhật một phần; code không cho đổi. */
export type VoucherUpdatePayload = Partial<Omit<VoucherFormPayload, 'code'>> & {
  active?: boolean;
};
