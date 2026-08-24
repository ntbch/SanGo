import { type ReactElement } from 'react';
import { SportType, SPORT_TYPE_LABELS } from '@courthub/shared';

import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';

import { cn } from '../../../lib/utils';

export type VenueSort = 'newest' | 'price-asc' | 'price-desc';

export const SORT_LABELS: Record<VenueSort, string> = {
  newest: 'Mới nhất',
  'price-asc': 'Giá tăng dần',
  'price-desc': 'Giá giảm dần',
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
  sort: VenueSort;
  onSportTypeChange: (value?: string) => void;
  onSortChange: (value: VenueSort) => void;
}

/**
 * Cột lọc trái: chip loại sân (backend nhận 1 giá trị sportType nên hành vi
 * chọn-một) + sắp xếp giá. Dùng native select để không kéo thêm Radix.
 */
export function FilterSidebar({
  sportType,
  sort,
  onSortChange,
  onSportTypeChange,
}: FilterSidebarProps): ReactElement {
  return (
    <aside className="space-y-6" aria-label="Bộ lọc tìm kiếm">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Loại sân</Label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn loại sân">
          <Button
            type="button"
            variant={sportType === undefined ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
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
              className="rounded-full"
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
          value={sort}
          onChange={(event) => onSortChange(event.target.value as VenueSort)}
          className={cn(
            'h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          {(Object.keys(SORT_LABELS) as VenueSort[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}
