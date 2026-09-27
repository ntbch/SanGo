import { apiClient } from '../../../lib/api-client';
import { BookingStatus, UserRole, UserStatus, VenueStatus, SportType } from '@sango/shared';

export interface AdminStatsTotals {
  users: number;
  customers: number;
  owners: number;
  venues: { total: number; PENDING: number; APPROVED: number; REJECTED: number; SUSPENDED: number };
  bookingsTotal: number;
  bookingsToday: number;
  revenueTodayVnd: number;
}

export interface AdminStatsSeriesPoint {
  date: string;
  bookings: number;
  revenueVnd: number;
}

export interface AdminStatsTopVenue {
  venueId: string;
  name: string;
  bookings: number;
  revenueVnd: number;
}

export interface AdminStatsActivityItem {
  type: 'VENUE_SUBMITTED' | 'BOOKING_CREATED';
  at: string;
  label: string;
}

export interface AdminStatsResponse {
  totals: AdminStatsTotals;
  series: AdminStatsSeriesPoint[];
  topVenues: AdminStatsTopVenue[];
  recentActivity: AdminStatsActivityItem[];
}

export interface AdminVenueListItem {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  district: string;
  images: string[];
  amenities: string[];
  depositPercent: number;
  openMinute: number;
  closeMinute: number;
  status: VenueStatus;
  rejectReason?: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    fullName: string;
    email: string;
  };
  _count: {
    courts: number;
  };
}

export interface AdminVenueListResponse {
  items: AdminVenueListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AdminVenueDetail {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  district: string;
  description?: string | null;
  images: string[];
  amenities: string[];
  depositPercent: number;
  openMinute: number;
  closeMinute: number;
  status: VenueStatus;
  rejectReason?: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
  };
  courts: Array<{
    id: string;
    name: string;
    sportType: SportType;
    status: 'ACTIVE' | 'MAINTENANCE';
    pricingTier?: string | null;
  }>;
}

export interface AdminUserListItem {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  bookingCount: number;
}

export interface AdminUserListResponse {
  items: AdminUserListItem[];
  total: number;
}

export interface AdminBookingListItem {
  id: string;
  code: string;
  venueId: string;
  venueName: string;
  courtName: string;
  customerName: string;
  customerEmail: string | null;
  guestPhone?: string | null;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalPriceVnd: number;
  createdAt: string;
}

export interface AdminBookingListResponse {
  items: AdminBookingListItem[];
  total: number;
}


export interface AdminVoucher {
  id: string;
  code: string;
  discountPercent?: number;
  discountVnd?: number;
  maxDiscountVnd?: number;
  minOrderVnd?: number;
  maxUses?: number;
  usedCount?: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  venueId?: string | null;
  venueName?: string;
}

export interface AdminCourtItem {
  id: string;
  venueId: string;
  venueName: string;
  name: string;
  sportType: SportType;
  status: 'ACTIVE' | 'MAINTENANCE';
  basePricePerHour?: number;
}

/* ========================================================================= */
/*                          ADMIN API CALLERS                                */
/* ========================================================================= */

export async function getAdminStats(days: number = 14): Promise<AdminStatsResponse> {
  return apiClient<AdminStatsResponse>('/admin/stats', {
    params: { days },
  });
}

export async function getAdminVenues(params?: {
  status?: VenueStatus;
  q?: string;
  page?: number;
  limit?: number;
}): Promise<AdminVenueListResponse> {
  return apiClient<AdminVenueListResponse>('/admin/venues', {
    params: {
      status: params?.status,
      q: params?.q,
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    },
  });
}

export async function getAdminVenueDetail(id: string): Promise<AdminVenueDetail> {
  return apiClient<AdminVenueDetail>(`/admin/venues/${id}`);
}

export async function approveVenue(id: string): Promise<{ id: string; status: VenueStatus }> {
  return apiClient<{ id: string; status: VenueStatus }>(`/admin/venues/${id}/approve`, {
    method: 'POST',
  });
}

export async function rejectVenue(
  id: string,
  reason: string,
): Promise<{ id: string; status: VenueStatus; rejectReason: string }> {
  return apiClient<{ id: string; status: VenueStatus; rejectReason: string }>(
    `/admin/venues/${id}/reject`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
  );
}

export async function updateVenueStatus(
  id: string,
  status: 'APPROVED' | 'SUSPENDED',
): Promise<{ id: string; status: VenueStatus }> {
  return apiClient<{ id: string; status: VenueStatus }>(`/admin/venues/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function getAdminUsers(params?: {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  pageSize?: number;
}): Promise<AdminUserListResponse> {
  return apiClient<AdminUserListResponse>('/admin/users', {
    params: {
      search: params?.search,
      role: params?.role,
      status: params?.status,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    },
  });
}

export async function updateUserStatus(
  userId: string,
  status: UserStatus,
): Promise<{ id: string; status: UserStatus }> {
  return apiClient<{ id: string; status: UserStatus }>(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function getAdminBookings(params?: {
  date?: string;
  status?: BookingStatus;
  venueId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminBookingListResponse> {
  return apiClient<AdminBookingListResponse>('/admin/bookings', {
    params: {
      date: params?.date,
      status: params?.status,
      venueId: params?.venueId,
      search: params?.search,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    },
  });
}





export async function toggleAdminCourtMaintenance(
  courtId: string,
  isMaintenance: boolean,
): Promise<unknown> {
  // Contract fix: BE chỉ có PUT /courts/:id (UpdateCourtSchema có status ACTIVE|MAINTENANCE)
  return apiClient(`/courts/${courtId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: isMaintenance ? 'MAINTENANCE' : 'ACTIVE' }),
  });
}
