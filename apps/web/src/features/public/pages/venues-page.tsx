import {
  Crosshair,
  Loader2,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { type FormEvent, type ReactElement, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SUPPORTED_CITIES, calculateHaversineDistanceKm, districtsOfCity } from '@sango/shared';

import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/skeleton';
import { useToast } from '../../../components/ui/use-toast';

import { FilterSidebar, type PriceRange, type VenueSort } from '../components/filter-sidebar';
import { VenueCard } from '../components/venue-card';
import { useVenues } from '../queries';

function SkeletonGrid(): ReactElement {
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4"
      role="status"
      aria-busy="true"
      aria-label="Đang tải danh sách sân"
    >
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <div key={index} className="space-y-3 rounded-2xl border border-border/60 bg-card p-0 overflow-hidden shadow-xs">
          <Skeleton className="aspect-[16/10] w-full" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

const RADIUS_OPTIONS = [3, 5, 10, 20] as const;

export function VenuesPage(): ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const q = searchParams.get('q') ?? '';
  const sportTypeParam = searchParams.get('sportType') ?? undefined;
  const districtParam = searchParams.get('district') ?? undefined;
  const cityParam = searchParams.get('city') ?? undefined;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  const effectiveCity =
    cityParam ??
    SUPPORTED_CITIES.find((supported) => {
      if (districtParam === undefined) return false;
      return districtsOfCity(supported).some(
        (d) => d.toLowerCase() === districtParam.toLowerCase(),
      );
    });

  const [sort, setSort] = useState<VenueSort>('newest');
  const [draftQ, setDraftQ] = useState(q);
  const [priceRange, setPriceRange] = useState<PriceRange>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [timeSlotRange, setTimeSlotRange] = useState<string>('');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const geoSupported = typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);

  const query = useVenues({
    q: q === '' ? undefined : q,
    sportType: sportTypeParam,
    city: effectiveCity,
    district: districtParam,
    userLat: userCoords?.lat,
    userLng: userCoords?.lng,
    radiusKm,
    sortBy:
      sort === 'distance'
        ? 'distance'
        : sort === 'price-asc'
          ? 'price_asc'
          : sort === 'price-desc'
            ? 'price_desc'
            : undefined,
    page,
  });

  const items = useMemo(() => {
    let list = [...(query.data?.items ?? [])].map((venue) => {
      let distanceKm = venue.distanceKm;
      if (distanceKm === undefined && userCoords !== null && venue.lat && venue.lng) {
        distanceKm = calculateHaversineDistanceKm(
          userCoords.lat,
          userCoords.lng,
          venue.lat,
          venue.lng,
        );
      }
      return { ...venue, distanceKm };
    });

    if (sportTypeParam === 'FOOTBALL') {
      list = list.filter((v) =>
        v.courts?.some((c) => c.sportType === 'FOOTBALL5' || c.sportType === 'FOOTBALL7'),
      );
    }

    if (userCoords !== null && radiusKm !== undefined) {
      list = list.filter((venue) => venue.distanceKm !== undefined && venue.distanceKm <= radiusKm);
    }

    if (priceRange.min !== undefined || priceRange.max !== undefined) {
      list = list.filter((v) => {
        const prices = (v.courts ?? []).map((c) => c.defaultPricePerSlot).filter(Boolean);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        if (priceRange.min !== undefined && minPrice < priceRange.min) return false;
        if (priceRange.max !== undefined && minPrice > priceRange.max) return false;
        return true;
      });
    }

    list.sort((a, b) => {
      if (sort === 'distance') {
        return (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999);
      }
      const priceOf = (v: typeof a) => {
        const prices = (v.courts ?? []).map((c) => c.defaultPricePerSlot).filter(Boolean);
        return prices.length > 0 ? Math.min(...prices) : Number.MAX_SAFE_INTEGER;
      };
      if (sort === 'price-asc') return priceOf(a) - priceOf(b);
      if (sort === 'price-desc') return priceOf(b) - priceOf(a);
      return 0;
    });

    return list;
  }, [query.data, userCoords, radiusKm, sportTypeParam, priceRange, sort]);

  function applyFilters(next: {
    q?: string;
    sportType?: string;
    city?: string;
    district?: string;
    page?: number;
  }): void {
    const params = new URLSearchParams();
    if (next.q) params.set('q', next.q);
    if (next.sportType) params.set('sportType', next.sportType);
    if (next.city) params.set('city', next.city);
    else if ('city' in next) params.delete('city');
    if (next.district) params.set('district', next.district);
    params.set('page', String(next.page ?? 1));
    setSearchParams(params);
  }

  function handleGetLocation(): void {
    if (!geoSupported) {
      toast({
        title: 'Không hỗ trợ định vị',
        description: 'Trình duyệt của bạn không hỗ trợ định vị GPS.',
        variant: 'destructive',
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setRadiusKm(5);
        setSort('distance');
        toast({
          title: 'Đã xác định vị trí',
          description: 'Đang hiển thị các cụm sân trong bán kính 5 km quanh bạn.',
        });
      },
      () => {
        setIsLocating(false);
        toast({
          title: 'Lỗi định vị',
          description: 'Không thể lấy toạ độ GPS. Vui lòng chọn quận thủ công.',
          variant: 'destructive',
        });
      },
      { timeout: 8000, maximumAge: 60000 },
    );
  }

  function handleClearGps(): void {
    setUserCoords(null);
    setRadiusKm(undefined);
    if (sort === 'distance') setSort('newest');
  }

  function onSearchSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    applyFilters({
      q: draftQ.trim() || undefined,
      sportType: sportTypeParam,
      city: effectiveCity,
      district: districtParam,
    });
  }

  function handleResetAll(): void {
    setDraftQ('');
    setPriceRange({});
    setSelectedDate('');
    setTimeSlotRange('');
    handleClearGps();
    setSearchParams(new URLSearchParams());
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <form onSubmit={onSearchSubmit} className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              placeholder="Tìm theo tên sân, địa chỉ, tiện ích..."
              className="h-11 pl-10 rounded-xl bg-background text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Chọn thành phố"
              value={effectiveCity ?? ''}
              onChange={(e) =>
                applyFilters({
                  q: draftQ.trim() || undefined,
                  sportType: sportTypeParam,
                  city: e.target.value || undefined,
                  district: undefined,
                })
              }
              className="h-11 rounded-xl border border-input bg-background px-3 text-xs shadow-xs sm:w-36"
            >
              <option value="">Tất cả thành phố</option>
              {SUPPORTED_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              aria-label="Chọn quận huyện"
              value={districtParam ?? ''}
              disabled={!effectiveCity}
              onChange={(e) =>
                applyFilters({
                  q: draftQ.trim() || undefined,
                  sportType: sportTypeParam,
                  city: effectiveCity,
                  district: e.target.value || undefined,
                })
              }
              className="h-11 rounded-xl border border-input bg-background px-3 text-xs shadow-xs disabled:opacity-50 sm:w-40"
            >
              {effectiveCity ? (
                <>
                  <option value="">Tất cả quận/huyện</option>
                  {districtsOfCity(effectiveCity).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </>
              ) : (
                <option value="">Chọn TP trước</option>
              )}
            </select>

            <Button
              type="button"
              variant={userCoords !== null ? 'default' : 'outline'}
              onClick={handleGetLocation}
              disabled={isLocating || !geoSupported}
              className="h-11 rounded-xl font-semibold gap-1.5 px-3.5 text-xs"
            >
              {isLocating ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4 text-primary" />}
              <span>Gần tôi</span>
            </Button>

            <Button type="submit" className="h-11 rounded-xl px-5 font-bold text-xs gap-1.5">
              <Search className="size-4" />
              <span>Tìm kiếm</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMobileFilter(!showMobileFilter)}
              className="h-11 rounded-xl px-3 text-xs font-semibold lg:hidden gap-1.5"
            >
              <SlidersHorizontal className="size-4" />
              <span>Bộ lọc</span>
            </Button>
          </div>
        </form>

        {userCoords !== null ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-muted-foreground">Đang lọc theo vị trí GPS của bạn:</span>
              <div className="flex items-center gap-1">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadiusKm(r)}
                    className={`rounded-lg px-2 py-0.5 border text-xs transition ${
                      radiusKm === r ? 'bg-primary text-primary-foreground font-bold border-primary' : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearGps}
              className="h-6 text-[11px] text-muted-foreground hover:text-destructive gap-1 px-2"
            >
              <X className="size-3" /> Tắt GPS
            </Button>
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="hidden lg:block">
          <FilterSidebar
            sportType={sportTypeParam}
            city={effectiveCity}
            district={districtParam}
            sort={sort}
            hasGps={userCoords !== null}
            priceRange={priceRange}
            selectedDate={selectedDate}
            timeSlotRange={timeSlotRange}
            onSportTypeChange={(s) => applyFilters({ q, sportType: s, city: effectiveCity, district: districtParam })}
            onCityChange={(c) => applyFilters({ q, sportType: sportTypeParam, city: c, district: undefined })}
            onDistrictChange={(d) => applyFilters({ q, sportType: sportTypeParam, city: effectiveCity, district: d })}
            onSortChange={(nextSort) => setSort(nextSort)}
            onPriceRangeChange={(range) => setPriceRange(range)}
            onDateChange={(d) => setSelectedDate(d)}
            onTimeSlotRangeChange={(t) => setTimeSlotRange(t)}
            onResetFilters={handleResetAll}
          />
        </div>

        {showMobileFilter ? (
          <div className="block lg:hidden">
            <FilterSidebar
              sportType={sportTypeParam}
              city={effectiveCity}
              district={districtParam}
              sort={sort}
              hasGps={userCoords !== null}
              priceRange={priceRange}
              selectedDate={selectedDate}
              timeSlotRange={timeSlotRange}
              onSportTypeChange={(s) => applyFilters({ q, sportType: s, city: effectiveCity, district: districtParam })}
              onCityChange={(c) => applyFilters({ q, sportType: sportTypeParam, city: c, district: undefined })}
              onDistrictChange={(d) => applyFilters({ q, sportType: sportTypeParam, city: effectiveCity, district: d })}
              onSortChange={(nextSort) => setSort(nextSort)}
              onPriceRangeChange={(range) => setPriceRange(range)}
              onDateChange={(d) => setSelectedDate(d)}
              onTimeSlotRangeChange={(t) => setTimeSlotRange(t)}
              onResetFilters={handleResetAll}
            />
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">
              Tìm thấy <span className="font-bold text-foreground">{items.length}</span> cụm sân phù hợp
            </p>
          </div>

          {query.isPending ? (
            <SkeletonGrid />
          ) : query.isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center text-destructive">
              Đã xảy ra lỗi khi tải danh sách sân. Vui lòng thử lại sau.
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center space-y-3 bg-card/50">
              <SearchX className="mx-auto size-12 text-muted-foreground/50" />
              <h3 className="font-bold text-base">Không tìm thấy sân phù hợp</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Hãy thử nới lỏng bộ lọc khoảng giá, mở rộng bán kính GPS hoặc chọn khu vực lân cận.
              </p>
              <Button variant="outline" size="sm" onClick={handleResetAll} className="mt-2 rounded-xl text-xs">
                Xóa tất cả bộ lọc
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
              {items.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          )}

          {query.data && query.data.pages > 1 ? (
            <div className="flex justify-center gap-2 pt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => applyFilters({ q, sportType: sportTypeParam, city: effectiveCity, district: districtParam, page: page - 1 })}
                className="rounded-xl text-xs"
              >
                Trang trước
              </Button>
              <span className="flex items-center px-3 text-xs font-semibold text-muted-foreground">
                Trang {page} / {query.data.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= query.data.pages}
                onClick={() => applyFilters({ q, sportType: sportTypeParam, city: effectiveCity, district: districtParam, page: page + 1 })}
                className="rounded-xl text-xs"
              >
                Trang sau
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
