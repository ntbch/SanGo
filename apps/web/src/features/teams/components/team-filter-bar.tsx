import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { cn } from '../../../lib/utils';

export interface SportFilterItem {
  id: string;
  label: string;
}

export const DEFAULT_TEAM_SPORTS_FILTER: SportFilterItem[] = [
  { id: 'ALL', label: 'Tất Cả Môn' },
  { id: 'FOOTBALL', label: 'Bóng Đá' },
  { id: 'PICKLEBALL', label: 'Pickleball' },
  { id: 'BADMINTON', label: 'Cầu Lông' },
  { id: 'TENNIS', label: 'Tennis' },
  { id: 'BASKETBALL', label: 'Bóng Rổ' },
];

interface TeamFilterBarProps {
  sportFilter: string;
  onSportFilterChange: (sport: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sports?: SportFilterItem[];
}

export function TeamFilterBar({
  sportFilter,
  onSportFilterChange,
  searchQuery,
  onSearchQueryChange,
  sports = DEFAULT_TEAM_SPORTS_FILTER,
}: TeamFilterBarProps): React.ReactElement {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
      {/* Sport Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
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

      {/* Search Input */}
      <div className="relative w-full md:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Tìm tên đội..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="pl-9 h-9 text-xs"
        />
      </div>
    </div>
  );
}
