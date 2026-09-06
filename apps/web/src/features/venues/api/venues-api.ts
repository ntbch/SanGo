import { apiClient } from '../../../lib/api-client';
import { SportType } from '../../../lib/constants';

export interface CourtItem {
  id: string;
  name: string;
  sportType: SportType;
  slotMinutes: number;
  defaultPricePerSlot: number;
}

export interface VenueItem {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  district: string;
  lat: number;
  lng: number;
  openMinute: number;
  closeMinute: number;
  depositPercent: number;
  images: string[];
  amenities: string[];
  priceFrom?: number | null;
  priceTo?: number | null;
  sportTypes?: SportType[];
  availableSports?: SportType[];
  totalCourts?: number;
  courtsCount?: number;
  distanceKm?: number | null;
  avgRating?: number | null;
  reviewsCount?: number;
  courts?: CourtItem[];
}

export interface VenueListResponse {
  items: VenueItem[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  pages?: number;
}

export interface VenueFilters {
  sportType?: string;
  city?: string;
  district?: string;
  q?: string;
  sortBy?: 'distance' | 'price_asc' | 'price_desc';
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  amenities?: string[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  radiusKm?: number;
  userLat?: number;
  userLng?: number;
  page?: number;
  limit?: number;
}

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  customer?: {
    fullName: string;
  };
}

export interface VenueReviewsResponse {
  items: ReviewItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
  avgRating: number | null;
}

export async function getVenuesListApi(params: VenueFilters = {}): Promise<VenueListResponse> {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params.sportType) queryParams.sportType = params.sportType;
  if (params.q) queryParams.q = params.q;
  if (params.city && (params.city === 'Hà Nội' || params.city === 'TP. Hồ Chí Minh')) {
    queryParams.city = params.city;
  }
  if (params.district) queryParams.district = params.district;
  if (params.userLat !== undefined) queryParams.userLat = params.userLat;
  if (params.userLng !== undefined) queryParams.userLng = params.userLng;
  if (params.radiusKm !== undefined) queryParams.radiusKm = params.radiusKm;
  if (params.sortBy && ['distance', 'price_asc', 'price_desc'].includes(params.sortBy)) {
    queryParams.sortBy = params.sortBy;
  }
  if (params.page !== undefined) queryParams.page = params.page;
  if (params.limit !== undefined) queryParams.limit = params.limit;

  try {
    const res = await apiClient<VenueListResponse>('/venues', {
      params: queryParams,
    });

    let items = Array.isArray(res?.items) ? res.items : [];

    // Public list response may return courts without aggregate prices.
    // Normalize the same source used by the map so every marker can show a price.
    items = items.map((venue) => {
      if (venue.priceFrom !== undefined && venue.priceFrom !== null) return venue;
      const prices = (venue.courts ?? [])
        .map((court) => court.defaultPricePerSlot)
        .filter((price): price is number => typeof price === 'number');
      return {
        ...venue,
        priceFrom: prices.length > 0 ? Math.min(...prices) : null,
        priceTo: prices.length > 0 ? Math.max(...prices) : null,
      };
    });

    if (params.minPrice !== undefined) {
      items = items.filter((v) => (v.priceFrom ?? 0) >= (params.minPrice || 0));
    }
    if (params.maxPrice !== undefined) {
      items = items.filter((v) => (v.priceFrom ?? 0) <= (params.maxPrice || 1500000));
    }
    if (params.minRating !== undefined && params.minRating > 0) {
      items = items.filter((v) => (v.avgRating ?? 5.0) >= (params.minRating || 0));
    }
    if (params.amenities && params.amenities.length > 0) {
      items = items.filter((v) =>
        params.amenities!.every((a) => v.amenities?.includes(a)),
      );
    }

    return {
      items,
      total: res?.total ?? items.length,
      page: res?.page ?? params.page ?? 1,
      limit: res?.limit ?? params.limit ?? 12,
      totalPages: res?.totalPages ?? res?.pages ?? Math.max(1, Math.ceil((res?.total ?? items.length) / (params.limit || 12))),
    };
  } catch (err) {
    console.error('[getVenuesListApi] Failed to fetch venues:', err);
    throw err;
  }
}

export async function getVenuesMapApi(params: {
  bbox: string;
  sportType?: string;
  q?: string;
  limit?: number;
}): Promise<{ items: VenueItem[]; total: number; bounds?: string }> {
  const queryParams: Record<string, string | number> = { bbox: params.bbox };
  if (params.sportType) queryParams.sportType = params.sportType;
  if (params.q) queryParams.q = params.q;
  if (params.limit) queryParams.limit = params.limit;

  return apiClient<{ items: VenueItem[]; total: number; bounds?: string }>('/venues/map', {
    params: queryParams,
  });
}

export async function getVenueDetailApi(slugOrId: string): Promise<VenueItem> {
  return apiClient<VenueItem>(`/venues/${slugOrId}`);
}

export async function getVenueReviewsApi(
  slugOrId: string,
  params: { page?: number; size?: number } = {},
): Promise<VenueReviewsResponse> {
  return apiClient<VenueReviewsResponse>(`/venues/${slugOrId}/reviews`, {
    params: {
      page: params.page || 1,
      size: params.size || 10,
    },
  });
}
