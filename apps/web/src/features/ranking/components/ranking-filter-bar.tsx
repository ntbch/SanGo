import React from 'react';
import { CITIES } from '../../../lib/constants';
import { cn } from '../../../lib/utils';

export interface SportOption {
  id: string;
  label: string;
}

export const DEFAULT_SPORTS_LIST: SportOption[] = [
  { id: 'ALL', label: 'Tất Cả Môn' },
  { id: 'FOOTBALL', label: 'Bóng Đá' },
  { id: 'PICKLEBALL', label: 'Pickleball' },
  { id: 'BADMINTON', label: 'Cầu Lông' },
  { id: 'TENNIS', label: 'Tennis' },
];

interface RankingFilterBarProps {
  sportFilter: string;
  onSportFilterChange: (sport: string) => void;
  cityFilter: string;
  onCityFilterChange: (city: string) => void;
  sports?: SportOption[];
}

export function RankingFilterBar({
  sportFilter,
  onSportFilterChange,
  cityFilter,
  onCityFilterChange,
  sports = DEFAULT_SPORTS_LIST,
}: RankingFilterBarProps): React.ReactElement {
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

      {/* City Filter */}
      <div className="flex items-center gap-2">
        <select
          value={cityFilter}
          onChange={(e) => onCityFilterChange(e.target.value)}
          className="h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer shadow-xs"
        >
          <option value="ALL">Tất cả Thành phố</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
