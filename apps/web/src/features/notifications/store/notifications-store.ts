import { create } from 'zustand';
import { apiClient } from '../../../lib/api-client';
import { bindRealtimeToAuth } from '../../../lib/socket';
import { AppNotification, NotificationType } from '../types';

interface BeNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: BeNotification[];
  page: number;
  pageSize: number;
  total: number;
  unreadCount: number;
}

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
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
  unreadTotal: number;
  sessionUserId: string | null;
  filterType: NotificationType;
  filterUnreadOnly: boolean;
  setSession: (userId: string | null) => void;
  fetchNotifications: (loadMore?: boolean) => Promise<void>;
  setFilterType: (type: NotificationType) => void;
  setFilterUnreadOnly: (unreadOnly: boolean) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  unreadCount: () => number;
}

export const useNotificationsStore = create<NotificationsState>()((set, get) => {
  let session = 0;
  let refreshPending = false;

  async function mutate(path: string, method: 'POST' | 'DELETE'): Promise<void> {
    if (!get().sessionUserId) return;
    const startedSession = session;
    set({ error: null });
    try {
      await apiClient(path, { method });
      if (session === startedSession) await get().fetchNotifications();
    } catch {
      if (session === startedSession) set({ error: 'Không thể cập nhật thông báo. Vui lòng thử lại.' });
    }
  }

  return {
    notifications: [],
    loading: false,
    loaded: false,
    error: null,
    total: 0,
    page: 0,
    pageSize: 10,
    unreadTotal: 0,
    sessionUserId: null,
    filterType: 'ALL',
    filterUnreadOnly: false,

    setSession: (userId) => {
      session += 1;
      refreshPending = false;
      set({
        sessionUserId: userId,
        notifications: [], loading: false, loaded: false, error: null,
        total: 0, page: 0, unreadTotal: 0, filterType: 'ALL', filterUnreadOnly: false,
      });
      if (userId) void get().fetchNotifications();
    },

    fetchNotifications: async (loadMore = false) => {
      if (!get().sessionUserId) return;
      if (get().loading) {
        if (!loadMore) refreshPending = true;
        return;
      }
      if (loadMore && get().loaded && get().page * get().pageSize >= get().total) return;
      const startedSession = session;
      const targetPage = loadMore ? get().page + 1 : Math.max(1, get().page);
      let items = loadMore ? [...get().notifications] : [];
      set({ loading: true, error: null });
      try {
        // Reconcile the loaded prefix so inserts/deletes cannot leave pagination gaps.
        for (let page = loadMore ? targetPage : 1; page <= targetPage; page += 1) {
          const res = await apiClient<NotificationListResponse>('/notifications', { params: { page } });
          if (session !== startedSession) return;
          items = [...items, ...res.items.map(mapBeNotification)];
          const lastPage = page === targetPage || page * res.pageSize >= res.total;
          if (lastPage) {
            set({
              notifications: [...new Map(items.map((item) => [item.id, item])).values()],
              page: res.page, pageSize: res.pageSize, total: res.total,
              unreadTotal: res.unreadCount, loaded: true,
            });
            break;
          }
        }
      } catch {
        if (session === startedSession) set({ error: 'Không thể tải thông báo. Vui lòng thử lại.' });
      } finally {
        if (session === startedSession) {
          set({ loading: false });
          if (refreshPending) {
            refreshPending = false;
            void get().fetchNotifications();
          }
        }
      }
    },

    setFilterType: (type) => set({ filterType: type }),
    setFilterUnreadOnly: (unreadOnly) => set({ filterUnreadOnly: unreadOnly }),
    markAsRead: (id) => mutate(`/notifications/${id}/read`, 'POST'),
    markAllAsRead: () => mutate('/notifications/read-all', 'POST'),
    deleteNotification: (id) => mutate(`/notifications/${id}`, 'DELETE'),
    clearAll: () => mutate('/notifications', 'DELETE'),
    unreadCount: () => get().unreadTotal,
  };
});

bindRealtimeToAuth({
  onSessionChange: (userId) => useNotificationsStore.getState().setSession(userId),
  onReconnect: () => { void useNotificationsStore.getState().fetchNotifications(); },
});
