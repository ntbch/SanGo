import React from 'react';
import { cn } from '../../../lib/utils';

export interface SportFilterItem {
  id: string;
  label: string;
}

export const DEFAULT_TOURNAMENT_SPORTS: SportFilterItem[] = [
  { id: 'ALL', label: 'Tất Cả Môn' },
  { id: 'FOOTBALL', label: 'Bóng Đá' },
  { id: 'PICKLEBALL', label: 'Pickleball' },
  { id: 'BADMINTON', label: 'Cầu Lông' },
  { id: 'TENNIS', label: 'Tennis' },
];

interface TournamentFilterBarProps {
  sportFilter: string;
  onSportFilterChange: (sport: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  sports?: SportFilterItem[];
}

export function TournamentFilterBar({
  sportFilter,
  onSportFilterChange,
  statusFilter,
  onStatusFilterChange,
  sports = DEFAULT_TOURNAMENT_SPORTS,
}: TournamentFilterBarProps): React.ReactElement {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
      {/* Sport Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
        {sports.map((sp) => {
          const isSelected = sportFilter === sp.id;
          return (
            <button
              type="button"
              key={sp.id}
              onClick={() => onSportFilterChange(sp.id)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-secondary/60 text-muted-foreground hover:text-foreground',
              )}
            >
              {sp.label}
            </button>
          );
        })}
      </div>

      {/* Status Selector */}
      <div className="flex flex-wrap items-center gap-2">

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer shadow-xs"
        >
          <option value="ALL">Tất cả Trạng thái</option>
          <option value="REGISTRATION">Đang Mở Đăng Ký</option>
          <option value="ONGOING">Đang Diễn Ra</option>
          <option value="FINISHED">Đã Kết Thúc</option>
        </select>
      </div>
    </div>
  );
}
