/**
 * Chuông thông báo in-app (P2-F1) — dùng chung cho PublicLayout và DashboardLayout.
 * - Badge số chưa đọc từ GET /notifications (poll 30s, dừng khi tab ẩn).
 * - Dropdown: 10 mục mới nhất, icon theo type, thời gian tương đối,
 *   bấm mục = mark-read + điều hướng theo link; nút "Đánh dấu tất cả đã đọc".
 * - A11y: aria-label "Chuông thông báo", aria-expanded, đóng khi bấm ngoài
 *   (Radix DropdownMenu tự lo) + Escape.
 */
import {
  Bell,
  CalendarCheck2,
  CalendarX2,
  CheckCheck,
  CreditCard,
  Loader2,
  UserPlus,
  UserMinus,
  AlarmClock,
  Store,
  Wallet,
  Trophy,
  TicketPercent,
  Users,
  Wrench,
} from 'lucide-react';
import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import { NotificationType } from '@courthub/shared';

import { Button } from '../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { cn } from '../../../lib/utils';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { formatRelativeTime } from '../format';
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '../queries';
import type { AppNotification } from '../types';

/** Icon + nhãn màu theo loại thông báo — đủ mọi giá trị NotificationType. */
const TYPE_ICON: Record<NotificationType, { Icon: typeof Bell; className: string }> = {
  [NotificationType.BOOKING_CONFIRMED]: { Icon: CalendarCheck2, className: 'text-emerald-500' },
  [NotificationType.BOOKING_CANCELLED]: { Icon: CalendarX2, className: 'text-destructive' },
  [NotificationType.PAYMENT_RECEIVED]: { Icon: CreditCard, className: 'text-primary' },
  [NotificationType.NEW_BOOKING_OWNER]: { Icon: Store, className: 'text-sky-500' },
  [NotificationType.MATCH_JOINED]: { Icon: UserPlus, className: 'text-violet-500' },
  [NotificationType.MATCH_LEFT]: { Icon: UserMinus, className: 'text-amber-500' },
  [NotificationType.REMINDER]: { Icon: AlarmClock, className: 'text-orange-500' },
  // F8 wave-1 (roadmap v5): ví/voucher/dịch vụ/đội/giải đấu.
  [NotificationType.WALLET]: { Icon: Wallet, className: 'text-emerald-500' },
  [NotificationType.VOUCHER]: { Icon: TicketPercent, className: 'text-pink-500' },
  [NotificationType.SERVICE]: { Icon: Wrench, className: 'text-sky-500' },
  [NotificationType.TEAM]: { Icon: Users, className: 'text-violet-500' },
  [NotificationType.TOURNAMENT]: { Icon: Trophy, className: 'text-amber-500' },
};

/** Một dòng thông báo trong dropdown — bấm để đọc + điều hướng. */
function NotificationItem(options: { item: AppNotification }): ReactElement {
  const { item } = options;
  const navigate = useNavigate();
  const markRead = useMarkNotificationRead();
  const meta = TYPE_ICON[item.type] ?? TYPE_ICON[NotificationType.REMINDER];
  const unread = item.readAt === null;

  return (
    <button
      type="button"
      data-testid="notification-item"
      data-unread={unread ? 'true' : 'false'}
      aria-label={(unread ? 'Chưa đọc: ' : '') + item.title}
      disabled={markRead.isPending && markRead.variables === item.id}
      onClick={() => {
        if (item.readAt === null) markRead.mutate(item.id);
        if (item.link !== null && item.link !== '') navigate(item.link);
      }}
      className={cn(
        'flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
        unread && 'bg-primary/5',
      )}
    >
      <span className="mt-0.5 shrink-0" aria-hidden>
        <meta.Icon className={cn('size-4', meta.className)} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className={cn('truncate text-sm', unread ? 'font-semibold' : 'font-medium')}>
            {item.title}
          </span>
          {unread ? (
            <span
              data-testid="notification-unread-dot"
              className="size-2 shrink-0 rounded-full bg-primary"
              aria-hidden
            />
          ) : null}
        </span>
        <span className="line-clamp-2 block text-xs text-muted-foreground">{item.body}</span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground/80">
          {formatRelativeTime(item.createdAt)}
        </span>
      </span>
    </button>
  );
}

/** Nội dung dropdown: header + danh sách 10 mục mới nhất / empty / error im lặng. */
function NotificationPanel(): ReactElement {
  const user = useAuthStore((state) => state.user);
  // enabled=false khi chưa login — không bắn request thừa.
  const query = useNotifications(user !== null);
  const markAllRead = useMarkAllNotificationsRead();

  const items = query.data?.items ?? [];
  const unreadCount = query.data?.unreadCount ?? 0;

  return (
    <div
      data-testid="notification-panel"
      className="flex max-h-[420px] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <p className="text-sm font-semibold">Thông báo</p>
        {unreadCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            data-testid="mark-all-read"
            disabled={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
            className="h-7 gap-1 px-2 text-xs"
          >
            {markAllRead.isPending ? (
              <Loader2 className="size-3 animate-spin" aria-hidden />
            ) : (
              <CheckCheck className="size-3" aria-hidden />
            )}
            Đánh dấu tất cả đã đọc
          </Button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto" role="list" aria-label="Danh sách thông báo">
        {/* Lỗi tải hộp thư: im lặng thân thiện — giữ panel mở được, không toast/red alert. */}
        {query.isError ? (
          <p
            className="px-3 py-8 text-center text-sm text-muted-foreground"
            data-testid="notifications-error"
          >
            Không tải được thông báo. Thử lại sau ít phút.
          </p>
        ) : items.length === 0 ? (
          <div className="px-3 py-10 text-center" data-testid="notifications-empty">
            <Bell className="mx-auto size-8 text-muted-foreground/40" aria-hidden />
            <p className="mt-2 text-sm text-muted-foreground">Chưa có thông báo nào</p>
          </div>
        ) : (
          items.map((item) => <NotificationItem key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}

export function NotificationBell(): ReactElement {
  const user = useAuthStore((state) => state.user);
  // Poll chạy cả khi dropdown đóng — chỉ cần đã đăng nhập.
  const query = useNotifications(user !== null);
  const unreadCount = user !== null ? (query.data?.unreadCount ?? 0) : 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-testid="notification-bell"
          aria-label="Chuông thông báo"
          className="relative"
        >
          <Bell className="size-5" aria-hidden />
          {unreadCount > 0 ? (
            <span
              data-testid="notification-badge"
              aria-hidden
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white"
            >
              {unreadCount > 9 ? '9+' : String(unreadCount)}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="p-0 border-none bg-transparent shadow-none"
      >
        <NotificationPanel />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
