import React from 'react';
import { Button } from '../../../components/ui/button';
import { DualRangeSlider } from '../../../components/ui/dual-range-slider';
import { SportType, CITIES, DISTRICTS_BY_CITY } from '../../../lib/constants';
import { VenueFilters } from '../api/venues-api';
import {
  X,
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

export interface VenueMobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: VenueFilters;
  onFilterChange: (newFilters: VenueFilters) => void;
  totalCount?: number;
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

export function VenueMobileFilterDrawer({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  totalCount,
}: VenueMobileFilterDrawerProps): React.ReactElement | null {
  const [draftFilters, setDraftFilters] = React.useState<VenueFilters>(filters);

  React.useEffect(() => {
    setDraftFilters(filters);
  }, [filters, isOpen]);

  if (!isOpen) return null;

  const sports = [
    { type: '', label: 'Tất cả môn' },
    { type: SportType.FOOTBALL5, label: 'Bóng đá' },
    { type: SportType.PICKLEBALL, label: 'Pickleball' },
    { type: SportType.BADMINTON, label: 'Cầu lông' },
    { type: SportType.TENNIS, label: 'Tennis' },
  ];

  const currentCity = (draftFilters.city as (typeof CITIES)[number]) || 'Hà Nội';
  const availableDistricts = DISTRICTS_BY_CITY[currentCity] || [];

  const minPrice = draftFilters.minPrice ?? 50000;
  const maxPrice = draftFilters.maxPrice ?? 1500000;

  const handlePriceRangeChange = (range: [number, number]) => {
    setDraftFilters({
      ...draftFilters,
      minPrice: range[0] > 50000 ? range[0] : undefined,
      maxPrice: range[1] < 1500000 ? range[1] : undefined,
    });
  };

  const handleApply = () => {
    onFilterChange(draftFilters);
    onClose();
  };

  const handleReset = () => {
    const resetState: VenueFilters = { city: 'Hà Nội' };
    setDraftFilters(resetState);
    onFilterChange(resetState);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 animate-in fade-in duration-150">
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col bg-card border-t sm:border border-border/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <h3 className="text-base font-bold text-foreground">Bộ Lọc Tìm Kiếm</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {/* 1. Môn Thể Thao */}
          <div className="space-y-2">
            <label className="font-bold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-primary" />
              <span>Môn Thể Thao</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {sports.map((s) => {
                const isActive =
                  (!draftFilters.sportType && !s.type) || draftFilters.sportType === s.type;
                return (
                  <button
                    key={s.type}
                    type="button"
                    onClick={() =>
                      setDraftFilters({ ...draftFilters, sportType: s.type || undefined })
                    }
                    className={cn(
                      'py-2 px-3 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer',
                      isActive
                        ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                        : 'bg-secondary/70 text-muted-foreground hover:bg-secondary',
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Khu Vực */}
          <div className="space-y-2 pt-3 border-t border-border/50">
            <label className="font-bold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>Khu Vực</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={draftFilters.city || 'Hà Nội'}
                onChange={(e) =>
                  setDraftFilters({ ...draftFilters, city: e.target.value, district: undefined })
                }
                className="flex h-9 w-full rounded-xl border border-input bg-card/60 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={draftFilters.district || ''}
                onChange={(e) =>
                  setDraftFilters({ ...draftFilters, district: e.target.value || undefined })
                }
                className="flex h-9 w-full rounded-xl border border-input bg-card/60 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Tất cả quận/huyện</option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Khoảng Giá (Dual Range Slider) */}
          <div className="space-y-3 pt-3 border-t border-border/50">
            <label className="font-bold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Coins className="h-3.5 w-3.5 text-primary" />
              <span>Khoảng Giá</span>
            </label>

            <DualRangeSlider
              min={50000}
              max={1500000}
              step={25000}
              value={[minPrice, maxPrice]}
              onChange={handlePriceRangeChange}
            />
          </div>

          {/* 4. Khung Giờ */}
          <div className="space-y-2 pt-3 border-t border-border/50">
            <label className="font-bold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Khung Giờ Hoạt Động</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'morning', label: 'Sáng (06-12h)' },
                { id: 'afternoon', label: 'Chiều (12-17h)' },
                { id: 'evening', label: 'Tối (17-23h)' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setDraftFilters({
                      ...draftFilters,
                      timeOfDay: draftFilters.timeOfDay === t.id ? undefined : (t.id as any),
                    })
                  }
                  className={cn(
                    'py-2 px-1 rounded-xl text-[11px] font-semibold border transition-all text-center cursor-pointer',
                    draftFilters.timeOfDay === t.id
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-border/60 text-muted-foreground',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Tiện Ích */}
          <div className="space-y-2 pt-3 border-t border-border/50">
            <label className="font-bold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span>Tiện Ích Cụm Sân</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_AMENITIES.map((amenity) => {
                const checked = (draftFilters.amenities || []).includes(amenity);
                return (
                  <label
                    key={amenity}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-secondary/50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const current = draftFilters.amenities || [];
                        const updated = current.includes(amenity)
                          ? current.filter((item) => item !== amenity)
                          : [...current, amenity];
                        setDraftFilters({
                          ...draftFilters,
                          amenities: updated.length > 0 ? updated : undefined,
                        });
                      }}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary accent-emerald-500 cursor-pointer"
                    />
                    <span className={cn('text-xs', checked && 'text-foreground font-semibold')}>
                      {amenity}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 6. Đánh Giá */}
          <div className="space-y-2 pt-3 border-t border-border/50">
            <label className="font-bold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span>Đánh Giá Tối Thiểu</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { val: undefined, label: 'Tất cả' },
                { val: 4.5, label: '4.5 sao trở lên' },
                { val: 4.0, label: '4.0 sao trở lên' },
                { val: 3.5, label: '3.5 sao trở lên' },
              ].map((r) => (
                <button
                  key={String(r.val)}
                  type="button"
                  onClick={() => setDraftFilters({ ...draftFilters, minRating: r.val })}
                  className={cn(
                    'py-1.5 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer',
                    draftFilters.minRating === r.val
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-border text-muted-foreground',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Sticky Footer */}
        <div className="p-4 border-t border-border/80 bg-card/95 flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 font-semibold text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Xóa lọc</span>
          </Button>

          <Button
            variant="default"
            onClick={handleApply}
            className="flex-2 font-bold text-xs shadow-xs"
          >
            <span>Áp dụng {totalCount !== undefined ? `(Xem ${totalCount} sân)` : ''}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
