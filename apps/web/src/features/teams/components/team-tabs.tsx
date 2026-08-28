import React from 'react';
import { Users, DollarSign, Wallet } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { TeamTab } from '../pages/team-detail-page';

interface TeamTabsProps {
  activeTab: TeamTab;
  onTabChange: (tab: TeamTab) => void;
  memberCount: number;
}

export function TeamTabs({
  activeTab,
  onTabChange,
  memberCount,
}: TeamTabsProps): React.ReactElement {
  return (
    <div className="flex border-b border-border/60 gap-4 overflow-x-auto no-scrollbar pb-1">
      <button
        type="button"
        aria-label="Danh Sách Đội Hình"
        onClick={() => onTabChange('MEMBERS')}
        className={cn(
          'pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
          activeTab === 'MEMBERS'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )}
      >
        <Users className="h-4 w-4" />
        <span>Danh Sách Đội Hình ({memberCount})</span>
      </button>

      <button
        type="button"
        aria-label="Chia Tiền Sân Tự Động"
        onClick={() => onTabChange('SPLIT')}
        className={cn(
          'pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
          activeTab === 'SPLIT'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )}
      >
        <DollarSign className="h-4 w-4" />
        <span>Chia Tiền Sân Tự Động</span>
      </button>

      <button
        type="button"
        aria-label="Quỹ Đội Minh Bạch"
        onClick={() => onTabChange('TREASURY')}
        className={cn(
          'pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
          activeTab === 'TREASURY'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )}
      >
        <Wallet className="h-4 w-4" />
        <span>Quỹ Đội Minh Bạch</span>
      </button>
    </div>
  );
}
