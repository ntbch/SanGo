import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  CourtRow,
  DeleteServiceResponse,
  OwnerAnalyticsResponse,
  OwnerBooking,
  OwnerVenue,
  Paginated,
  PricingRule,
  ServiceFormPayload,
  VenueServiceRow,
  VoucherFormPayload,
  VoucherUpdatePayload,
} from './types';

import {
  cancelBookingAsOwner,
  createOwnerVoucher,
  createVenueService,
  deleteOwnerVoucher,
  deleteVenueService,
  fetchOwnerAnalytics,
  fetchOwnerVouchers,
  fetchVenueServices,
  checkInByCode,
  createCourt,
  createVenue,
  deleteVenue,
  fetchCourtsOfVenue,
  fetchMyVenues,
  fetchOwnerBookings,
  fetchPricingRules,
  markNoShow,
  removeCourt,
  savePricingRules,
  updateCourt,
  updateOwnerVoucher,
  updateVenue,
  updateVenueService,
  type CourtFormPayload,
  type OwnerBookingsFilters,
  type VenueFormPayload,
} from './api';

export function useMyVenues(page = 1): ReturnType<typeof useQuery<Paginated<OwnerVenue>>> {
  return useQuery({ queryKey: ['owner', 'venues', page], queryFn: () => fetchMyVenues(page) });
}

export function useVenueCourts(
  venueId: string | undefined,
): ReturnType<typeof useQuery<{ items: CourtRow[] }>> {
  return useQuery({
    queryKey: ['owner', 'courts', venueId],
    queryFn: () => fetchCourtsOfVenue(venueId as string),
    enabled: venueId !== undefined && venueId !== '',
  });
}

export function usePricingRules(
  courtId: string | undefined,
): ReturnType<typeof useQuery<{ rules: PricingRule[] }>> {
  return useQuery({
    queryKey: ['owner', 'pricing', courtId],
    queryFn: () => fetchPricingRules(courtId as string),
    enabled: courtId !== undefined && courtId !== '',
  });
}

export function useOwnerBookings(
  filters: OwnerBookingsFilters,
): ReturnType<typeof useQuery<Paginated<OwnerBooking>>> {
  return useQuery({
    queryKey: ['owner', 'bookings', filters],
    queryFn: () => fetchOwnerBookings(filters),
  });
}

/** Thống kê cụm sân (§3.10) — venueId rỗng/undefined thì không gọi API. */
export function useOwnerAnalytics(filters: {
  venueId?: string;
  days: number;
}): ReturnType<typeof useQuery<OwnerAnalyticsResponse>> {
  const { venueId, days } = filters;
  return useQuery({
    queryKey: ['owner', 'analytics', venueId, days],
    queryFn: () => fetchOwnerAnalytics(venueId as string, days),
    enabled: venueId !== undefined && venueId !== '',
  });
}

/** Invalidate gọn khu owner sau mỗi mutation. */
function useOwnerInvalidate(): (keys: string[]) => void {
  const qc = useQueryClient();
  return (keys) => {
    void qc.invalidateQueries({ queryKey: ['owner'] });
    void qc.invalidateQueries({ queryKey: keys });
  };
}

export function useCreateVenue() {
  const invalidate = useOwnerInvalidate();
  return useMutation({
    mutationFn: (values: VenueFormPayload) => createVenue(values),
    onSuccess: () => invalidate(['public']),
  });
}

export function useUpdateVenue() {
  const invalidate = useOwnerInvalidate();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<VenueFormPayload> }) =>
      updateVenue(id, values),
    onSuccess: () => invalidate(['public', 'admin']),
  });
}

export function useDeleteVenue() {
  const invalidate = useOwnerInvalidate();
  return useMutation({
    mutationFn: (id: string) => deleteVenue(id),
    onSuccess: () => invalidate(['public']),
  });
}

export function useCreateCourt(venueId: string) {
  const invalidate = useOwnerInvalidate();
  return useMutation({
    mutationFn: (values: CourtFormPayload) => createCourt(venueId, values),
    onSuccess: () => invalidate([]),
  });
}

export function useUpdateCourt() {
  const invalidate = useOwnerInvalidate();
  return useMutation({
    mutationFn: ({ courtId, patch }: { courtId: string; patch: Partial<CourtFormPayload> }) =>
      updateCourt(courtId, patch),
    onSuccess: () => invalidate([]),
  });
}

export function useRemoveCourt() {
  const invalidate = useOwnerInvalidate();
  return useMutation({
    mutationFn: (courtId: string) => removeCourt(courtId),
    onSuccess: () => invalidate([]),
  });
}

export function useSavePricingRules(courtId: string) {
  const invalidate = useOwnerInvalidate();
  return useMutation({
    mutationFn: (rules: PricingRule[]) => savePricingRules(courtId, rules),
    onSuccess: () => invalidate([]),
  });
}

export function useCheckIn() {
  const invalidate = useOwnerInvalidate();
  return useMutation({
    mutationFn: (code: string) => checkInByCode(code),
    onSuccess: () => invalidate([]),
  });
}

export function useMarkNoShow() {
  const invalidate = useOwnerInvalidate();
  return useMutation({
    mutationFn: (bookingId: string) => markNoShow(bookingId),
    onSuccess: () => invalidate([]),
  });
}

export function useCancelBookingAsOwner() {
  const invalidate = useOwnerInvalidate();
  return useMutation({
    mutationFn: (bookingId: string) => cancelBookingAsOwner(bookingId),
    onSuccess: () => invalidate([]),
  });
}

/* ===================== F3: Voucher ===================== */

/** Danh sách voucher của owner — kèm số lượt đã dùng. */
export function useOwnerVouchers() {
  return useQuery({ queryKey: ['owner', 'vouchers'], queryFn: () => fetchOwnerVouchers() });
}

export function useCreateOwnerVoucher() {
  const qc = useQueryClient();
  return useMutation<{ id: string; code: string }, Error, VoucherFormPayload>({
    mutationFn: (payload) => createOwnerVoucher(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['owner', 'vouchers'] });
    },
  });
}

export function useUpdateOwnerVoucher() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; patch: VoucherUpdatePayload }>({
    mutationFn: ({ id, patch }) => updateOwnerVoucher(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['owner', 'vouchers'] });
    },
  });
}

export function useDeleteOwnerVoucher() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => deleteOwnerVoucher(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['owner', 'vouchers'] });
    },
  });
}

/* ===================== F4: Menu dịch vụ ===================== */

/** Menu dịch vụ của một cụm sân — venueId rỗng thì không gọi API. */
export function useVenueServices(venueId: string | undefined) {
  return useQuery<VenueServiceRow[]>({
    queryKey: ['owner', 'services', venueId],
    queryFn: () => fetchVenueServices(venueId as string),
    enabled: Boolean(venueId),
  });
}

function useInvalidateServices(): () => void {
  const qc = useQueryClient();
  // Menu public cho khách cũng phải làm mới theo thay đổi của chủ sân.
  return () => {
    void qc.invalidateQueries({ queryKey: ['owner', 'services'] });
    void qc.invalidateQueries({ queryKey: ['venue-services'] });
  };
}

export function useCreateVenueService(venueId: string) {
  const invalidate = useInvalidateServices();
  return useMutation<VenueServiceRow, Error, ServiceFormPayload>({
    mutationFn: (payload) => createVenueService(venueId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateVenueService(venueId: string) {
  const invalidate = useInvalidateServices();
  return useMutation<VenueServiceRow, Error, { id: string; patch: Partial<ServiceFormPayload> }>({
    mutationFn: ({ id, patch }) => updateVenueService(venueId, id, patch),
    onSuccess: invalidate,
  });
}

export function useDeleteVenueService(venueId: string) {
  const invalidate = useInvalidateServices();
  return useMutation<DeleteServiceResponse, Error, string>({
    mutationFn: (id) => deleteVenueService(venueId, id),
    onSuccess: invalidate,
  });
}
