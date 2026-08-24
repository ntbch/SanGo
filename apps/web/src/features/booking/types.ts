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
}

export interface PaginatedCustomerBookings {
  items: CustomerBooking[];
  total: number;
  page: number;
  pages: number;
}
