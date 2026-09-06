import React from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { SportType, CITIES, DISTRICTS_BY_CITY } from '../../../lib/constants';
import { Search, MapPin, SlidersHorizontal, RotateCcw, Crosshair } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface VenueFilters {
  sportType?: string;
  city?: string;
  district?: string;
  q?: string;
  userLat?: number;
  userLng?: number;
  radiusKm?: number;
  sortBy?: 'distance' | 'price_asc' | 'price_desc';
}

export interface VenueFilterBarProps {
  filters: VenueFilters;
  onFilterChange: (newFilters: VenueFilters) => void;
  totalCount?: number;
}

export function VenueFilterBar({
  filters,
  onFilterChange,
  totalCount,
}: VenueFilterBarProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const sports = [
    { type: '', label: 'Tất cả môn' },
    { type: SportType.FOOTBALL5, label: 'Bóng đá' },
    { type: SportType.PICKLEBALL, label: 'Pickleball' },
    { type: SportType.BADMINTON, label: 'Cầu lông' },
    { type: SportType.TENNIS, label: 'Tennis' },
  ];

  const currentCity = (filters.city as (typeof CITIES)[number]) || 'Hà Nội';
  const availableDistricts = DISTRICTS_BY_CITY[currentCity] || [];

  const handleSportSelect = (sportType: string) => {
    onFilterChange({ ...filters, sportType: sportType || undefined });
  };

  const handleCityChange = (city: string) => {
    onFilterChange({ ...filters, city, district: undefined });
  };

  const handleDistrictChange = (district: string) => {
    onFilterChange({ ...filters, district: district || undefined });
  };

  const handleSortChange = (sortBy: 'distance' | 'price_asc' | 'price_desc' | '') => {
    onFilterChange({ ...filters, sortBy: sortBy ? sortBy : undefined });
  };

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onFilterChange({
            ...filters,
            userLat: pos.coords.latitude,
            userLng: pos.coords.longitude,
            sortBy: 'distance',
          });
        },
        () => {
          alert('Không thể truy cập vị trí hiện tại');
        },
      );
    }
  };

  const handleResetFilters = () => {
    onFilterChange({
      city: 'Hà Nội',
    });
  };

  const hasActiveFilters = Boolean(
    filters.sportType || filters.district || filters.q || filters.radiusKm || filters.sortBy,
  );

  return (
    <div className="sticky top-16 z-30 w-full bg-card border-b border-border/80 px-4 sm:px-6 md:px-8 lg:px-12 py-3 space-y-2.5 shadow-xs">
      {/* Row 1: Sport Pills & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Sport Pills (Horizontal scrollable on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {sports.map((s) => {
            const isActive = (!filters.sportType && !s.type) || filters.sportType === s.type;
            return (
              <button
                key={s.type}
                type="button"
                onClick={() => handleSportSelect(s.type)}
                className={cn(
                  'whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/40',
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Search Input & Toggle Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Input
              placeholder="Tìm theo tên sân..."
              value={filters.q || ''}
              onChange={(e) => onFilterChange({ ...filters, q: e.target.value || undefined })}
              prefixIcon={<Search className="h-4 w-4 text-muted-foreground" />}
              className="h-8 text-xs bg-background/80"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn('h-8 gap-1.5 text-xs font-semibold', isExpanded && 'border-primary text-primary')}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bộ lọc nâng cao</span>
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              title="Xóa bộ lọc"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Row 2: Expanded Filters Drawer */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-border/60 animate-in slide-in-from-top-1 duration-150 text-xs">
          {/* Chọn Thành phố */}
          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Thành phố</label>
            <select
              value={filters.city || 'Hà Nội'}
              onChange={(e) => handleCityChange(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-background/80 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Chọn Quận / Huyện */}
          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Quận / Huyện</label>
            <select
              value={filters.district || ''}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-background/80 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Tất cả quận/huyện</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Sắp xếp */}
          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Sắp xếp theo</label>
            <select
              value={filters.sortBy || ''}
              onChange={(e) =>
                handleSortChange(e.target.value as 'distance' | 'price_asc' | 'price_desc' | '')
              }
              className="flex h-8 w-full rounded-lg border border-input bg-background/80 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Mặc định</option>
              <option value="distance">Gần tôi nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
            </select>
          </div>

          {/* Định vị GPS */}
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleGetLocation}
              className="w-full h-8 gap-1.5 text-xs font-semibold"
            >
              <Crosshair className="h-3.5 w-3.5 text-primary" />
              <span>{filters.userLat ? 'Đã lấy vị trí GPS' : 'Lấy vị trí gần tôi'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Results Count Line */}
      {totalCount !== undefined && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
          <span>Tìm thấy <strong className="text-foreground">{totalCount}</strong> cụm sân phù hợp</span>
          {filters.district && (
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              <MapPin className="h-3 w-3" />
              <span>{filters.district}, {filters.city}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
