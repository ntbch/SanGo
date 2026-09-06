import { create } from 'zustand';
import { apiClient } from '../../../lib/api-client';
import { bindRealtimeToAuth } from '../../../lib/socket';
import { AppNotification, NotificationType } from '../types';

// ---- Shape trả về từ BE GET /notifications (notifications.service.ts list()) ----
interface BeNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationListResponse {
  items: BeNotification[];
  page: number;
  pageSize: number;
  total: number;
  unreadCount: number;
}

/** Shape BE emit qua WS event 'notification:new' — khớp BeNotification của GET /notifications. */
export type RealtimeBeNotification = BeNotification;

/** Map NotificationType của BE (schema.prisma) sang nhóm filter của FE. */
function mapBeType(t: string): Exclude<NotificationType, 'ALL'> {
  if (['BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'NEW_BOOKING_OWNER', 'REMINDER'].includes(t)) {
    return 'BOOKING';
  }
  if (['MATCH_JOINED', 'MATCH_LEFT', 'MATCH_REQUEST'].includes(t)) return 'MATCH';
  if (['PAYMENT_RECEIVED', 'WALLET'].includes(t)) return 'WALLET';
  if (t === 'TOURNAMENT') return 'TOURNAMENT';
  return 'SYSTEM';
}

function mapBeNotification(n: BeNotification): AppNotification {
  return {
    id: n.id,
    type: mapBeType(n.type),
    title: n.title,
    message: n.body,
    link: n.link ?? undefined,
    isRead: n.readAt != null,
    createdAt: n.createdAt,
  };
}

interface NotificationsState {
  notifications: AppNotification[];
  loading: boolean;
  loaded: boolean;
  filterType: NotificationType;
  filterUnreadOnly: boolean;
  fetchNotifications: () => Promise<void>;
  setFilterType: (type: NotificationType) => void;
  setFilterUnreadOnly: (unreadOnly: boolean) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  handleRealtimeNotification: (notification: BeNotification) => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: () => number;
}

export const useNotificationsStore = create<NotificationsState>()((set, get) => ({
  notifications: [],
  loading: false,
  loaded: false,
  filterType: 'ALL',
  filterUnreadOnly: false,

  /** Tải hộp thư thật từ BE (trang 1, mới nhất trước). */
  fetchNotifications: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const res = await apiClient<NotificationListResponse>('/notifications', {
        params: { page: 1 },
      });
      set({ notifications: res.items.map(mapBeNotification), loaded: true });
    } catch {
      // Lỗi mạng/401: giữ danh sách đã có, apiClient đã lo refresh token/chuyển event
    } finally {
      set({ loading: false });
    }
  },

  setFilterType: (type) => set({ filterType: type }),
  setFilterUnreadOnly: (unreadOnly) => set({ filterUnreadOnly: unreadOnly }),

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
    }));
    void apiClient(`/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    }));
    void apiClient('/notifications/read-all', { method: 'POST' }).catch(() => {});
  },

  /**
   * Phase 4: nhận event WS 'notification:new' (gợi ý refetch) — prepend có dedupe theo id
   * để badge unread tự tăng qua unreadCount(); nếu user đang mở trang thì danh sách cập nhật
   * ngay không cần gọi lại REST (REST vẫn là nguồn sự thật khi F5/refetch).
   */
  handleRealtimeNotification: (notification) => {
    set((state) => {
      if (state.notifications.some((n) => n.id === notification.id)) return state;
      return { notifications: [mapBeNotification(notification), ...state.notifications], loaded: true };
    });
  },

  // View-state cục bộ: BE chưa có endpoint xoá/clear — chỉ ảnh hưởng phiên hiện tại.
  deleteNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearAll: () => set({ notifications: [] }),

  unreadCount: () => get().notifications.filter((n) => !n.isRead).length,
}));

// Phase 4: kích hoạt kết nối realtime theo auth state đúng một lần khi store được nạp
// (navbar luôn mount NotificationDropdown nên store nằm trong bundle khởi động app).
bindRealtimeToAuth();
