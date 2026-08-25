import { apiFetch } from '../../lib/api/client';
import { endpoints } from '../../lib/api/endpoints';

import type { PaginatedReviews, PaginatedVenues, VenueDetail } from './types';

/** Bộ lọc trang danh sách — khớp VenueListQueryDto của backend. */
export interface VenueFilters {
  q?: string;
  sportType?: string;
  city?: string;
  district?: string;
  userLat?: number;
  userLng?: number;
  radiusKm?: number;
  sortBy?: string;
  page?: number;
}

/** GET /venues — danh sách cụm sân APPROVED. */
export function fetchVenues(filters: VenueFilters): Promise<PaginatedVenues> {
  return apiFetch<PaginatedVenues>(endpoints.venues.list(filters));
}

/** GET /venues/:slug — chi tiết cụm sân + sân con ACTIVE. */
export function fetchVenueDetail(slugOrId: string): Promise<VenueDetail> {
  return apiFetch<VenueDetail>(endpoints.venues.detail(slugOrId));
}

/** GET /venues/:slug/reviews — đánh giá phân trang. */
export function fetchVenueReviews(
  slugOrId: string,
  query: { page?: number; size?: number } = {},
): Promise<PaginatedReviews> {
  return apiFetch<PaginatedReviews>(endpoints.venues.reviews(slugOrId, query));
}
