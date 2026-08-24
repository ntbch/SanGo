import { apiFetch } from '../../lib/api/client';
import { endpoints } from '../../lib/api/endpoints';

import type {
  CourtRow,
  OwnerAnalyticsResponse,
  OwnerBooking,
  OwnerVenue,
  Paginated,
  PricingRule,
} from './types';

/** Payload tạo/sửa venue — khớp CreateVenueSchema của backend. */
export interface VenueFormPayload {
  name: string;
  address: string;
  lat: number;
  lng: number;
  openMinute: number;
  closeMinute: number;
  depositPercent?: number;
  images?: string[];
  amenities?: string[];
}

/** Payload tạo/sửa sân con — khớp CreateCourtSchema. */
export interface CourtFormPayload {
  name: string;
  sportType: string;
  slotMinutes: 60 | 90;
  defaultPricePerSlot: number;
  status?: 'ACTIVE' | 'MAINTENANCE';
}

/** GET /venues/mine — sân của owner (ADMIN xem tất cả). */
export function fetchMyVenues(page = 1): Promise<Paginated<OwnerVenue>> {
  return apiFetch<Paginated<OwnerVenue>>(endpoints.venues.mine({ page, limit: 20 }));
}

export function createVenue(values: VenueFormPayload): Promise<OwnerVenue> {
  return apiFetch<OwnerVenue>(endpoints.venues.create(), { method: 'POST', body: values });
}

export function updateVenue(id: string, values: Partial<VenueFormPayload>): Promise<OwnerVenue> {
  return apiFetch<OwnerVenue>(endpoints.venues.update(id), { method: 'PUT', body: values });
}

export function deleteVenue(id: string): Promise<void> {
  return apiFetch<void>(endpoints.venues.remove(id), { method: 'DELETE' });
}

export function fetchCourtsOfVenue(venueId: string): Promise<{ items: CourtRow[] }> {
  return apiFetch<{ items: CourtRow[] }>(endpoints.venues.courtsByVenue(venueId));
}

export function createCourt(venueId: string, values: CourtFormPayload): Promise<CourtRow> {
  return apiFetch<CourtRow>(endpoints.venues.addCourt(venueId), { method: 'POST', body: values });
}

export function updateCourt(courtId: string, patch: Partial<CourtFormPayload>): Promise<CourtRow> {
  return apiFetch<CourtRow>(endpoints.venues.updateCourt(courtId), { method: 'PUT', body: patch });
}

export function removeCourt(courtId: string): Promise<void> {
  return apiFetch<void>(endpoints.venues.removeCourt(courtId), { method: 'DELETE' });
}

export async function fetchPricingRules(courtId: string): Promise<{ rules: PricingRule[] }> {
  const data = await apiFetch<{ rules?: PricingRule[] }>(endpoints.venues.getPricingRules(courtId));
  return { rules: data.rules ?? [] };
}

/** REPLACE-ALL: gửi trọn bộ rules mới. */
export function savePricingRules(courtId: string, rules: PricingRule[]): Promise<void> {
  return apiFetch<void>(endpoints.venues.replacePricingRules(courtId), {
    method: 'PUT',
    body: { rules },
  });
}

export interface OwnerBookingsFilters {
  venueId?: string;
  date?: string;
  status?: string;
}

/** GET /owner/bookings — venueId bắt buộc theo contract. */
export function fetchOwnerBookings(
  filters: OwnerBookingsFilters,
): Promise<Paginated<OwnerBooking>> {
  return apiFetch<Paginated<OwnerBooking>>(
    endpoints.owner.bookings({
      venueId: filters.venueId ?? '',
      date: filters.date,
      status: filters.status,
    }),
  );
}

/** GET /owner/analytics — thống kê cụm sân theo khoảng days ngày (§3.10). */
export function fetchOwnerAnalytics(
  venueId: string,
  days: number,
): Promise<OwnerAnalyticsResponse> {
  return apiFetch<OwnerAnalyticsResponse>(endpoints.owner.analytics({ venueId, days }));
}

export function checkInByCode(code: string): Promise<OwnerBooking> {
  return apiFetch<OwnerBooking>(endpoints.bookings.checkIn(), { method: 'POST', body: { code } });
}

export function markNoShow(bookingId: string): Promise<OwnerBooking> {
  return apiFetch<OwnerBooking>(endpoints.bookings.noShow(bookingId), { method: 'POST' });
}

/** Huỷ hộ khách — dùng chung DELETE /bookings/:id của contract. */
export function cancelBookingAsOwner(bookingId: string): Promise<void> {
  return apiFetch<void>(endpoints.bookings.cancel(bookingId), { method: 'DELETE' });
}
