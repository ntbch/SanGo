import { apiClient } from '../../../lib/api-client';
import { BookingStatus, SportType } from '../../../lib/constants';

export type SlotState = 'AVAILABLE' | 'BOOKED' | 'HELD' | 'MAINTENANCE';

export interface DaySlotItem {
  startMinute: number;
  endMinute: number;
  state: SlotState;
}

export interface DaySlotsResponse {
  date: string;
  slots: DaySlotItem[];
}

export interface CourtSlotsResponse {
  courtId: string;
  courtStatus: string;
  slotMinutes: number;
  from: string;
  days: number;
  byDate: DaySlotsResponse[];
}

export interface CreateHoldParams {
  courtId: string;
  date: string; // YYYY-MM-DD
  startMinute: number;
  endMinute: number;
  teamId?: string;
}

export interface BookingHoldResponse {
  id: string;
  courtId: string;
  customerId: string;
  date: string;
  startMinute: number;
  endMinute: number;
  subtotal: number;
  discountAmount?: number | null;
  finalAmount?: number | null;
  voucherId?: string | null;
  status: 'ACTIVE' | 'CONVERTED' | 'EXPIRED';
  expiresAt: string;
  court?: {
    id: string;
    name: string;
    sportType: SportType;
    slotMinutes: number;
    defaultPricePerSlot: number;
    venue: {
      id: string;
      name: string;
      slug: string;
      address: string;
      district: string;
      city: string;
      depositPercent: number;
      images: string[];
    };
  };
}

export interface CreateCheckoutParams {
  holdId: string;
  type: 'DEPOSIT' | 'FULL';
}

export interface CheckoutResponse {
  txnRef: string;
  amount: number;
  type: 'DEPOSIT' | 'FULL';
  mode: 'mock' | 'vnpay';
  paymentUrl: string;
}

export interface BookingTicketItem {
  id: string;
  code: string;
  courtId: string;
  customerId: string;
  date: string;
  startMinute: number;
  endMinute: number;
  status: BookingStatus;
  totalPrice: number;
  depositAmount: number;
  paidAmount: number;
  qrCodeUrl?: string;
  checkInToken?: string;
  court: {
    name: string;
    sportType: SportType;
    venue: {
      id: string;
      name: string;
      slug: string;
      address: string;
      district: string;
      city: string;
    };
  };
  createdAt: string;
}

export interface MyBookingsResponse {
  items: BookingTicketItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 1. Lấy lịch trống theo tuần của sân con
export async function getCourtSlotsApi(courtId: string, fromDate: string, days = 7): Promise<CourtSlotsResponse> {
  return apiClient<CourtSlotsResponse>(`/courts/${courtId}/slots`, {
    params: {
      from: fromDate,
      days,
    },
  });
}

// 2. Tạo giữ chỗ 10 phút chống trùng lịch
export async function createBookingHoldApi(params: CreateHoldParams): Promise<BookingHoldResponse> {
  return apiClient<BookingHoldResponse>('/bookings/holds', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// 3. Lấy thông tin giữ chỗ & đồng hồ đếm ngược
export async function getBookingHoldApi(holdId: string): Promise<BookingHoldResponse> {
  return apiClient<BookingHoldResponse>(`/bookings/holds/${holdId}`);
}

// 4. Áp dụng voucher vào đơn giữ chỗ
export async function applyHoldVoucherApi(holdId: string, code: string): Promise<BookingHoldResponse> {
  return apiClient<BookingHoldResponse>(`/holds/${holdId}/voucher`, {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

// 5. Hủy / giải phóng giữ chỗ sớm
export async function releaseBookingHoldApi(holdId: string): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/bookings/holds/${holdId}`, {
    method: 'DELETE',
  });
}

// 6. Khởi tạo thanh toán (Cọc 30% hoặc Trả hết 100%)
export async function createCheckoutApi(params: CreateCheckoutParams): Promise<CheckoutResponse> {
  return apiClient<CheckoutResponse>('/payments/checkout', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// 7. Lấy danh sách vé đặt sân của tôi
export async function getMyBookingsApi(params: {
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<MyBookingsResponse> {
  return apiClient<MyBookingsResponse>('/bookings/me', {
    params: {
      status: params.status || undefined,
      page: params.page || 1,
      limit: params.limit || 10,
    },
  });
}

// 8. Hủy đơn đặt sân & yêu cầu hoàn cọc
export async function cancelBookingApi(bookingId: string, reason: string): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/bookings/${bookingId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
