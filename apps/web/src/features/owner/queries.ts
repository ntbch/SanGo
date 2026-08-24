import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CourtRow, OwnerBooking, OwnerVenue, Paginated, PricingRule } from './types';

import {
  cancelBookingAsOwner,
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
  updateVenue,
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
