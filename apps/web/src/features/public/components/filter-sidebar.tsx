import { type ReactElement } from 'react';
import { SUPPORTED_CITIES, SportType, districtsOfCity } from '@sango/shared';

import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { cn } from '../../../lib/utils';
import { Calendar, DollarSign, Filter, RotateCcw } from 'lucide-react';

export type VenueSort = 'newest' | 'price-asc' | 'price-desc' | 'distance';

export const SORT_LABELS: Record<VenueSort, string> = {
  newest: 'Mới nhất',
  'price-asc': 'Giá tăng dần',
  'price-desc': 'Giá giảm dần',
  distance: 'Gần nhất trước (GPS)',
};

export interface PriceRange {
  min?: number;
  max?: number;
}

interface FilterSidebarProps {
  sportType?: string;
  city?: string;
  district?: string;
  sort: VenueSort;
  hasGps?: boolean;
  priceRange?: PriceRange;
  selectedDate?: string;
  timeSlotRange?: string; // 'morning' | 'afternoon' | 'evening' | ''
  onSportTypeChange: (value?: string) => void;
  onCityChange: (value?: string) => void;
  onDistrictChange: (value?: string) => void;
  onSortChange: (value: VenueSort) => void;
  onPriceRangeChange?: (range: PriceRange) => void;
  onDateChange?: (date: string) => void;
  onTimeSlotRangeChange?: (range: string) => void;
  onResetFilters?: () => void;
}

export function FilterSidebar({
  sportType,
  city,
  district,
  sort,
  hasGps = false,
  priceRange = {},
  selectedDate = '',
  timeSlotRange = '',
  onCityChange,
  onDistrictChange,
  onSortChange,
  onSportTypeChange,
  onPriceRangeChange,
  onDateChange,
  onTimeSlotRangeChange,
  onResetFilters,
}: FilterSidebarProps): ReactElement {
  const districtOptions = city ? districtsOfCity(city) : [];
  const availableSorts: VenueSort[] = hasGps
    ? ['distance', 'newest', 'price-asc', 'price-desc']
    : ['newest', 'price-asc', 'price-desc', 'distance'];

  const handleQuickPrice = (min?: number, max?: number) => {
    onPriceRangeChange?.({ min, max });
  };

  const isFootball = sportType === 'FOOTBALL' || sportType === 'FOOTBALL5' || sportType === 'FOOTBALL7';

  return (
    <aside
      aria-label="Bộ lọc tìm kiếm"
      className="space-y-5 rounded-2xl border border-border/70 bg-card p-5 shadow-sm lg:sticky lg:top-24"
    >
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2 font-bold text-sm text-foreground">
          <Filter className="size-4 text-primary" />
          <span>Bộ lọc tìm kiếm</span>
        </div>
        {onResetFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
          >
            <RotateCcw className="size-3" /> Đặt lại
          </Button>
        ) : null}
      </div>

      {/* Môn thể thao — Gộp Bóng đá */}
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Môn thể thao
        </Label>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Chọn loại sân">
          <Button
            type="button"
            variant={sportType === undefined ? 'default' : 'outline'}
            size="sm"
            className={cn('rounded-xl text-xs h-8 px-3', sportType === undefined && 'font-bold')}
            onClick={() => onSportTypeChange(undefined)}
          >
            Tất cả
          </Button>
          <Button
            type="button"
            variant={isFootball ? 'default' : 'outline'}
            size="sm"
            className={cn('rounded-xl text-xs h-8 px-3', isFootball && 'font-bold')}
            onClick={() => onSportTypeChange(isFootball ? undefined : 'FOOTBALL')}
          >
            ⚽ Bóng đá
          </Button>
          <Button
            type="button"
            variant={sportType === SportType.BADMINTON ? 'default' : 'outline'}
            size="sm"
            className={cn('rounded-xl text-xs h-8 px-3', sportType === SportType.BADMINTON && 'font-bold')}
            onClick={() => onSportTypeChange(sportType === SportType.BADMINTON ? undefined : SportType.BADMINTON)}
          >
            🏸 Cầu lông
          </Button>
          <Button
            type="button"
            variant={sportType === SportType.PICKLEBALL ? 'default' : 'outline'}
            size="sm"
            className={cn('rounded-xl text-xs h-8 px-3', sportType === SportType.PICKLEBALL && 'font-bold')}
            onClick={() => onSportTypeChange(sportType === SportType.PICKLEBALL ? undefined : SportType.PICKLEBALL)}
          >
            🏓 Pickleball
          </Button>
          <Button
            type="button"
            variant={sportType === SportType.TENNIS ? 'default' : 'outline'}
            size="sm"
            className={cn('rounded-xl text-xs h-8 px-3', sportType === SportType.TENNIS && 'font-bold')}
            onClick={() => onSportTypeChange(sportType === SportType.TENNIS ? undefined : SportType.TENNIS)}
          >
            🎾 Tennis
          </Button>
        </div>
      </div>

      {/* Địa điểm Thành phố & Quận */}
      <div className="grid gap-2.5">
        <div className="space-y-1">
          <Label htmlFor="venue-city" className="text-xs font-semibold text-muted-foreground">
            Thành phố
          </Label>
          <select
            id="venue-city"
            aria-label="Chọn thành phố"
            value={city ?? ''}
            onChange={(event) => onCityChange(event.target.value ? event.target.value : undefined)}
            className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Tất cả thành phố</option>
            {SUPPORTED_CITIES.map((supported) => (
              <option key={supported} value={supported}>
                {supported}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="venue-district" className="text-xs font-semibold text-muted-foreground">
            Quận / Huyện
          </Label>
          <select
            id="venue-district"
            aria-label="Chọn quận huyện"
            value={district ?? ''}
            disabled={!city}
            onChange={(event) =>
              onDistrictChange(event.target.value ? event.target.value : undefined)
            }
            className={cn(
              'h-9 w-full rounded-xl border border-input bg-background px-3 text-xs shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              !city && 'cursor-not-allowed opacity-60',
            )}
          >
            {city ? (
              <>
                <option value="">Tất cả quận/huyện</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </>
            ) : (
              <option value="">Chọn thành phố trước</option>
            )}
          </select>
        </div>
      </div>

      {/* Lọc theo mức giá (Min - Max + Nút nhanh) */}
      <div className="space-y-2 border-t pt-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>Khoảng giá / slot</span>
          <DollarSign className="size-3.5 text-primary" />
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min (₫)"
            value={priceRange.min ?? ''}
            onChange={(e) =>
              onPriceRangeChange?.({
                ...priceRange,
                min: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="h-8 rounded-lg text-xs"
          />
          <span className="text-muted-foreground text-xs">–</span>
          <Input
            type="number"
            placeholder="Max (₫)"
            value={priceRange.max ?? ''}
            onChange={(e) =>
              onPriceRangeChange?.({
                ...priceRange,
                max: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="h-8 rounded-lg text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          <button
            type="button"
            onClick={() => handleQuickPrice(undefined, 100000)}
            className="rounded-lg border px-2 py-1 text-[11px] hover:bg-muted transition"
          >
            &lt; 100k
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrice(100000, 200000)}
            className="rounded-lg border px-2 py-1 text-[11px] hover:bg-muted transition"
          >
            100k - 200k
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrice(200000, undefined)}
            className="rounded-lg border px-2 py-1 text-[11px] hover:bg-muted transition"
          >
            &gt; 200k
          </button>
        </div>
      </div>

      {/* Date & Khung giờ */}
      <div className="space-y-2 border-t pt-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>Thời gian & Slot</span>
          <Calendar className="size-3.5 text-primary" />
        </Label>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange?.(e.target.value)}
          className="h-8 rounded-lg text-xs"
        />
        <div className="grid grid-cols-3 gap-1 pt-1">
          {[
            { id: 'morning', label: 'Sáng (6-12h)' },
            { id: 'afternoon', label: 'Chiều (12-17h)' },
            { id: 'evening', label: 'Tối (17-23h)' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTimeSlotRangeChange?.(timeSlotRange === t.id ? '' : t.id)}
              className={cn(
                'rounded-lg border p-1 text-[10px] text-center transition truncate',
                timeSlotRange === t.id ? 'bg-primary text-primary-foreground border-primary font-bold' : 'hover:bg-muted',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sắp xếp */}
      <div className="space-y-1.5 border-t pt-3">
        <Label htmlFor="venue-sort" className="text-xs font-semibold text-muted-foreground">
          Sắp xếp hiển thị
        </Label>
        <select
          id="venue-sort"
          aria-label="Sắp xếp danh sách"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as VenueSort)}
          className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
