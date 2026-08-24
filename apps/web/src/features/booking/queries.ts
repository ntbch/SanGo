import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MyBookingsQuery } from '../../lib/api/endpoints';
import {
  cancelCustomerBooking,
  checkoutPayment,
  createBookingHold,
  deleteBookingHold,
  fetchBookingHold,
  fetchCourtSlots,
  fetchMyCustomerBookings,
  fetchRefundPreview,
  submitBookingReview,
} from './api';
import type {
  BookingHold,
  CheckoutPayload,
  CheckoutResponse,
  CourtWeeklySlotsResponse,
  CreateHoldPayload,
  PaginatedCustomerBookings,
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
  return useMutation<BookingHold, Error, CreateHoldPayload>({
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
