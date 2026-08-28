import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, ArrowRight } from 'lucide-react';
import { useNotificationsStore } from '../store/notifications-store';
import { NotificationItem } from './notification-item';
import { cn } from '../../../lib/utils';

export function NotificationDropdown(): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<'ALL' | 'UNREAD' | 'BOOKING' | 'MATCH' | 'WALLET'>('ALL');
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    unreadCount,
  } = useNotificationsStore();

  const count = unreadCount();

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Filter notifications in dropdown
  const filtered = notifications.filter((item) => {
    if (tab === 'UNREAD') return !item.isRead;
    if (tab === 'ALL') return true;
    return item.type === tab;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer flex items-center justify-center',
          open && 'bg-secondary text-primary',
        )}
        title="Thông báo hệ thống"
        aria-label="Mở danh sách thông báo"
      >
        <Bell className="h-4.5 w-4.5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-black text-primary-foreground flex items-center justify-center ring-2 ring-background animate-in zoom-in-50">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2.5 w-[360px] sm:w-[420px] rounded-3xl border border-border/80 bg-card shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col max-h-[580px]">
          {/* Header */}
          <div className="p-4 pb-3 border-b border-border/60 flex items-center justify-between bg-card/80 backdrop-blur-xs sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground leading-none">
                  Thông Báo
                </h3>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {count > 0 ? `${count} tin chưa đọc` : 'Bạn đã đọc hết thông báo'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {count > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold text-primary hover:bg-primary/10 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Đánh dấu tất cả đã đọc"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Đã đọc tất cả</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="p-2 border-b border-border/50 bg-secondary/40 flex items-center gap-1 overflow-x-auto no-scrollbar">
            {(
              [
                { key: 'ALL', label: 'Tất cả' },
                { key: 'UNREAD', label: `Chưa đọc (${count})` },
                { key: 'BOOKING', label: 'Đặt sân' },
                { key: 'MATCH', label: 'Ghép kèo' },
                { key: 'WALLET', label: 'Ví SanGo' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer',
                  tab === t.key
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Notification List Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {filtered.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="h-10 w-10 rounded-2xl bg-secondary/80 flex items-center justify-center mx-auto text-muted-foreground">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-foreground">Không có thông báo nào</p>
                <p className="text-[11px] text-muted-foreground">
                  {tab === 'UNREAD'
                    ? 'Tuyệt vời! Bạn không còn thông báo chưa đọc nào.'
                    : 'Các thông báo mới về lịch đặt sân, kèo đấu sẽ xuất hiện tại đây.'}
                </p>
              </div>
            ) : (
              filtered.map((item) => (
                <NotificationItem
                  key={item.id}
                  notification={item}
                  onMarkAsRead={markAsRead}
                  compact={true}
                  onClosePopup={() => setOpen(false)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border/60 bg-secondary/30 flex items-center justify-between text-xs sticky bottom-0 z-10">
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors cursor-pointer font-semibold"
              >
                <Trash2 className="h-3 w-3" />
                <span>Xóa hết</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/notifications');
              }}
              className="ml-auto text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả thông báo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
