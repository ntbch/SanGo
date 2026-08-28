import React from 'react';
import { Users, Award } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { RankingTab } from '../pages/ranking-page';

interface RankingTabsProps {
  activeTab: RankingTab;
  onTabChange: (tab: RankingTab) => void;
}

export function RankingTabs({ activeTab, onTabChange }: RankingTabsProps): React.ReactElement {
  return (
    <div
      role="tablist"
      aria-label="Tùy chọn Bảng xếp hạng"
      className="flex border-b border-border/60 gap-6 overflow-x-auto no-scrollbar pb-0.5"
    >
      <button
        type="button"
        role="tab"
        id="tab-clubs"
        aria-selected={activeTab === 'CLUBS'}
        aria-controls="tabpanel-clubs"
        onClick={() => onTabChange('CLUBS')}
        className={cn(
          'pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap',
          activeTab === 'CLUBS'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )}
      >
        <Users className="h-4 w-4" />
        <span>Bảng Xếp Hạng Câu Lạc Bộ (Club ELO)</span>
      </button>

      <button
        type="button"
        role="tab"
        id="tab-athletes"
        aria-selected={activeTab === 'ATHLETES'}
        aria-controls="tabpanel-athletes"
        onClick={() => onTabChange('ATHLETES')}
        className={cn(
          'pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap',
          activeTab === 'ATHLETES'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )}
      >
        <Award className="h-4 w-4" />
        <span>Bảng Vàng Vận Động Viên (MVP &amp; Uy Tín)</span>
      </button>
    </div>
  );
}
