/** Lớp gọi API Trung tâm thông báo (contract backend t1). */
import { endpoints } from '../../lib/api/endpoints';
import { apiFetch } from '../../lib/api/client';
import type { AppNotification, NotificationListResponse } from './types';

/** Hộp thư của user đăng nhập — mới nhất trước, kèm unreadCount. */
export function fetchNotifications(page = 1): Promise<NotificationListResponse> {
  return apiFetch<NotificationListResponse>(endpoints.notifications.list({ page }));
}

/**
 * Đánh dấu MỘT thông báo đã đọc — idempotent, trả về dòng sau cập nhật
 * (readAt mới hoặc giữ nguyên nếu đã đọc trước đó).
 */
export function markNotificationRead(id: string): Promise<AppNotification> {
  return apiFetch<AppNotification>(endpoints.notifications.markRead(id), { method: 'POST' });
}

/** Đánh dấu TOÀN BỘ thông báo chưa đọc là đã đọc -> số dòng ảnh hưởng. */
export function markAllNotificationsRead(): Promise<{ updated: number }> {
  return apiFetch<{ updated: number }>(endpoints.notifications.markAllRead(), { method: 'POST' });
}
