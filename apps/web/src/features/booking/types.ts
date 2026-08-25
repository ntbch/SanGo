/** Kiểu dữ liệu luồng Đặt sân & Lịch tuần & Thanh toán & Đơn của tôi. */

export type SlotState = 'AVAILABLE' | 'BOOKED' | 'HELD' | 'MAINTENANCE' | 'PAST';

export interface TimeSlot {
  startMinute: number;
  endMinute: number;
  state: SlotState;
  price?: number;
}

export interface DaySlots {
  date: string; // YYYY-MM-DD
  slots: TimeSlot[];
}

export interface CourtWeeklySlotsResponse {
  courtId?: string;
  byDate: DaySlots[];
}

export interface SelectedSlot {
  date: string;
  startMinute: number;
  endMinute: number;
  price?: number;
}

export interface CreateHoldPayload {
  courtId: string;
  date: string;
  slots: Array<{ startMinute: number; endMinute: number }>;
  /** Ghép trận mở (§3.11): công khai tìm người ghép. */
  isPublicMatch?: boolean;
  /** 1..10 — bắt buộc khi isPublicMatch (khớp CreateHoldSchema backend). */
  slotsNeeded?: number;
}

/** Phản hồi POST /bookings/holds (và /ai/hold) — khớp contract backend §6.1. */
export interface CreateHoldResponse {
  holdId: string;
  courtId: string;
  date: string;
  startMinute: number;
  endMinute: number;
  subtotal: number;
  expiresAt: string;
  depositPercent: number;
}

export interface BookingHold {
  id: string;
  courtId: string;
  courtName?: string;
  venueName?: string;
  date: string;
  slots: Array<{ startMinute: number; endMinute: number }>;
  subtotal: number;
  depositPercent: number;
  depositAmount?: number;
  expiresAt: string;
  /** Ghép trận mở: hold đang công khai tìm người ghép. */
  isPublicMatch?: boolean;
  slotsNeeded?: number | null;
  /** F3 voucher: snapshot giảm giá khi đã áp mã (null/undefined = chưa áp). */
  discountAmount?: number | null;
  finalAmount?: number | null;
}

export interface CheckoutPayload {
  holdId: string;
  type: 'DEPOSIT' | 'FULL';
}

export interface CheckoutResponse {
  txnRef: string;
  amount: number;
  type: 'DEPOSIT' | 'FULL';
  mode: 'vnpay' | 'mock';
  paymentUrl: string;
  redirectUrl?: string;
}

export interface RefundPreview {
  refundPercent: number;
  refundAmount: number;
  amountPaid: number;
  hoursUntilMatch: number;
  policyDescription?: string;
}

/** POST /holds/:id/voucher — áp mã thành công, giá đã snapshot vào hold (F3). */
export interface ApplyVoucherResponse {
  holdId: string;
  code: string;
  percentOff: number;
  subtotal: number;
  discountAmount: number;
  finalAmount: number;
}

export interface CustomerBooking {
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
  /** Ghép trận mở (§3.11) — badge 'Đang tìm người' khi chưa đủ người. */
  isPublicMatch?: boolean;
  slotsNeeded?: number | null;
  matchFull?: boolean;
}

export interface PaginatedCustomerBookings {
  items: CustomerBooking[];
  total: number;
  page: number;
  pages: number;
}
