import React from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface NotificationHeaderProps {
  unreadCount: number;
  totalCount: number;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export function NotificationHeader({
  unreadCount,
  totalCount,
  onMarkAllAsRead,
  onClearAll,
}: NotificationHeaderProps): React.ReactElement {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
          <Bell className="h-4 w-4" />
          <span>Trung Tâm Hoạt Động &amp; Cảnh Báo</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          Hộp Thư Thông Báo
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Cập nhật biến động lịch đặt sân, xác nhận ghép kèo, sơ đồ thi đấu và giao dịch ví SanGo Pay.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        {unreadCount > 0 && (
          <Button
            size="sm"
            onClick={onMarkAllAsRead}
            className="gap-1.5 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <CheckCheck className="h-4 w-4" />
            <span>Đánh Dấu Đã Đọc Tất Cả ({unreadCount})</span>
          </Button>
        )}

        {totalCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={onClearAll}
            className="gap-1.5 font-bold text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>Xóa Hết</span>
          </Button>
        )}
      </div>
    </div>
  );
}
