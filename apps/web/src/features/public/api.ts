import { apiFetch } from '../../lib/api/client';
import { endpoints } from '../../lib/api/endpoints';

import type {
  PaginatedReviews,
  PaginatedVenues,
  VenueDetail,
  VenueMapQuery,
  VenueMapResponse,
} from './types';

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

/** F5 Map: GET /venues/map — tìm sân theo viewport bounding box kèm aggregate giá. */
export function fetchVenuesMap(query: VenueMapQuery): Promise<VenueMapResponse> {
  return apiFetch<VenueMapResponse>(endpoints.venues.map(query));
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
