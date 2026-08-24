import { apiFetch } from '../../lib/api/client';
import { endpoints, type MyBookingsQuery } from '../../lib/api/endpoints';
import type {
  BookingHold,
  CheckoutPayload,
  CheckoutResponse,
  CourtWeeklySlotsResponse,
  CreateHoldPayload,
  PaginatedCustomerBookings,
  RefundPreview,
} from './types';

/** Lấy lịch tuần 7 ngày của 1 sân con. */
export function fetchCourtSlots(
  courtId: string,
  fromDate: string,
): Promise<CourtWeeklySlotsResponse> {
  return apiFetch<CourtWeeklySlotsResponse>(
    endpoints.venues.courtSlots(courtId, { from: fromDate, days: 7 }),
  );
}

/** Giữ chỗ 10 phút. */
export function createBookingHold(payload: CreateHoldPayload): Promise<BookingHold> {
  return apiFetch<BookingHold>(endpoints.bookings.hold(), {
    method: 'POST',
    body: payload,
  });
}

/** Chi tiết giữ chỗ (bao gồm đếm ngược). */
export function fetchBookingHold(holdId: string): Promise<BookingHold> {
  return apiFetch<BookingHold>(endpoints.bookings.holdById(holdId));
}

/** Hủy giữ chỗ. */
export function deleteBookingHold(holdId: string): Promise<void> {
  return apiFetch<void>(endpoints.bookings.holdById(holdId), { method: 'DELETE' });
}

/** Thanh toán cọc / trả đủ -> trả paymentUrl. */
export function checkoutPayment(payload: CheckoutPayload): Promise<CheckoutResponse> {
  return apiFetch<CheckoutResponse>(endpoints.payments.checkout(), {
    method: 'POST',
    body: payload,
  });
}

/** Đơn của tôi. */
export function fetchMyCustomerBookings(
  query: MyBookingsQuery,
): Promise<PaginatedCustomerBookings> {
  return apiFetch<PaginatedCustomerBookings>(endpoints.bookings.mine(query));
}

/** Xem mức hoàn tiền dự kiến trước khi hủy. */
export function fetchRefundPreview(bookingId: string): Promise<RefundPreview> {
  return apiFetch<RefundPreview>(endpoints.bookings.refundPreview(bookingId));
}

/** Khách hủy đơn. */
export function cancelCustomerBooking(bookingId: string, reason?: string): Promise<void> {
  return apiFetch<void>(endpoints.bookings.cancel(bookingId), {
    method: 'DELETE',
    body: reason ? { reason } : undefined,
  });
}

/** Đánh giá trận đấu đã COMPLETED. */
export function submitBookingReview(
  bookingId: string,
  rating: number,
  comment?: string,
): Promise<void> {
  return apiFetch<void>(endpoints.bookings.review(bookingId), {
    method: 'POST',
    body: { rating, comment },
  });
}
