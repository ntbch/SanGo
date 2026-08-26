import type { VenueStatus } from '@sango/shared';

import { apiFetch } from '../../lib/api/client';
import { endpoints } from '../../lib/api/endpoints';

import type {
  AdminBookingStatus,
  AdminBookingsResponse,
  AdminStatsResponse,
  AdminUserItem,
  AdminUserRole,
  AdminUsersResponse,
  AdminUserStatus,
  AdminVenueItem,
  AdminVenuesResponse,
} from './types';

export interface AdminVenuesFilters {
  status?: VenueStatus;
  q?: string;
  page?: number;
  limit?: number;
}

/** GET /admin/venues — MỌI cụm sân, lọc status (gồm SUSPENDED) + tìm tên (t8). */
export function fetchAdminVenues(filters: AdminVenuesFilters = {}): Promise<AdminVenuesResponse> {
  return apiFetch<AdminVenuesResponse>(endpoints.admin.venues({ ...filters }));
}

export function approveVenue(id: string): Promise<AdminVenueItem> {
  return apiFetch<AdminVenueItem>(endpoints.admin.approve(id), { method: 'POST' });
}

/** Từ chối kèm lý do — lưu rejectReason để owner sửa và gửi lại. */
export function rejectVenue(id: string, reason: string): Promise<AdminVenueItem> {
  return apiFetch<AdminVenueItem>(endpoints.admin.reject(id), { method: 'POST', body: { reason } });
}
/**
 * GET /admin/stats?days=N — tổng quan hệ thống chỉ-đọc (dashboard + trang
 * Thống kê nền tảng); KHÔNG dùng để duyệt/huỷ. days mặc định của backend là 14.
 */
export function fetchAdminStats(days?: number): Promise<AdminStatsResponse> {
  return apiFetch<AdminStatsResponse>(endpoints.admin.stats({ days }));
}
export interface AdminUsersFilters {
  page?: number;
  limit?: number;
  q?: string;
  role?: AdminUserRole;
  status?: AdminUserStatus;
}

/** GET /admin/users — danh sách người dùng có tìm kiếm/lọc/phân trang (t7). */
export function fetchAdminUsers(filters: AdminUsersFilters = {}): Promise<AdminUsersResponse> {
  return apiFetch<AdminUsersResponse>(endpoints.admin.users({ ...filters }));
}

/**
 * PATCH /admin/users/:id/status — khoá ({status:'LOCKED'}) hoặc mở khoá
 * ({status:'ACTIVE'}). Backend chặn CANNOT_LOCK_SELF/CANNOT_LOCK_ADMIN.
 */
export function setUserStatus(id: string, status: AdminUserStatus): Promise<AdminUserItem> {
  return apiFetch<AdminUserItem>(endpoints.admin.userStatus(id), {
    method: 'PATCH',
    body: { status },
  });
}
export interface AdminBookingsFilters {
  page?: number;
  limit?: number;
  date?: string;
  status?: AdminBookingStatus;
  venueId?: string;
  search?: string;
}

/** GET /admin/bookings — tra cứu đơn toàn hệ thống có lọc/phân trang (t9). */
export function fetchAdminBookings(
  filters: AdminBookingsFilters = {},
): Promise<AdminBookingsResponse> {
  return apiFetch<AdminBookingsResponse>(endpoints.admin.bookings({ ...filters }));
}

/**
 * DELETE /bookings/:id — huỷ HỘ người dùng (ADMIN/chủ sân cụm sân/chủ đơn).
 * Reason truyền qua BODY JSON {"reason"} (UI bắt buộc nhập, tối đa 300 ký tự)
 * dù backend chấp nhận optional; quyền kiểm tra ở service, người khác bị 403.
 */
export function adminCancelBooking(id: string, reason: string): Promise<void> {
  return apiFetch<void>(endpoints.bookings.cancel(id), {
    method: 'DELETE',
    body: { reason },
  });
}
/**
 * PATCH /admin/venues/:id/status — Tạm ngưng (SUSPENDED) hoặc Kích hoạt lại
 * (APPROVED). Backend chặn chuyển đổi không hợp lệ (INVALID_STATUS_TRANSITION).
 */
export function setVenueStatus(
  id: string,
  status: Extract<VenueStatus, 'APPROVED' | 'SUSPENDED'>,
): Promise<AdminVenueItem> {
  return apiFetch<AdminVenueItem>(endpoints.admin.venueStatus(id), {
    method: 'PATCH',
    body: { status },
  });
}
