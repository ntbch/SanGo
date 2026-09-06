import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { DualRangeSlider } from '../../../components/ui/dual-range-slider';
import { SportType, CITIES, DISTRICTS_BY_CITY } from '../../../lib/constants';
import { VenueFilters } from '../api/venues-api';
import {
  RotateCcw,
  SlidersHorizontal,
  Star,
  Clock,
  Coins,
  MapPin,
  Flame,
  Zap,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface VenueFilterSidebarProps {
  filters: VenueFilters;
  onFilterChange: (newFilters: VenueFilters) => void;
}

const COMMON_AMENITIES = [
  'Bãi đỗ xe ô tô',
  'Đèn chiếu sáng đêm',
  'Tắm nóng lạnh',
  'Cho thuê dụng cụ',
  'Điều hòa',
  'Căng tin / Nước uống',
  'Khán đài',
];

export function VenueFilterSidebar({
  filters,
  onFilterChange,
}: VenueFilterSidebarProps): React.ReactElement {
  const sports = [
    { type: '', label: 'Tất cả môn' },
    { type: SportType.FOOTBALL5, label: 'Bóng đá' },
    { type: SportType.PICKLEBALL, label: 'Pickleball' },
    { type: SportType.BADMINTON, label: 'Cầu lông' },
    { type: SportType.TENNIS, label: 'Tennis' },
  ];

  const currentCity = (filters.city as (typeof CITIES)[number]) || 'Hà Nội';
  const availableDistricts = DISTRICTS_BY_CITY[currentCity] || [];

  const minPrice = filters.minPrice ?? 50000;
  const maxPrice = filters.maxPrice ?? 1500000;

  const handleSportSelect = (sportType: string) => {
    onFilterChange({ ...filters, sportType: sportType || undefined });
  };

  const handleCityChange = (city: string) => {
    onFilterChange({ ...filters, city, district: undefined });
  };

  const handleDistrictChange = (district: string) => {
    onFilterChange({ ...filters, district: district || undefined });
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    onFilterChange({
      ...filters,
      minPrice: range[0] > 50000 ? range[0] : undefined,
      maxPrice: range[1] < 1500000 ? range[1] : undefined,
    });
  };

  const handlePricePreset = (min?: number, max?: number) => {
    onFilterChange({ ...filters, minPrice: min, maxPrice: max });
  };

  const handleAmenityToggle = (amenity: string) => {
    const current = filters.amenities || [];
    const updated = current.includes(amenity)
      ? current.filter((item) => item !== amenity)
      : [...current, amenity];
    onFilterChange({ ...filters, amenities: updated.length > 0 ? updated : undefined });
  };

  const handleRatingSelect = (rating?: number) => {
    onFilterChange({ ...filters, minRating: rating });
  };

  const handleTimeOfDaySelect = (time?: 'morning' | 'afternoon' | 'evening') => {
    onFilterChange({ ...filters, timeOfDay: filters.timeOfDay === time ? undefined : time });
  };

  const handleReset = () => {
    onFilterChange({
      city: 'Hà Nội',
    });
  };

  const hasActiveFilters = Boolean(
    filters.sportType ||
      filters.district ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      filters.minRating !== undefined ||
      (filters.amenities && filters.amenities.length > 0) ||
      filters.timeOfDay,
  );

  return (
    <Card className="w-72 shrink-0 hidden lg:block sticky top-20 border-border/80 bg-card shadow-xs self-start">
      <CardHeader className="p-4 pb-3 border-b border-border/60 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span>Bộ Lọc Nâng Cao</span>
        </CardTitle>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 px-2 text-[11px] font-semibold text-muted-foreground hover:text-destructive gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Xóa lọc</span>
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-5 text-xs max-h-[calc(100vh-10rem)] overflow-y-auto pr-2">
        {/* 1. Môn Thể Thao */}
        <div className="space-y-2">
          <label className="font-bold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-primary" />
            <span>Môn Thể Thao</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {sports.map((s) => {
              const isActive = (!filters.sportType && !s.type) || filters.sportType === s.type;
              return (
                <button
                  key={s.type}
                  type="button"
                  onClick={() => handleSportSelect(s.type)}
                  className={cn(
                    'py-1.5 px-2 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer truncate',
                    isActive
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary',
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Địa Điểm & Khu Vực */}
        <div className="space-y-2 pt-3 border-t border-border/50">
          <label className="font-bold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>Khu Vực</span>
          </label>
          <div className="space-y-2">
            <select
              value={filters.city || 'Hà Nội'}
              onChange={(e) => handleCityChange(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-card/60 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={filters.district || ''}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-card/60 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Tất cả quận / huyện</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Khoảng Giá Thuê (Thanh Kéo 2 Đầu Dual Range Slider) */}
        <div className="space-y-3 pt-3 border-t border-border/50">
          <label className="font-bold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Coins className="h-3.5 w-3.5 text-primary" />
            <span>Khoảng Giá</span>
          </label>

          {/* Dual Range Slider Component */}
          <DualRangeSlider
            min={50000}
            max={1500000}
            step={25000}
            value={[minPrice, maxPrice]}
            onChange={handlePriceRangeChange}
          />

          {/* Quick Presets */}
          <div className="grid grid-cols-3 gap-1 pt-1">
            <button
              type="button"
              onClick={() => handlePricePreset(undefined, 200000)}
              className={cn(
                'py-1 rounded-md text-[10px] font-semibold border transition-colors cursor-pointer',
                filters.maxPrice === 200000 && filters.minPrice === undefined
                  ? 'border-primary bg-primary/10 text-primary font-bold'
                  : 'border-border/60 text-muted-foreground hover:text-foreground',
              )}
            >
              &lt; 200k
            </button>
            <button
              type="button"
              onClick={() => handlePricePreset(200000, 500000)}
              className={cn(
                'py-1 rounded-md text-[10px] font-semibold border transition-colors cursor-pointer',
                filters.minPrice === 200000 && filters.maxPrice === 500000
                  ? 'border-primary bg-primary/10 text-primary font-bold'
                  : 'border-border/60 text-muted-foreground hover:text-foreground',
              )}
            >
              200k-500k
            </button>
            <button
              type="button"
              onClick={() => handlePricePreset(500000, undefined)}
              className={cn(
                'py-1 rounded-md text-[10px] font-semibold border transition-colors cursor-pointer',
                filters.minPrice === 500000 && filters.maxPrice === undefined
                  ? 'border-primary bg-primary/10 text-primary font-bold'
                  : 'border-border/60 text-muted-foreground hover:text-foreground',
              )}
            >
              &gt; 500k
            </button>
          </div>
        </div>

        {/* 4. Khung Giờ Chơi */}
        <div className="space-y-2 pt-3 border-t border-border/50">
          <label className="font-bold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Khung Giờ Hoạt Động</span>
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'morning', label: 'Sáng (06-12h)' },
              { id: 'afternoon', label: 'Chiều (12-17h)' },
              { id: 'evening', label: 'Tối (17-23h)' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTimeOfDaySelect(t.id as any)}
                className={cn(
                  'py-1.5 px-1 rounded-lg text-[10px] font-semibold border transition-all text-center cursor-pointer',
                  filters.timeOfDay === t.id
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border/60 text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Tiện Ích Sân */}
        <div className="space-y-2 pt-3 border-t border-border/50">
          <label className="font-bold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span>Tiện Ích Cụm Sân</span>
          </label>
          <div className="space-y-1.5">
            {COMMON_AMENITIES.map((amenity) => {
              const checked = (filters.amenities || []).includes(amenity);
              return (
                <label
                  key={amenity}
                  className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleAmenityToggle(amenity)}
                    className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary accent-emerald-500 cursor-pointer"
                  />
                  <span className={cn('text-xs', checked && 'text-foreground font-semibold')}>
                    {amenity}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 6. Đánh Giá Tối Thiểu */}
        <div className="space-y-2 pt-3 border-t border-border/50">
          <label className="font-bold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <span>Đánh Giá Sao</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { val: undefined, label: 'Tất cả' },
              { val: 4.5, label: '4.5 sao trở lên' },
              { val: 4.0, label: '4.0 sao trở lên' },
              { val: 3.5, label: '3.5 sao trở lên' },
            ].map((r) => (
              <button
                key={String(r.val)}
                type="button"
                onClick={() => handleRatingSelect(r.val)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer',
                  filters.minRating === r.val
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
