import { apiClient } from '../../../lib/api-client';

export type SportType = 'FOOTBALL5' | 'FOOTBALL7' | 'PICKLEBALL' | 'BADMINTON' | 'TENNIS';
export type VenueStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type CourtStatus = 'ACTIVE' | 'MAINTENANCE';
export type DayType = 'WEEKDAY' | 'WEEKEND';
export type ServiceType = 'BEVERAGE' | 'EQUIPMENT' | 'OTHER';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface OwnerVenue {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  district: string;
  lat?: number | null;
  lng?: number | null;
  images: string[];
  amenities: string[];
  depositPercent: number;
  openMinute: number;
  closeMinute: number;
  status: VenueStatus;
  createdAt: string;
  updatedAt: string;
  _count?: { courts: number };
}

export interface OwnerVenueListResponse {
  items: OwnerVenue[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CreateVenuePayload {
  name: string;
  address: string;
  city: string;
  district: string;
  lat?: number;
  lng?: number;
  images?: string[];
  amenities?: string[];
  depositPercent?: number;
  openMinute?: number;
  closeMinute?: number;
}

export interface UpdateVenuePayload extends Partial<CreateVenuePayload> {}

export interface Court {
  id: string;
  venueId: string;
  name: string;
  sportType: SportType;
  slotMinutes: number;
  defaultPricePerSlot: number;
  status: CourtStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourtPayload {
  name: string;
  sportType: SportType;
  slotMinutes: number;
  defaultPricePerSlot: number;
}

export interface UpdateCourtPayload extends Partial<CreateCourtPayload> {
  status?: CourtStatus;
}

export interface PricingRule {
  id: string;
  courtId: string;
  dayType: DayType;
  startMinute: number;
  endMinute: number;
  pricePerSlot: number;
}

export interface ReplacePricingRulesPayload {
  rules: Array<{
    dayType: DayType;
    startMinute: number;
    endMinute: number;
    pricePerSlot: number;
  }>;
}

export interface VenueService {
  id: string;
  venueId: string;
  name: string;
  price: number;
  type: ServiceType;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVenueServicePayload {
  name: string;
  price: number;
  type: ServiceType;
  isAvailable?: boolean;
}

export interface UpdateVenueServicePayload extends Partial<CreateVenueServicePayload> {}

export interface OwnerVoucher {
  id: string;
  code: string;
  percentOff: number;
  dayOfWeek: number;
  validFromMinute: number;
  validToMinute: number;
  usageLimit: number;
  perUserLimit: number;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
  _count?: { redemptions: number };
}

export interface CreateVoucherPayload {
  code: string;
  percentOff: number;
  dayOfWeek: number;
  validFromMinute: number;
  validToMinute: number;
  usageLimit?: number;
  perUserLimit?: number;
  expiresAt?: string | null;
}

export interface UpdateVoucherPayload extends Partial<CreateVoucherPayload> {
  active?: boolean;
}

export interface OwnerAnalyticsSeriesItem {
  date: string;
  bookings: number;
  revenueVnd: number;
}

export interface OwnerAnalyticsTopCourt {
  courtId: string;
  courtName: string;
  bookings: number;
  revenueVnd: number;
}

export interface OwnerAnalyticsResponse {
  periodDays: number;
  revenueConfirmed: number;
  totalBookings: number;
  cancelledCount: number;
  noShowCount: number;
  cancelRate: number;
  occupancyRate?: number;
  series: OwnerAnalyticsSeriesItem[];
  topCourts: OwnerAnalyticsTopCourt[];
}

export interface OwnerBookingCustomer {
  id: string;
  fullName: string;
  phone?: string | null;
  email: string;
}

export interface OwnerBookingCourt {
  id: string;
  name: string;
  sportType: SportType;
}

export interface OwnerBookingItem {
  id: string;
  code: string;
  customerId: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
  courtId: string;
  date: string;
  startMinute: number;
  endMinute: number;
  subtotal: number;
  depositAmount: number;
  status: BookingStatus;
  teamId?: string | null;
  isPublicMatch?: boolean;
  court: OwnerBookingCourt;
  customer: OwnerBookingCustomer | null;
  payments?: Array<{
    id: string;
    amount: number;
    type: string;
    status: string;
    paidAt: string | null;
  }>;
}

export interface OwnerBookingsResponse {
  items: OwnerBookingItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CheckInResponse {
  message: string;
  booking: OwnerBookingItem;
}

/* =========================================================================
 * 1. VENUES & COURTS
 * ========================================================================= */

/** Lấy danh sách cụm sân của Owner */
export async function getOwnerVenuesApi(params?: { page?: number; limit?: number }): Promise<OwnerVenueListResponse> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  return apiClient<OwnerVenueListResponse>(`/venues/mine?page=${page}&limit=${limit}`);
}

/** Đăng ký cụm sân mới (PENDING) */
export async function createVenueApi(payload: CreateVenuePayload): Promise<OwnerVenue> {
  return apiClient<OwnerVenue>('/venues', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Cập nhật thông tin cụm sân */
export async function updateVenueApi(id: string, payload: UpdateVenuePayload): Promise<OwnerVenue> {
  return apiClient<OwnerVenue>(`/venues/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/** Xóa cụm sân */
export async function deleteVenueApi(id: string): Promise<void> {
  return apiClient<void>(`/venues/${id}`, {
    method: 'DELETE',
  });
}

/** Lấy danh sách sân con của một cụm sân */
export async function getVenueCourtsApi(venueId: string): Promise<Court[]> {
  return apiClient<Court[]>(`/venues/${venueId}/courts`);
}

/** Thêm sân con mới */
export async function createCourtApi(venueId: string, payload: CreateCourtPayload): Promise<Court> {
  return apiClient<Court>(`/venues/${venueId}/courts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Cập nhật thông tin / trạng thái bảo trì của sân con */
export async function updateCourtApi(courtId: string, payload: UpdateCourtPayload): Promise<Court> {
  return apiClient<Court>(`/courts/${courtId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/** Xóa sân con */
export async function deleteCourtApi(courtId: string): Promise<void> {
  return apiClient<void>(`/courts/${courtId}`, {
    method: 'DELETE',
  });
}

/* =========================================================================
 * 2. PRICING RULES
 * ========================================================================= */

/** Lấy danh sách bảng giá của sân con */
export async function getCourtPricingRulesApi(courtId: string): Promise<PricingRule[]> {
  return apiClient<PricingRule[]>(`/courts/${courtId}/pricing-rules`);
}

/** Lưu bảng giá giờ vàng mới (ghi đè toàn bộ rules) */
export async function replaceCourtPricingRulesApi(
  courtId: string,
  payload: ReplacePricingRulesPayload,
): Promise<{ success: boolean; count: number }> {
  return apiClient<{ success: boolean; count: number }>(`/courts/${courtId}/pricing-rules`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/* =========================================================================
 * 3. VENUE SERVICES
 * ========================================================================= */

/** Lấy menu dịch vụ của cụm sân */
export async function getVenueServicesApi(venueId: string): Promise<VenueService[]> {
  return apiClient<VenueService[]>(`/owner/venues/${venueId}/services`);
}

/** Thêm dịch vụ tiện ích mới */
export async function createOwnerServiceApi(
  venueId: string,
  payload: CreateVenueServicePayload,
): Promise<VenueService> {
  return apiClient<VenueService>(`/owner/venues/${venueId}/services`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Cập nhật dịch vụ / bật tắt mở bán */
export async function updateOwnerServiceApi(
  venueId: string,
  serviceId: string,
  payload: UpdateVenueServicePayload,
): Promise<VenueService> {
  return apiClient<VenueService>(`/owner/venues/${venueId}/services/${serviceId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/** Xóa dịch vụ */
export async function deleteOwnerServiceApi(venueId: string, serviceId: string): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/owner/venues/${venueId}/services/${serviceId}`, {
    method: 'DELETE',
  });
}

/* =========================================================================
 * 4. VOUCHERS
 * ========================================================================= */

/** Danh sách voucher của chủ sân */
export async function getOwnerVouchersApi(): Promise<OwnerVoucher[]> {
  return apiClient<OwnerVoucher[]>('/owner/vouchers');
}

/** Tạo voucher mới */
export async function createOwnerVoucherApi(payload: CreateVoucherPayload): Promise<{ id: string; code: string }> {
  return apiClient<{ id: string; code: string }>('/owner/vouchers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Cập nhật voucher / bật tắt active */
export async function updateOwnerVoucherApi(id: string, payload: UpdateVoucherPayload): Promise<void> {
  return apiClient<void>(`/owner/vouchers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/** Xóa voucher */
export async function deleteOwnerVoucherApi(id: string): Promise<void> {
  return apiClient<void>(`/owner/vouchers/${id}`, {
    method: 'DELETE',
  });
}

/* =========================================================================
 * 5. ANALYTICS
 * ========================================================================= */

/** Báo cáo doanh thu và hiệu suất lấp đầy sân */
export async function getOwnerAnalyticsApi(venueId?: string, days = 30): Promise<OwnerAnalyticsResponse> {
  const query = new URLSearchParams({ days: String(days) });
  if (venueId) query.append('venueId', venueId);
  const response = await apiClient<{
    meta: { days: number };
    summary: Pick<OwnerAnalyticsResponse, 'revenueConfirmed' | 'totalBookings' | 'cancelledCount' | 'noShowCount' | 'cancelRate'>;
    series: Array<{ date: string; bookings: number; revenue: number }>;
    topCourts: Array<{ courtId: string; courtName: string; bookings: number; revenue: number }>;
  }>(`/owner/analytics?${query.toString()}`);
  return {
    periodDays: response.meta.days, ...response.summary,
    series: response.series.map(({ revenue, ...point }) => ({ ...point, revenueVnd: revenue })),
    topCourts: response.topCourts.map(({ revenue, ...court }) => ({ ...court, revenueVnd: revenue })),
  };
}

/* =========================================================================
 * 6. OWNER BOOKINGS & CHECK-IN & NO-SHOW
 * ========================================================================= */

export async function createWalkInBookingApi(payload: {
  courtId: string; date: string; startMinute: number; endMinute: number;
  guestName: string; guestPhone?: string;
}): Promise<OwnerBookingItem> {
  return apiClient<OwnerBookingItem>('/owner/bookings/walk-in', {
    method: 'POST', body: JSON.stringify(payload),
  });
}

/** Danh sách đơn đặt theo cụm sân của Owner */
export async function getOwnerBookingsApi(params: {
  venueId: string;
  date?: string;
  status?: BookingStatus;
  page?: number;
  limit?: number;
}): Promise<OwnerBookingsResponse> {
  const query = new URLSearchParams({
    venueId: params.venueId,
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });
  if (params.date) query.append('date', params.date);
  if (params.status) query.append('status', params.status);

  return apiClient<OwnerBookingsResponse>(`/owner/bookings?${query.toString()}`);
}

/** Check-in bằng mã đơn vé CH-YYYYMMDD-NNNN */
export async function checkInBookingApi(code: string): Promise<CheckInResponse> {
  return apiClient<CheckInResponse>('/bookings/check-in', {
    method: 'POST',
    body: JSON.stringify({ code: code.trim() }),
  });
}

/** Đánh dấu khách không đến (NO_SHOW) */
export async function markNoShowBookingApi(bookingId: string): Promise<OwnerBookingItem> {
  return apiClient<OwnerBookingItem>(`/bookings/${bookingId}/no-show`, {
    method: 'POST',
  });
}
