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
    isMaintenance: boolean;
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
  customerEmail: string;
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

export interface AdminTournament {
  id: string;
  name: string;
  sportType: SportType;
  maxTeams: number;
  prizePoolVnd?: number;
  status: 'REGISTRATION' | 'ONGOING' | 'COMPLETED';
  startDate?: string;
  endDate?: string;
  venueName?: string;
  teamsCount?: number;
  matches?: Array<{
    id: string;
    round: number;
    position: number;
    teamAName?: string;
    teamBName?: string;
    scoreA?: number;
    scoreB?: number;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
    winnerTeamName?: string;
  }>;
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
  isMaintenance: boolean;
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

export async function getAdminTournaments(): Promise<AdminTournament[]> {
  try {
    return await apiClient<AdminTournament[]>('/tournaments');
  } catch {
    return [];
  }
}

export async function createAdminTournament(data: {
  name: string;
  sportType: SportType;
  maxTeams: number;
  venueId?: string;
  prizePoolVnd?: number;
}): Promise<AdminTournament> {
  return apiClient<AdminTournament>('/tournaments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function startAdminTournament(id: string): Promise<AdminTournament> {
  return apiClient<AdminTournament>(`/tournaments/${id}/start`, {
    method: 'POST',
  });
}

export async function updateAdminMatchScore(
  matchId: string,
  scoreA: number,
  scoreB: number,
): Promise<unknown> {
  return apiClient(`/matches/${matchId}/score`, {
    method: 'PATCH',
    body: JSON.stringify({ scoreA, scoreB }),
  });
}

export async function toggleAdminCourtMaintenance(
  courtId: string,
  isMaintenance: boolean,
): Promise<unknown> {
  return apiClient(`/courts/${courtId}/maintenance`, {
    method: 'PATCH',
    body: JSON.stringify({ isMaintenance }),
  });
}
