import React from 'react';
import { Swords, Users, Calendar } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { TournamentTab } from '../pages/tournament-detail-page';

interface TournamentTabsProps {
  activeTab: TournamentTab;
  onTabChange: (tab: TournamentTab) => void;
  teamCount: number;
}

export function TournamentTabs({
  activeTab,
  onTabChange,
  teamCount,
}: TournamentTabsProps): React.ReactElement {
  return (
    <div className="flex border-b border-border/60 gap-4 overflow-x-auto no-scrollbar pb-1">
      <button
        type="button"
        aria-label="Sơ Đồ Nhánh Đấu"
        onClick={() => onTabChange('BRACKET')}
        className={cn(
          'pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
          activeTab === 'BRACKET'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )}
      >
        <Swords className="h-4 w-4" />
        <span>Sơ Đồ Nhánh Đấu (Knockout Bracket)</span>
      </button>

      <button
        type="button"
        aria-label="Danh Sách Đội Tham Gia"
        onClick={() => onTabChange('TEAMS')}
        className={cn(
          'pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
          activeTab === 'TEAMS'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )}
      >
        <Users className="h-4 w-4" />
        <span>Danh Sách Đội Ghi Danh ({teamCount})</span>
      </button>

      <button
        type="button"
        aria-label="Lịch Thi Đấu & Tỷ Số"
        onClick={() => onTabChange('MATCHES')}
        className={cn(
          'pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
          activeTab === 'MATCHES'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )}
      >
        <Calendar className="h-4 w-4" />
        <span>Lịch Thi Đấu &amp; Nhập Tỷ Số</span>
      </button>
    </div>
  );
}
