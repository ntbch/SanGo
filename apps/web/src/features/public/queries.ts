import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type {
  PaginatedReviews,
  PaginatedVenues,
  VenueDetail,
  VenueMapQuery,
  VenueMapResponse,
} from './types';

import {
  fetchVenueDetail,
  fetchVenueReviews,
  fetchVenues,
  fetchVenuesMap,
  type VenueFilters,
} from './api';

/** Danh sách sân public — giữ dữ liệu trang trước khi đổi trang để đỡ nhấp nháy. */
export function useVenues(filters: VenueFilters): ReturnType<typeof useQuery<PaginatedVenues>> {
  return useQuery({
    queryKey: ['public', 'venues', filters],
    queryFn: () => fetchVenues(filters),
    placeholderData: keepPreviousData,
  });
}

/** F5 Map: useVenuesMap — tìm sân theo bbox kèm giữ data cũ khi panning/zooming. */
export function useVenuesMap(
  query: VenueMapQuery | null,
): ReturnType<typeof useQuery<VenueMapResponse>> {
  return useQuery({
    queryKey: ['public', 'venues-map', query],
    queryFn: () => fetchVenuesMap(query!),
    enabled: Boolean(query && query.bbox),
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
