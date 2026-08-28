import React from 'react';
import { CITIES, DISTRICTS_BY_CITY } from '../../../lib/constants';
import { cn } from '../../../lib/utils';

export interface SportOption {
  id: string;
  label: string;
}

export const DEFAULT_MATCH_SPORTS: SportOption[] = [
  { id: 'ALL', label: 'Tất Cả Môn' },
  { id: 'FOOTBALL', label: 'Bóng Đá' },
  { id: 'PICKLEBALL', label: 'Pickleball' },
  { id: 'BADMINTON', label: 'Cầu Lông' },
  { id: 'TENNIS', label: 'Tennis' },
];

interface MatchFilterBarProps {
  sportFilter: string;
  onSportFilterChange: (sport: string) => void;
  searchCity: string;
  onSearchCityChange: (city: string) => void;
  searchDistrict: string;
  onSearchDistrictChange: (district: string) => void;
}

export function MatchFilterBar({
  sportFilter,
  onSportFilterChange,
  searchCity,
  onSearchCityChange,
  searchDistrict,
  onSearchDistrictChange,
}: MatchFilterBarProps): React.ReactElement {
  const availableDistricts =
    searchCity !== 'ALL'
      ? DISTRICTS_BY_CITY[searchCity as (typeof CITIES)[number]] || []
      : [...DISTRICTS_BY_CITY['Hà Nội'], ...DISTRICTS_BY_CITY['TP. Hồ Chí Minh']];

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
      {/* Sport Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
        {DEFAULT_MATCH_SPORTS.map((sp) => {
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

      {/* City & District Selectors */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={searchCity}
          onChange={(e) => {
            onSearchCityChange(e.target.value);
            onSearchDistrictChange('ALL');
          }}
          className="h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer shadow-xs"
        >
          <option value="ALL">Tất cả Thành phố</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={searchDistrict}
          onChange={(e) => onSearchDistrictChange(e.target.value)}
          className="h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer shadow-xs"
        >
          <option value="ALL">Tất cả Quận / Huyện</option>
          {availableDistricts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
