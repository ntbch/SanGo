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
    <div className="flex border-b border-border/60 gap-4 overflow-x-auto no-scrollbar pb-1">
      <button
        type="button"
        aria-label="Bảng Xếp Hạng Câu Lạc Bộ"
        onClick={() => onTabChange('CLUBS')}
        className={cn(
          'pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
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
        aria-label="Bảng Vàng Vận Động Viên"
        onClick={() => onTabChange('ATHLETES')}
        className={cn(
          'pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
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
