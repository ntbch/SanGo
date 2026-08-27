import React from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { VenueFilters } from '../api/venues-api';
import { SportType } from '../../../lib/constants';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Map,
  Crosshair,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../../lib/utils';

export interface VenueTopSortBarProps {
  filters: VenueFilters;
  onFilterChange: (newFilters: VenueFilters) => void;
  onOpenMobileDrawer: () => void;
  totalCount?: number;
}

export function VenueTopSortBar({
  filters,
  onFilterChange,
  onOpenMobileDrawer,
  totalCount,
}: VenueTopSortBarProps): React.ReactElement {
  const sports = [
    { type: '', label: 'Tất cả môn' },
    { type: SportType.FOOTBALL5, label: 'Bóng đá' },
    { type: SportType.PICKLEBALL, label: 'Pickleball' },
    { type: SportType.BADMINTON, label: 'Cầu lông' },
    { type: SportType.TENNIS, label: 'Tennis' },
  ];

  const handleSportSelect = (sportType: string) => {
    onFilterChange({ ...filters, sportType: sportType || undefined });
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

  // Tính số lượng bộ lọc đang active
  let activeFilterCount = 0;
  if (filters.district) activeFilterCount++;
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) activeFilterCount++;
  if (filters.minRating !== undefined) activeFilterCount++;
  if (filters.amenities && filters.amenities.length > 0) activeFilterCount++;
  if (filters.timeOfDay) activeFilterCount++;

  return (
    <div className="w-full space-y-3">
      {/* Mobile Sport Pills + Filter Drawer Trigger (Hidden on Desktop) */}
      <div className="flex lg:hidden items-center justify-between gap-2">
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
                    : 'bg-secondary/70 text-muted-foreground hover:text-foreground border border-border/40',
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenMobileDrawer}
          className="h-8 gap-1 text-xs font-bold shrink-0 border-primary/40 text-primary"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Lọc {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
        </Button>
      </div>

      {/* Main Sort & Search Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-card/80 border border-border/80 backdrop-blur-md shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-md">
          <Input
            placeholder="Tìm theo tên sân hoặc địa chỉ..."
            value={filters.q || ''}
            onChange={(e) => onFilterChange({ ...filters, q: e.target.value || undefined })}
            prefixIcon={<Search className="h-4 w-4 text-muted-foreground" />}
            className="h-9 text-xs bg-background/70"
          />
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* GPS Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleGetLocation}
            title="Lọc sân gần tôi"
            className={cn(
              'h-9 px-2.5 text-xs font-semibold gap-1.5',
              filters.userLat && 'text-primary bg-primary/10',
            )}
          >
            <Crosshair className="h-4 w-4 text-primary" />
            <span className="hidden md:inline">{filters.userLat ? 'Gần tôi' : 'GPS'}</span>
          </Button>

          {/* Sort Select */}
          <select
            value={filters.sortBy || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                sortBy: (e.target.value as any) || undefined,
              })
            }
            className="flex h-9 rounded-xl border border-input bg-background/80 px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            <option value="">Sắp xếp: Mặc định</option>
            <option value="distance">Gần tôi nhất</option>
            <option value="rating_desc">Đánh giá cao nhất</option>
            <option value="price_asc">Giá: Thấp đến cao</option>
            <option value="price_desc">Giá: Cao đến thấp</option>
          </select>

          {/* Switch to Map View Link */}
          <Link to="/map">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs font-bold border-border/80 hover:border-primary/40 hover:text-primary"
            >
              <Map className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">Bản đồ</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Result Status & District Pill */}
      {totalCount !== undefined && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Tìm thấy <strong className="text-foreground">{totalCount}</strong> cụm sân phù hợp
          </span>
          {filters.district && (
            <span className="inline-flex items-center gap-1 font-semibold text-primary">
              <MapPin className="h-3.5 w-3.5" />
              <span>{filters.district}, {filters.city}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
