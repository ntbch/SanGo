import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Swords,
  Trophy,
  Wallet,
  ShieldCheck,
  Bell,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { AppNotification } from '../types';
import { cn } from '../../../lib/utils';

export interface NotificationItemProps {
  notification: AppNotification;
  onMarkAsRead: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
  onClosePopup?: () => void;
}

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  compact = false,
  onClosePopup,
}: NotificationItemProps): React.ReactElement {
  const navigate = useNavigate();

  let icon = <Bell className="h-4 w-4 text-primary" />;
  let iconBg = 'bg-primary/10 text-primary';
  let badgeLabel = 'Hệ Thống';

  switch (notification.type) {
    case 'BOOKING':
      icon = <Calendar className="h-4 w-4 text-emerald-500" />;
      iconBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      badgeLabel = 'Đặt Sân';
      break;
    case 'MATCH':
      icon = <Swords className="h-4 w-4 text-amber-500" />;
      iconBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      badgeLabel = 'Ghép Kèo';
      break;
    case 'TOURNAMENT':
      icon = <Trophy className="h-4 w-4 text-purple-500" />;
      iconBg = 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      badgeLabel = 'Giải Đấu';
      break;
    case 'WALLET':
      icon = <Wallet className="h-4 w-4 text-cyan-500" />;
      iconBg = 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400';
      badgeLabel = 'Ví SanGo';
      break;
    case 'SYSTEM':
      icon = <ShieldCheck className="h-4 w-4 text-blue-500" />;
      iconBg = 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      badgeLabel = 'Bảo Mật';
      break;
  }

  const handleClick = () => {
    onMarkAsRead(notification.id);
    if (notification.link) {
      if (onClosePopup) onClosePopup();
      navigate(notification.link);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative flex items-start gap-3 transition-colors cursor-pointer',
        compact
          ? 'p-3 hover:bg-secondary/60 border-b border-border/40 last:border-0'
          : 'p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-md hover:bg-secondary/20',
        !notification.isRead && (compact ? 'bg-primary/5' : 'bg-primary/[0.03] border-primary/30'),
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'shrink-0 rounded-xl flex items-center justify-center border border-border/40 shadow-xs',
          compact ? 'h-8 w-8' : 'h-10 w-10 sm:h-11 sm:w-11',
          iconBg,
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider',
                iconBg,
              )}
            >
              {badgeLabel}
            </span>
            <h4
              className={cn(
                'text-foreground font-bold leading-snug',
                compact ? 'text-xs truncate max-w-[200px]' : 'text-xs sm:text-sm',
                !notification.isRead ? 'font-black' : 'font-medium text-foreground/90',
              )}
            >
              {notification.title}
            </h4>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!notification.isRead && (
              <span
                className="h-2 w-2 rounded-full bg-primary animate-pulse"
                title="Chưa đọc"
              />
            )}
            <span className="text-[10px] text-muted-foreground font-mono-num">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </div>
        </div>

        <p
          className={cn(
            'text-muted-foreground leading-relaxed',
            compact ? 'text-[11px] line-clamp-2' : 'text-xs sm:text-sm line-clamp-3',
          )}
        >
          {notification.message}
        </p>

        {/* Bottom actions on full view */}
        {!compact && (
          <div className="flex items-center justify-between pt-2">
            {notification.link && (
              <span className="text-[11px] font-bold text-primary inline-flex items-center gap-1 group-hover:underline">
                <span>Xem chi tiết</span>
                <ExternalLink className="h-3 w-3" />
              </span>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Xóa thông báo này"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
