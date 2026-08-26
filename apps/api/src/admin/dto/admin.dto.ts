import type {
  BookingStatus as PrismaBookingStatus,
  UserStatus as PrismaUserStatus,
  UserRole as PrismaUserRole,
} from '@prisma/client';
import { z } from 'zod';
import { BookingStatus, UserStatus, UserRole, VenueStatus } from '@sango/shared';

export const AdminVenueListQuerySchema = z.object({
  status: z.nativeEnum(VenueStatus).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type AdminVenueListQueryDto = z.infer<typeof AdminVenueListQuerySchema>;

export const RejectVenueSchema = z.object({
  reason: z.string().trim().min(4, 'Vui lòng nêu lý do từ chối (tối thiểu 4 ký tự)').max(500),
});
export type RejectVenueDto = z.infer<typeof RejectVenueSchema>;

export const AdminStatsQuerySchema = z.object({
  /** Số ngày của chuỗi thống kê tính đến hôm nay (mặc định 14, tối đa 90). */
  days: z.coerce.number().int().min(1).max(90).default(14),
});
export type AdminStatsQueryDto = z.infer<typeof AdminStatsQuerySchema>;

/* Response GET /admin/stats — tên field khớp chặt contract dashboard admin. */

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
  /** YYYY-MM-DD, đủ `days` điểm liên tục (zero-fill ngày không có dữ liệu). */
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
  /** ISO timestamp của sự kiện. */
  at: string;
  label: string;
}

export interface AdminStatsResponse {
  totals: AdminStatsTotals;
  series: AdminStatsSeriesPoint[];
  topVenues: AdminStatsTopVenue[];
  recentActivity: AdminStatsActivityItem[];
}

/* ---------------- Quản lý người dùng ---------------- */

export const AdminUserListQuerySchema = z.object({
  /** Tìm contains insensitive trên fullName HOẶC email. */
  search: z.string().trim().max(100).optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type AdminUserListQueryDto = z.infer<typeof AdminUserListQuerySchema>;

export const UpdateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});
export type UpdateUserStatusDto = z.infer<typeof UpdateUserStatusSchema>;

/** Treo/kích hoạt cụm sân: chỉ cho phép chuyển APPROVED <-> SUSPENDED. */
export const UpdateVenueStatusSchema = z.object({
  status: z.enum(['APPROVED', 'SUSPENDED']),
});
export type UpdateVenueStatusDto = z.infer<typeof UpdateVenueStatusSchema>;

/* ---------------- Tra cứu đơn toàn hệ thống ---------------- */

export const AdminBookingsQuerySchema = z.object({
  /** Lọc theo ngày chơi (ngày startTime) YYYY-MM-DD. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date phải là YYYY-MM-DD').optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  venueId: z.string().uuid('venueId phải là UUID').optional(),
  /** Tìm contains insensitive trên mã đơn HOẶC tên khách. */
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type AdminBookingsQueryDto = z.infer<typeof AdminBookingsQuerySchema>;

export interface AdminBookingListItem {
  id: string;
  /** Mã đơn CH-YYYYMMDD-NNNN. */
  code: string;
  venueId: string;
  venueName: string;
  courtName: string;
  customerName: string;
  customerEmail: string;
  /** ISO datetime = date + startMinute (biên bucket UTC khớp analytics). */
  startTime: string;
  endTime: string;
  // Dùng enum do Prisma sinh ra — trùng giá trị với @sango/shared nhưng khác kiểu nominal.
  status: PrismaBookingStatus;
  /** Tổng tiền đơn = subtotal (đã gồm mọi slot, chưa trừ hoàn). */
  totalPriceVnd: number;
  /** ISO timestamp thời điểm tạo đơn. */
  createdAt: string;
}

export interface AdminUserListItem {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  // Dùng enum do Prisma sinh ra — trùng giá trị với @sango/shared nhưng khác kiểu nominal.
  role: PrismaUserRole;
  status: PrismaUserStatus;
  /** ISO timestamp. */
  createdAt: string;
  bookingCount: number;
}
