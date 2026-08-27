import { type ReactElement } from 'react';
import { SUPPORTED_CITIES, SportType, districtsOfCity } from '@sango/shared';

import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { PriceRangeSlider } from '../../../components/ui/price-range-slider';
import { cn } from '../../../lib/utils';
import { Activity, Calendar, Disc, DollarSign, Filter, Flame, RotateCcw, Trophy, Zap, Sun, Sunset, Moon } from 'lucide-react';

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
      className="space-y-5 rounded-2xl border border-border/70 bg-card p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)] lg:sticky lg:top-24"
    >
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
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

      {/* Môn thể thao — Lưới chọn sang trọng */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Môn thể thao
          </Label>
          {sportType !== undefined ? (
            <button
              type="button"
              onClick={() => onSportTypeChange(undefined)}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              Xem tất cả
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Chọn loại sân">
          <button
            type="button"
            className={cn(
              'col-span-2 flex items-center justify-center gap-2 rounded-xl border p-2 text-xs font-semibold transition-all duration-200',
              sportType === undefined
                ? 'border-primary bg-primary text-primary-foreground shadow-xs font-bold'
                : 'border-border/70 bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground',
            )}
            onClick={() => onSportTypeChange(undefined)}
          >
            <Trophy className="size-3.5 text-current" />
            <span>Tất cả môn</span>
          </button>

          <button
            type="button"
            className={cn(
              'flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all duration-200',
              isFootball
                ? 'border-primary bg-primary text-primary-foreground shadow-xs font-bold'
                : 'border-border/70 bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground',
            )}
            onClick={() => onSportTypeChange(isFootball ? undefined : 'FOOTBALL')}
          >
            <Activity className="size-3.5 text-current" />
            <span>Bóng đá</span>
          </button>

          <button
            type="button"
            className={cn(
              'flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all duration-200',
              sportType === SportType.BADMINTON
                ? 'border-primary bg-primary text-primary-foreground shadow-xs font-bold'
                : 'border-border/70 bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground',
            )}
            onClick={() =>
              onSportTypeChange(sportType === SportType.BADMINTON ? undefined : SportType.BADMINTON)
            }
          >
            <Zap className="size-3.5 text-current" />
            <span>Cầu lông</span>
          </button>

          <button
            type="button"
            className={cn(
              'flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all duration-200',
              sportType === SportType.PICKLEBALL
                ? 'border-primary bg-primary text-primary-foreground shadow-xs font-bold'
                : 'border-border/70 bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground',
            )}
            onClick={() =>
              onSportTypeChange(sportType === SportType.PICKLEBALL ? undefined : SportType.PICKLEBALL)
            }
          >
            <Disc className="size-3.5 text-current" />
            <span>Pickleball</span>
          </button>

          <button
            type="button"
            className={cn(
              'flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all duration-200',
              sportType === SportType.TENNIS
                ? 'border-primary bg-primary text-primary-foreground shadow-xs font-bold'
                : 'border-border/70 bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground',
            )}
            onClick={() =>
              onSportTypeChange(sportType === SportType.TENNIS ? undefined : SportType.TENNIS)
            }
          >
            <Flame className="size-3.5 text-current" />
            <span>Tennis</span>
          </button>
        </div>

        {/* Segmented control con cho Bóng đá */}
        {isFootball ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
              <span>Loại sân bóng đá:</span>
              <span className="text-[10px] font-normal text-muted-foreground">
                {sportType === 'FOOTBALL5'
                  ? 'Sân 5 người'
                  : sportType === 'FOOTBALL7'
                    ? 'Sân 7 người'
                    : 'Cả sân 5 & 7'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-background/90 p-1 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => onSportTypeChange('FOOTBALL')}
                className={cn(
                  'rounded-md py-1 text-[11px] font-semibold transition-all text-center',
                  sportType === 'FOOTBALL' || sportType === undefined
                    ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => onSportTypeChange('FOOTBALL5')}
                className={cn(
                  'rounded-md py-1 text-[11px] font-semibold transition-all text-center',
                  sportType === 'FOOTBALL5'
                    ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
              >
                Sân 5
              </button>
              <button
                type="button"
                onClick={() => onSportTypeChange('FOOTBALL7')}
                className={cn(
                  'rounded-md py-1 text-[11px] font-semibold transition-all text-center',
                  sportType === 'FOOTBALL7'
                    ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
              >
                Sân 7
              </button>
            </div>
          </div>
        ) : null}
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

      {/* Lọc theo mức giá (Dual Range Slider + Quick Buttons) */}
      <div className="space-y-3 border-t border-border/60 pt-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>Khoảng giá / slot</span>
          <DollarSign className="size-3.5 text-primary" />
        </Label>
        
        <PriceRangeSlider
          min={priceRange.min}
          max={priceRange.max}
          minLimit={0}
          maxLimit={600000}
          step={20000}
          onChange={(range) => onPriceRangeChange?.(range)}
        />

        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => handleQuickPrice(undefined, 100000)}
            className="rounded-lg border border-border/60 bg-muted/40 px-2 py-1 text-[11px] font-medium hover:bg-muted transition"
          >
            &lt; 100k
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrice(100000, 200000)}
            className="rounded-lg border border-border/60 bg-muted/40 px-2 py-1 text-[11px] font-medium hover:bg-muted transition"
          >
            100k - 200k
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrice(200000, undefined)}
            className="rounded-lg border border-border/60 bg-muted/40 px-2 py-1 text-[11px] font-medium hover:bg-muted transition"
          >
            &gt; 200k
          </button>
        </div>
      </div>

      {/* Date & Khung giờ */}
      <div className="space-y-2 border-t border-border/60 pt-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>Thời gian & Slot</span>
          <Calendar className="size-3.5 text-primary" />
        </Label>
        <div className="relative">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange?.(e.target.value)}
            className="h-8 rounded-lg text-xs pl-8"
          />
        </div>
        <div className="grid grid-cols-3 gap-1 pt-1">
          {[
            { id: 'morning', label: 'Sáng', sub: '6-12h', icon: Sun },
            { id: 'afternoon', label: 'Chiều', sub: '12-17h', icon: Sunset },
            { id: 'evening', label: 'Tối', sub: '17-23h', icon: Moon },
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = timeSlotRange === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTimeSlotRangeChange?.(isSelected ? '' : t.id)}
                className={cn(
                  'flex flex-col items-center justify-center rounded-lg border p-1.5 text-center transition',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                    : 'border-border/60 hover:bg-muted/60 text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-3 mb-0.5" />
                <span className="text-[11px] font-semibold">{t.label}</span>
                <span className="text-[9px] opacity-75">{t.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sắp xếp */}
      <div className="space-y-1.5 border-t border-border/60 pt-3">
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
