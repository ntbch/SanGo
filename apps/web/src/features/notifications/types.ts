/** Kiểu dữ liệu Trung tâm thông báo in-app (P2-F1) — khớp contract backend t1. */

/**
 * Loại thông báo — dùng chung enum NotificationType của @sango/shared.
 * Import lại ở đây dưới dạng type để feature tự thân rõ nghĩa.
 */
export type { NotificationType } from '@sango/shared';
import { type NotificationType } from '@sango/shared';

/** Một dòng thông báo trong hộp thư — khớp model Prisma Notification. */
export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Đường dẫn nội bộ để điều hướng khi bấm thông báo; null = không điều hướng. */
  link: string | null;
  /** Thời điểm đã đọc; null = chưa đọc (chưa đọc thì hiển thị chấm xanh + badge). */
  readAt: string | null;
  createdAt: string;
}

/** Phản hồi GET /notifications — trang mới nhất trước kèm unreadCount toàn hộp thư. */
export interface NotificationListResponse {
  items: AppNotification[];
  page: number;
  pageSize: number;
  total: number;
  unreadCount: number;
}
