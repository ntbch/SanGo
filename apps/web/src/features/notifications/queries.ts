/**
 * TanStack Query cho chuông thông báo (P2-F1).
 * - Poll GET /notifications mỗi 30s; TẠM DỪNG khi tab ẩn
 *   (document.visibilityState === 'hidden') để tiết kiệm request.
 * - refetchOnWindowFocus bật lại khi người dùng quay lại tab.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from './api';

/** Chu kỳ poll hộp thư — 30 giây theo đặc tả P2-F1. */
export const NOTIFICATIONS_POLL_MS = 30_000;

/** Hộp thư trang đầu (10 mục mới nhất) + unreadCount cho badge chuông. */
export function useNotifications(enabled: boolean) {
  return useQuery({
    queryKey: ['notifications', 'page-1'],
    queryFn: () => fetchNotifications(1),
    enabled,
    // TanStack hỗ trợ refetchInterval dạng number | false | callback.
    // Callback nhận query và trả số ms tới lần poll tiếp theo, hoặc false để
    // tạm dừng — mình dùng nó để DỪNG poll khi document.visibilityState ẩn,
    // quay lại tab thì refetchOnWindowFocus kéo dữ liệu mới ngay.
    refetchInterval: (): number | false =>
      typeof document !== 'undefined' && document.visibilityState === 'hidden'
        ? false
        : NOTIFICATIONS_POLL_MS,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });
}

/** Đánh dấu một thông báo đã đọc; cập nhật cache thay vì invalidate để UI tức thời. */
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/** Đánh dấu tất cả đã đọc. */
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
