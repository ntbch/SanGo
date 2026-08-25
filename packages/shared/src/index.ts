/**
 * @courthub/shared — kiểu + enum trạng thái dùng chung toàn hệ thống.
 * Nguồn chân lý: đặc tả thiết kế §5 (Mô hình dữ liệu Prisma).
 * Quy ước giá trị enum = tên chuỗi UPPERCASE trùng với DB/Prisma.
 */

/** Tên sản phẩm — dùng chung cho UI placeholder và tiêu đề. */
export const APP_NAME = 'CourtHub' as const;

/** Tiền tố REST API quy ước ở đặc tả §4. */
export const API_PREFIX = '/api/v1' as const;

/** Phản hồi chuẩn của GET /api/v1/health. */
export interface HealthResponse {
  status: 'ok';
}

/* ------------------------------------------------------------------ */
/* Enum trạng thái — đặc tả §5                                         */
/* ------------------------------------------------------------------ */

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
}

export enum VenueStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum SportType {
  FOOTBALL5 = 'FOOTBALL5',
  FOOTBALL7 = 'FOOTBALL7',
  PICKLEBALL = 'PICKLEBALL',
  BADMINTON = 'BADMINTON',
  TENNIS = 'TENNIS',
}

export enum CourtStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

export enum DayType {
  WEEKDAY = 'WEEKDAY',
  WEEKEND = 'WEEKEND',
}

export enum BookingHoldStatus {
  ACTIVE = 'ACTIVE',
  CONVERTED = 'CONVERTED',
  EXPIRED = 'EXPIRED',
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum PaymentType {
  DEPOSIT = 'DEPOSIT',
  FULL = 'FULL',
  REFUND = 'REFUND',
}

export enum PaymentMethod {
  VNPAY = 'VNPAY',
  MOCK = 'MOCK',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

/* ------------------------------------------------------------------ */
/* Hằng số nghiệp vụ cơ bản                                            */
/* ------------------------------------------------------------------ */

/** Độ dài slot được phép (đặc tả §5 — Court.slotMinutes[60|90]). */
export const SLOT_MINUTES = [60, 90] as const;
export type SlotMinutes = (typeof SLOT_MINUTES)[number];

/** Nhãn hiển thị tiếng Việt của loại sân — dùng cho UI. */
export const SPORT_TYPE_LABELS: Record<SportType, string> = {
  [SportType.FOOTBALL5]: 'Bóng đá 5 người',
  [SportType.FOOTBALL7]: 'Bóng đá 7 người',
  [SportType.PICKLEBALL]: 'Pickleball',
  [SportType.BADMINTON]: 'Cầu lông',
  [SportType.TENNIS]: 'Tennis',
};

/**
 * Ngày hiện tại (YYYY-MM-DD) theo múi giờ kinh doanh Asia/Ho_Chi_Minh.
 * "Hôm nay" nghiệp vụ của CourtHub là ngày VN — không dùng biên UTC để tránh
 * lệch 7 tiếng (QA t8: dashboard mất đơn hôm nay lúc 00:00-06:59 ICT).
 */
export function vnToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now);
}

/** Loại thông báo in-app/email (GĐ2) — trùng khớp enum NotificationType trong Prisma. */
export enum NotificationType {
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  NEW_BOOKING_OWNER = 'NEW_BOOKING_OWNER',
  MATCH_JOINED = 'MATCH_JOINED',
  MATCH_LEFT = 'MATCH_LEFT',
  REMINDER = 'REMINDER',
}

export * from './schemas';
export * from './geo';
