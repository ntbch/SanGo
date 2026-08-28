import React from 'react';
import { Bell, Calendar, Swords, Wallet } from 'lucide-react';
import { Card } from '../../../components/ui/card';

interface NotificationStatsCardsProps {
  unreadCount: number;
  bookingCount: number;
  matchCount: number;
  walletCount: number;
}

export function NotificationStatsCards({
  unreadCount,
  bookingCount,
  matchCount,
  walletCount,
}: NotificationStatsCardsProps): React.ReactElement {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <Card className="p-4 sm:p-5 border border-border/80 bg-card flex items-center gap-3.5">
        <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-muted-foreground block">Chưa Đọc</span>
          <span className="text-xl sm:text-2xl font-black font-mono-num text-foreground">
            {unreadCount}
          </span>
        </div>
      </Card>

      <Card className="p-4 sm:p-5 border border-border/80 bg-card flex items-center gap-3.5">
        <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-muted-foreground block">Lịch Đặt &amp; Vé Sân</span>
          <span className="text-xl sm:text-2xl font-black font-mono-num text-foreground">
            {bookingCount}
          </span>
        </div>
      </Card>

      <Card className="p-4 sm:p-5 border border-border/80 bg-card flex items-center gap-3.5">
        <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
          <Swords className="h-5 w-5" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-muted-foreground block">Kèo Đấu &amp; Giải</span>
          <span className="text-xl sm:text-2xl font-black font-mono-num text-foreground">
            {matchCount}
          </span>
        </div>
      </Card>

      <Card className="p-4 sm:p-5 border border-border/80 bg-card flex items-center gap-3.5">
        <div className="h-11 w-11 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-muted-foreground block">Giao Dịch Ví</span>
          <span className="text-xl sm:text-2xl font-black font-mono-num text-foreground">
            {walletCount}
          </span>
        </div>
      </Card>
    </div>
  );
}
