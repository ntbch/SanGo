import { apiFetch } from '../../lib/api/client';
import { endpoints, type MyBookingsQuery } from '../../lib/api/endpoints';
import type {
  ApplyVoucherResponse,
  BookingHold,
  CheckoutPayload,
  CheckoutResponse,
  CourtWeeklySlotsResponse,
  CreateHoldPayload,
  CreateHoldResponse,
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

/** Giữ chỗ 10 phút — trả holdId theo contract §6.1. */
export function createBookingHold(payload: CreateHoldPayload): Promise<CreateHoldResponse> {
  return apiFetch<CreateHoldResponse>(endpoints.bookings.hold(), {
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

/** Áp mã giảm giá vào hold — trả giá sau giảm đã snapshot (F3). */
export function applyVoucherToHold(holdId: string, code: string): Promise<ApplyVoucherResponse> {
  return apiFetch<ApplyVoucherResponse>(endpoints.vouchers.applyToHold(holdId), {
    method: 'POST',
    body: { code },
  });
}

/* ===================== F4: Gọi thêm dịch vụ ===================== */

import type {
  AddBookingAddOnsPayload,
  AddonCheckoutResponse,
  BookingAddOnsResponse,
  PublicVenueService,
} from './types';

/** Menu dịch vụ đang mở bán của cụm sân — dùng cho modal gọi thêm dịch vụ. */
export function fetchVenueServices(venueId: string): Promise<PublicVenueService[]> {
  return apiFetch<PublicVenueService[]>(endpoints.services.publicByVenue(venueId));
}

/** Danh sách dịch vụ đã đặt của đơn + số tiền chưa trả. */
export function fetchBookingAddOns(bookingId: string): Promise<BookingAddOnsResponse> {
  return apiFetch<BookingAddOnsResponse>(endpoints.services.bookingAddOns(bookingId));
}

/** Chọn mua/thuê dịch vụ cho đơn CONFIRMED/CHECKED_IN — trả lại tổng mới. */
export function addBookingAddOns(
  bookingId: string,
  payload: AddBookingAddOnsPayload,
): Promise<BookingAddOnsResponse> {
  return apiFetch<BookingAddOnsResponse>(endpoints.services.addBookingAddOns(bookingId), {
    method: 'POST',
    body: payload,
  });
}

/** Tạo lệnh thanh toán ADD_ON cho phần chưa trả — trả paymentUrl để redirect. */
export function checkoutBookingAddOns(bookingId: string): Promise<AddonCheckoutResponse> {
  return apiFetch<AddonCheckoutResponse>(endpoints.services.checkoutBookingAddOns(bookingId), {
    method: 'POST',
  });
}
