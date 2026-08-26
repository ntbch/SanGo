/** Kiểu dữ liệu khu admin — khớp phản hồi backend (admin module). */
import type { VenueStatus } from '@sango/shared';

export interface AdminVenueItem {
  id: string;
  name: string;
  slug: string;
  address: string;
  images: string[];
  amenities: string[];
  depositPercent: number | null;
  openMinute: number;
  closeMinute: number;
  /** Đủ 4 trạng thái theo @sango/shared (gồm SUSPENDED từ t8). */
  status: VenueStatus;
  rejectReason?: string | null;
  createdAt?: string;
  courtsCount?: number;
  /** Chủ sân do backend include khi list (t8). */
  owner?: { fullName: string; email: string } | null;
}

export interface AdminVenuesResponse {
  items: AdminVenueItem[];
  total: number;
  page?: number;
  limit?: number;
  pages?: number;
}

/* --------- Tổng quan nền tảng — GET /admin/stats (backend viết song song) --------- */

export interface AdminStatsVenueTotals {
  total: number;
  PENDING: number;
  APPROVED: number;
  REJECTED: number;
  SUSPENDED: number;
}

export interface AdminStatsTotals {
  users: number;
  customers: number;
  owners: number;
  venues: AdminStatsVenueTotals;
  bookingsTotal: number;
  bookingsToday: number;
  revenueTodayVnd: number;
}

/** Một điểm chuỗi theo ngày — date dạng YYYY-MM-DD. */
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

export type AdminActivityType = 'VENUE_SUBMITTED' | 'BOOKING_CREATED';

export interface AdminRecentActivity {
  type: AdminActivityType;
  /** ISO timestamp. */
  at: string;
  label: string;
}

/** Phản hồi GET /admin/stats — chỉ đọc, phục vụ tổng quan ADMIN trên /dashboard. */
export interface AdminStatsResponse {
  totals: AdminStatsTotals;
  series: AdminStatsSeriesPoint[];
  topVenues: AdminStatsTopVenue[];
  recentActivity: AdminRecentActivity[];
}
/* --------------- Quản lý người dùng — GET/PATCH /admin/users (t7) --------------- */

export type AdminUserRole = 'CUSTOMER' | 'OWNER' | 'ADMIN';

export type AdminUserStatus = 'ACTIVE' | 'LOCKED';

export interface AdminUserItem {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: AdminUserRole;
  status: AdminUserStatus;
  /** ISO timestamp tạo tài khoản. */
  createdAt: string;
  /** Số đơn đặt đã phát sinh của user (đọc-only, từ backend). */
  bookingCount: number;
}

export interface AdminUsersResponse {
  items: AdminUserItem[];
  total: number;
  page: number;
  limit: number;
}
/* ---------------- Quản lý đơn toàn hệ thống — GET /admin/bookings (t9) ---------------- */

export type AdminBookingStatus =
  'PENDING_PAYMENT' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

/** Khớp AdminBookingListItem của backend (t4). */
export interface AdminBookingItem {
  id: string;
  code: string;
  venueId: string;
  venueName: string;
  courtName: string;
  customerName: string;
  customerEmail: string;
  /** ISO datetime bắt đầu/kết thúc giờ chơi. */
  startTime: string;
  endTime: string;
  status: AdminBookingStatus;
  totalPriceVnd: number;
  createdAt: string;
}

export interface AdminBookingsResponse {
  items: AdminBookingItem[];
  total: number;
  page?: number;
  limit?: number;
}
