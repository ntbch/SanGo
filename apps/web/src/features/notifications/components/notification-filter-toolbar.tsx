import React from 'react';
import {
  Bell,
  Calendar,
  Swords,
  Trophy,
  Wallet,
  ShieldCheck,
  Search,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { cn } from '../../../lib/utils';
import { NotificationType } from '../types';

interface NotificationFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterType: NotificationType;
  onFilterTypeChange: (type: NotificationType) => void;
  filterUnreadOnly: boolean;
  onFilterUnreadOnlyChange: (unreadOnly: boolean) => void;
  unreadCount: number;
  onResetFilters: () => void;
}

const CATEGORY_TABS: { key: NotificationType; label: string; icon: React.ElementType }[] = [
  { key: 'ALL', label: 'Tất Cả', icon: Bell },
  { key: 'BOOKING', label: 'Đặt Sân', icon: Calendar },
  { key: 'MATCH', label: 'Ghép Kèo', icon: Swords },
  { key: 'TOURNAMENT', label: 'Giải Đấu', icon: Trophy },
  { key: 'WALLET', label: 'Ví SanGo', icon: Wallet },
  { key: 'SYSTEM', label: 'Bảo Mật', icon: ShieldCheck },
];

export function NotificationFilterToolbar({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterUnreadOnly,
  onFilterUnreadOnlyChange,
  unreadCount,
  onResetFilters,
}: NotificationFilterToolbarProps): React.ReactElement {
  const isFiltered = filterType !== 'ALL' || filterUnreadOnly || searchQuery.trim() !== '';

  return (
    <CardHeader className="p-6 pb-4 border-b border-border/60 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4.5 w-4.5 text-primary" />
          <CardTitle className="text-base sm:text-lg font-black text-foreground">
            Danh Sách Thông Báo
          </CardTitle>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Tìm nội dung thông báo..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 pl-9 text-xs w-64 bg-background"
            />
          </div>

          {isFiltered && (
            <Button
              size="sm"
              variant="outline"
              onClick={onResetFilters}
              className="h-9 text-xs font-bold gap-1 px-3 cursor-pointer shrink-0"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Đặt lại</span>
            </Button>
          )}
        </div>
      </div>

      {/* Category Filter Pills & Unread Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/50">
        <div className="flex flex-wrap items-center gap-1.5 bg-secondary/50 p-1.5 rounded-2xl">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onFilterTypeChange(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                  filterType === tab.key
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer select-none px-2">
          <input
            type="checkbox"
            checked={filterUnreadOnly}
            onChange={(e) => onFilterUnreadOnlyChange(e.target.checked)}
            className="h-4 w-4 rounded-md border-border text-primary focus:ring-primary"
          />
          <span>Chỉ hiển thị chưa đọc ({unreadCount})</span>
        </label>
      </div>
    </CardHeader>
  );
}
