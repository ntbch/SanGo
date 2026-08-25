import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MyBookingsQuery } from '../../lib/api/endpoints';
import {
  addBookingAddOns,
  applyVoucherToHold,
  cancelCustomerBooking,
  checkoutBookingAddOns,
  checkoutPayment,
  createBookingHold,
  deleteBookingHold,
  fetchBookingAddOns,
  fetchBookingHold,
  fetchCourtSlots,
  fetchMyCustomerBookings,
  fetchRefundPreview,
  fetchVenueServices,
  submitBookingReview,
} from './api';
import type {
  AddBookingAddOnsPayload,
  AddonCheckoutResponse,
  ApplyVoucherResponse,
  BookingAddOnsResponse,
  BookingHold,
  CheckoutPayload,
  CheckoutResponse,
  CourtWeeklySlotsResponse,
  CreateHoldPayload,
  CreateHoldResponse,
  PaginatedCustomerBookings,
  PublicVenueService,
  RefundPreview,
} from './types';

export function useCourtWeeklySlots(courtId: string | undefined, fromDate: string) {
  return useQuery<CourtWeeklySlotsResponse>({
    queryKey: ['court-slots', courtId, fromDate],
    queryFn: () => fetchCourtSlots(courtId as string, fromDate),
    enabled: Boolean(courtId && fromDate),
    refetchInterval: 30000, // auto poll slot status
  });
}

export function useBookingHold(holdId: string | undefined) {
  return useQuery<BookingHold>({
    queryKey: ['booking-hold', holdId],
    queryFn: () => fetchBookingHold(holdId as string),
    enabled: Boolean(holdId),
    refetchInterval: 10000,
  });
}

export function useCreateBookingHold() {
  const qc = useQueryClient();
  return useMutation<CreateHoldResponse, Error, CreateHoldPayload>({
    mutationFn: createBookingHold,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['court-slots'] });
    },
  });
}

export function useDeleteBookingHold() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteBookingHold,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['court-slots'] });
      void qc.invalidateQueries({ queryKey: ['booking-hold'] });
    },
  });
}

export function useCheckoutPayment() {
  return useMutation<CheckoutResponse, Error, CheckoutPayload>({
    mutationFn: checkoutPayment,
  });
}

export function useMyBookings(query: MyBookingsQuery) {
  return useQuery<PaginatedCustomerBookings>({
    queryKey: ['my-bookings', query],
    queryFn: () => fetchMyCustomerBookings(query),
  });
}

export function useRefundPreview(bookingId: string | undefined) {
  return useQuery<RefundPreview>({
    queryKey: ['refund-preview', bookingId],
    queryFn: () => fetchRefundPreview(bookingId as string),
    enabled: Boolean(bookingId),
  });
}

export function useCancelCustomerBooking() {
  const qc = useQueryClient();
  return useMutation<void, Error, { bookingId: string; reason?: string }>({
    mutationFn: ({ bookingId, reason }) => cancelCustomerBooking(bookingId, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-bookings'] });
      void qc.invalidateQueries({ queryKey: ['court-slots'] });
    },
  });
}

export function useSubmitBookingReview() {
  const qc = useQueryClient();
  return useMutation<void, Error, { bookingId: string; rating: number; comment?: string }>({
    mutationFn: ({ bookingId, rating, comment }) => submitBookingReview(bookingId, rating, comment),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-bookings'] });
      void qc.invalidateQueries({ queryKey: ['public'] });
    },
  });
}

/** Áp mã giảm giá vào hold — làm mới hold để giá hiển thị ngay (F3). */
export function useApplyVoucher(holdId: string) {
  const qc = useQueryClient();
  return useMutation<ApplyVoucherResponse, Error, string>({
    mutationFn: (code) => applyVoucherToHold(holdId, code),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['booking-hold', holdId] });
    },
  });
}

/* ===================== F4: Gọi thêm dịch vụ ===================== */

/** Menu dịch vụ đang mở bán của cụm sân — venueId rỗng thì không gọi API. */
export function useVenueServices(venueId: string | undefined) {
  return useQuery<PublicVenueService[]>({
    queryKey: ['venue-services', venueId],
    queryFn: () => fetchVenueServices(venueId as string),
    enabled: Boolean(venueId),
  });
}

/** Dịch vụ đã đặt của một đơn + tổng tiền chưa trả. */
export function useBookingAddOns(bookingId: string | undefined) {
  return useQuery<BookingAddOnsResponse>({
    queryKey: ['booking-addons', bookingId],
    queryFn: () => fetchBookingAddOns(bookingId as string),
    enabled: Boolean(bookingId),
  });
}

function invalidateAddOns(qc: ReturnType<typeof useQueryClient>): void {
  void qc.invalidateQueries({ queryKey: ['booking-addons'] });
}

/** Thêm dịch vụ vào đơn (upsert theo serviceId ở backend). */
export function useAddBookingAddOns(bookingId: string) {
  const qc = useQueryClient();
  return useMutation<BookingAddOnsResponse, Error, AddBookingAddOnsPayload>({
    mutationFn: (payload) => addBookingAddOns(bookingId, payload),
    onSuccess: () => invalidateAddOns(qc),
  });
}

/** Tạo lệnh thanh toán ADD_ON cho phần chưa trả. */
export function useCheckoutBookingAddOns() {
  return useMutation<AddonCheckoutResponse, Error, string>({
    mutationFn: (bookingId) => checkoutBookingAddOns(bookingId),
  });
}
