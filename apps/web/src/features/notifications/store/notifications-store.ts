import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppNotification, NotificationType } from '../types';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'BOOKING',
    title: 'Đặt sân thành công - Mã CH-20260828-0001',
    message: 'Bạn đã đặt thành công Sân Bóng Đá 5A tại Cụm Sân Ba Đình lúc 18:00 - 19:30 hôm nay. Mã QR Check-in đã sẵn sàng.',
    link: '/bookings',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
    priority: 'HIGH',
    metadata: {
      bookingCode: 'CH-20260828-0001',
      venueName: 'Cụm Sân Ba Đình',
    },
  },
  {
    id: 'notif-2',
    type: 'MATCH',
    title: 'Có đội nhận kèo giao lưu!',
    message: 'FC Cầu Giấy United vừa đồng ý nhận lời thách đấu tại kèo bóng đá 7 người lúc 20:00 ngày mai.',
    link: '/matches/m-1',
    isRead: false,
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 mins ago
    priority: 'NORMAL',
    metadata: {
      matchId: 'm-1',
    },
  },
  {
    id: 'notif-3',
    type: 'WALLET',
    title: 'Biến động số dư: +500.000 đ',
    message: 'Giao dịch nạp tiền qua VietQR thành công. Số dư khả dụng hiện tại: 2.450.000 đ.',
    link: '/wallet',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
    priority: 'NORMAL',
    metadata: {
      amount: 500000,
    },
  },
  {
    id: 'notif-4',
    type: 'TOURNAMENT',
    title: 'Giải Đấu SanGo Open 2026 đã công bố sơ đồ nhánh cây',
    message: 'Đội SanGo Warriors của bạn sẽ gặp CLB Bạch Mai FC tại Vòng Tứ Kết lúc 08:30 sáng Thứ Bảy.',
    link: '/tournaments/t-1',
    isRead: true,
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(), // 14 hours ago
    priority: 'NORMAL',
    metadata: {
      tournamentId: 't-1',
    },
  },
  {
    id: 'notif-5',
    type: 'SYSTEM',
    title: 'Bảo mật tài khoản: Đã xác thực KYC Level 2',
    message: 'Hồ sơ tài khoản vận động viên của bạn đã được kiểm duyệt và nâng hạn mức giao dịch ví lên 50.000.000 đ/lần.',
    link: '/profile',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(), // 2 days ago
    priority: 'NORMAL',
  },
];

interface NotificationsState {
  notifications: AppNotification[];
  filterType: NotificationType;
  filterUnreadOnly: boolean;
  setFilterType: (type: NotificationType) => void;
  setFilterUnreadOnly: (unreadOnly: boolean) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: () => number;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: INITIAL_NOTIFICATIONS,
      filterType: 'ALL',
      filterUnreadOnly: false,

      setFilterType: (type) => set({ filterType: type }),
      setFilterUnreadOnly: (unreadOnly) => set({ filterUnreadOnly: unreadOnly }),

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n,
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        })),

      deleteNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearAll: () => set({ notifications: [] }),

      unreadCount: () => get().notifications.filter((n) => !n.isRead).length,
    }),
    {
      name: 'sango_notifications_storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
