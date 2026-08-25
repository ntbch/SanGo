import { type ReactElement } from 'react';
import { HANOI_DISTRICTS, SportType, SPORT_TYPE_LABELS } from '@courthub/shared';

import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';

import { cn } from '../../../lib/utils';

export type VenueSort = 'newest' | 'price-asc' | 'price-desc' | 'distance';

export const SORT_LABELS: Record<VenueSort, string> = {
  newest: 'Mới nhất',
  'price-asc': 'Giá tăng dần',
  'price-desc': 'Giá giảm dần',
  distance: 'Gần nhất trước (GPS)',
};

/** Các loại sân lọc nhanh — khớp enum dùng chung. */
export const FILTERABLE_SPORT_TYPES: SportType[] = [
  SportType.PICKLEBALL,
  SportType.BADMINTON,
  SportType.TENNIS,
  SportType.FOOTBALL5,
  SportType.FOOTBALL7,
];

interface FilterSidebarProps {
  sportType?: string;
  district?: string;
  sort: VenueSort;
  hasGps?: boolean;
  onSportTypeChange: (value?: string) => void;
  onDistrictChange: (value?: string) => void;
  onSortChange: (value: VenueSort) => void;
}

/**
 * Cột lọc trái: panel kính mờ sticky (DESIGN.md — Depth Cues/Glassmorphism cho
 * filter bar) gồm dropdown 12 quận Hà Nội, chip loại sân + sắp xếp.
 * Dùng native select để tinh gọn và đồng bộ.
 */
export function FilterSidebar({
  sportType,
  district,
  sort,
  hasGps = false,
  onDistrictChange,
  onSortChange,
  onSportTypeChange,
}: FilterSidebarProps): ReactElement {
  const availableSorts: VenueSort[] = hasGps
    ? ['distance', 'newest', 'price-asc', 'price-desc']
    : ['newest', 'price-asc', 'price-desc', 'distance'];

  return (
    <aside
      aria-label="Bộ lọc tìm kiếm"
      className="space-y-6 rounded-xl border border-border/60 bg-card/80 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.05)] backdrop-blur-md lg:sticky lg:top-28"
    >
      <p className="font-score text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Bộ lọc
      </p>
      <div className="space-y-2">
        <Label htmlFor="venue-district" className="text-sm font-semibold">
          Quận / Huyện (Hà Nội)
        </Label>
        <select
          id="venue-district"
          aria-label="Chọn quận huyện"
          value={district ?? ''}
          onChange={(event) =>
            onDistrictChange(event.target.value ? event.target.value : undefined)
          }
          className={cn(
            'h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors',
            'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <option value="">Tất cả quận/huyện</option>
          {HANOI_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Loại sân</Label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn loại sân">
          <Button
            type="button"
            variant={sportType === undefined ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'rounded-full',
              sportType === undefined && 'bg-primary text-primary-foreground',
            )}
            aria-pressed={sportType === undefined}
            onClick={() => onSportTypeChange(undefined)}
          >
            Tất cả
          </Button>
          {FILTERABLE_SPORT_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              variant={sportType === type ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'rounded-full',
                sportType === type && 'bg-primary text-primary-foreground',
              )}
              aria-pressed={sportType === type}
              onClick={() => onSportTypeChange(type)}
            >
              {SPORT_TYPE_LABELS[type]}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="venue-sort" className="text-sm font-semibold">
          Sắp xếp
        </Label>
        <select
          id="venue-sort"
          aria-label="Sắp xếp danh sách"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as VenueSort)}
          className={cn(
            'h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors',
            'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          {availableSorts.map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}
