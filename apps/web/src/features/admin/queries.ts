import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { VenueStatus } from '@sango/shared';

import {
  adminCancelBooking,
  approveVenue,
  fetchAdminBookings,
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminVenues,
  rejectVenue,
  setVenueStatus,
  setUserStatus,
  type AdminBookingsFilters,
  type AdminUsersFilters,
  type AdminVenuesFilters,
} from './api';
import type {
  AdminBookingsResponse,
  AdminStatsResponse,
  AdminUsersResponse,
  AdminUserStatus,
  AdminVenueItem,
} from './types';

export function useAdminVenues(
  filters: AdminVenuesFilters,
): ReturnType<typeof useQuery<{ items: AdminVenueItem[]; total: number }>> {
  return useQuery({
    queryKey: ['admin', 'venues', filters],
    queryFn: () => fetchAdminVenues(filters),
  });
}

function useInvalidateAdmin(): () => void {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ['admin'] });
    void qc.invalidateQueries({ queryKey: ['public'] });
  };
}

export function useApproveVenue() {
  const invalidate = useInvalidateAdmin();
  return useMutation({ mutationFn: (id: string) => approveVenue(id), onSuccess: invalidate });
}

export function useRejectVenue() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectVenue(id, reason),
    onSuccess: invalidate,
  });
}
/** Khoảng ngày hợp lệ cho biểu đồ thống kê nền tảng (contract ?days=). */
export const ADMIN_STATS_RANGES = [7, 14, 30, 90] as const;

/** Tổng quan hệ thống theo khoảng days — chỉ đọc; key ['admin','stats',days]. */
export function useAdminStats(days: number = 14): ReturnType<typeof useQuery<AdminStatsResponse>> {
  return useQuery({
    queryKey: ['admin', 'stats', days],
    queryFn: () => fetchAdminStats(days),
    staleTime: 60_000,
  });
}
/** Danh sách người dùng cho trang Quản lý người dùng — key ['admin','users',filters]. */
export function useAdminUsers(
  filters: AdminUsersFilters = {},
): ReturnType<typeof useQuery<AdminUsersResponse>> {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => fetchAdminUsers(filters),
  });
}

/** Khoá/mở khoá một người dùng — làm mới khu admin sau khi thành công (t7). */
export function useSetUserStatus() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminUserStatus }) =>
      setUserStatus(id, status),
    onSuccess: invalidate,
  });
}
/** Đơn toàn hệ thống cho trang Quản lý đơn — key ['admin','bookings',filters]. */
export function useAdminBookings(
  filters: AdminBookingsFilters = {},
): ReturnType<typeof useQuery<AdminBookingsResponse>> {
  return useQuery({
    queryKey: ['admin', 'bookings', filters],
    queryFn: () => fetchAdminBookings(filters),
  });
}

/** Huỷ HỘ một đơn — làm mới khu admin + public sau khi thành công (t9). */
export function useAdminCancelBooking() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminCancelBooking(id, reason),
    onSuccess: invalidate,
  });
}
/** Tạm ngưng/kích hoạt lại cụm sân — làm mới cả admin lẫn tìm kiếm public (t8). */
export function useSetVenueStatus() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: Extract<VenueStatus, 'APPROVED' | 'SUSPENDED'>;
    }) => setVenueStatus(id, status),
    onSuccess: invalidate,
  });
}
