import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { PaginatedReviews, PaginatedVenues, VenueDetail } from './types';

import { fetchVenueDetail, fetchVenueReviews, fetchVenues, type VenueFilters } from './api';

/** Danh sách sân public — giữ dữ liệu trang trước khi đổi trang để đỡ nhấp nháy. */
export function useVenues(filters: VenueFilters): ReturnType<typeof useQuery<PaginatedVenues>> {
  return useQuery({
    queryKey: ['public', 'venues', filters],
    queryFn: () => fetchVenues(filters),
    placeholderData: keepPreviousData,
  });
}

export function useVenue(slugOrId: string): ReturnType<typeof useQuery<VenueDetail>> {
  return useQuery({
    queryKey: ['public', 'venue', slugOrId],
    queryFn: () => fetchVenueDetail(slugOrId),
  });
}

export function useVenueReviews(
  slugOrId: string,
  page = 1,
): ReturnType<typeof useQuery<PaginatedReviews>> {
  return useQuery({
    queryKey: ['public', 'venue-reviews', slugOrId, page],
    queryFn: () => fetchVenueReviews(slugOrId, { page, size: 5 }),
  });
}
