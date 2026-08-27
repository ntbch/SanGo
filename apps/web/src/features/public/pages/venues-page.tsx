import {
  Crosshair,
  Loader2,
  MapPin,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { type FormEvent, type ReactElement, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SUPPORTED_CITIES,
  SPORT_TYPE_LABELS,
  calculateHaversineDistanceKm,
  districtsOfCity,
  type SportType,
} from '@sango/shared';

import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/skeleton';
import { useToast } from '../../../components/ui/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../components/ui/sheet';

import { FilterSidebar, type PriceRange, type VenueSort } from '../components/filter-sidebar';
import { VenueCard } from '../components/venue-card';
import { useVenues } from '../queries';

function SkeletonGrid(): ReactElement {
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4"
      role="status"
      aria-busy="true"
      aria-label="Đang tải danh sách sân"
    >
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
        <div
          key={index}
          className="space-y-3 rounded-2xl border border-border/60 bg-card p-0 overflow-hidden shadow-xs"
        >
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
const HANOI_COORDS = { lat: 21.0285, lng: 105.8542 };

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
      (err: { code?: number }) => {
        setIsLocating(false);
        if (err.code === 1) {
          toast({
            title: 'Từ chối quyền vị trí',
            description: 'Bạn đã từ chối chia sẻ vị trí. Hãy chọn quận/huyện thủ công.',
            variant: 'destructive',
          });
        } else if (err.code === 3) {
          toast({
            title: 'Lỗi định vị',
            description: 'Hết thời gian chờ GPS. Vui lòng kiểm tra lại kết nối.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Lỗi định vị',
            description: 'Không thể lấy toạ độ GPS. Vui lòng chọn quận thủ công.',
            variant: 'destructive',
          });
        }
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

  // Khoảng cách tới Hà Nội cho trường hợp EC-04
  const distanceToHanoi = userCoords
    ? calculateHaversineDistanceKm(
        userCoords.lat,
        userCoords.lng,
        HANOI_COORDS.lat,
        HANOI_COORDS.lng,
      )
    : 0;
  const isFarFromHanoi = userCoords !== null && distanceToHanoi > 50;

  // Active filter count
  const activeFiltersCount = [
    q,
    sportTypeParam,
    districtParam,
    priceRange.min !== undefined || priceRange.max !== undefined,
    selectedDate,
    timeSlotRange,
    userCoords !== null,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* ── Topbar Search & Geolocation ── */}
      <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
        <form onSubmit={onSearchSubmit} className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              aria-label="Từ khoá tìm kiếm"
              placeholder="Tìm theo tên sân, địa chỉ, tiện ích..."
              className="h-11 pl-10 rounded-xl bg-background text-sm focus-visible:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Lọc theo thành phố"
              value={effectiveCity ?? ''}
              onChange={(e) =>
                applyFilters({
                  q: draftQ.trim() || undefined,
                  sportType: sportTypeParam,
                  city: e.target.value || undefined,
                  district: undefined,
                })
              }
              className="h-11 rounded-xl border border-input bg-background px-3 text-xs font-medium shadow-xs transition sm:w-36 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">Tất cả thành phố</option>
              {SUPPORTED_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              aria-label="Lọc theo quận huyện"
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
              className="h-11 rounded-xl border border-input bg-background px-3 text-xs font-medium shadow-xs transition disabled:opacity-50 sm:w-40 focus-visible:ring-2 focus-visible:ring-primary"
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
              title={!geoSupported ? 'Trình duyệt không hỗ trợ định vị' : undefined}
              aria-label="Định vị gần tôi"
              className="h-11 rounded-xl font-bold gap-1.5 px-3.5 text-xs shadow-xs"
            >
              {isLocating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Crosshair className="size-4 text-primary" />
              )}
              <span>Gần tôi</span>
            </Button>

            <Button
              type="submit"
              aria-label="Tìm sân"
              className="h-11 rounded-xl px-5 font-bold text-xs gap-1.5 shadow-[0_4px_20px_rgba(15,23,42,0.08)]"
            >
              <Search className="size-4" />
              <span>Tìm sân</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMobileFilter(true)}
              className="h-11 rounded-xl px-3 text-xs font-semibold lg:hidden gap-1.5"
            >
              <SlidersHorizontal className="size-4" />
              <span>Bộ lọc</span>
              {activeFiltersCount > 0 ? (
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {activeFiltersCount}
                </span>
              ) : null}
            </Button>
          </div>
        </form>

        {/* GPS Radius Active Bar */}
        {userCoords !== null ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-semibold text-foreground">Bán kính gần bạn:</span>
              <div className="flex items-center gap-1.5">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadiusKm(r)}
                    aria-pressed={radiusKm === r ? 'true' : 'false'}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      radiusKm === r
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'border border-border/70 bg-muted/50 hover:bg-muted text-muted-foreground'
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
              aria-label="Tắt định vị"
              className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1 px-2"
            >
              <X className="size-3.5" /> Tắt định vị
            </Button>
          </div>
        ) : null}
      </section>

      {/* ── Main Layout: Sidebar + Results Grid ── */}
      <div className="grid gap-6 lg:grid-cols-[270px_1fr]">
        {/* Desktop Filter Sidebar */}
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
            onSportTypeChange={(s) =>
              applyFilters({ q, sportType: s, city: effectiveCity, district: districtParam })
            }
            onCityChange={(c) =>
              applyFilters({ q, sportType: sportTypeParam, city: c, district: undefined })
            }
            onDistrictChange={(d) =>
              applyFilters({ q, sportType: sportTypeParam, city: effectiveCity, district: d })
            }
            onSortChange={(nextSort) => setSort(nextSort)}
            onPriceRangeChange={(range) => setPriceRange(range)}
            onDateChange={(d) => setSelectedDate(d)}
            onTimeSlotRangeChange={(t) => setTimeSlotRange(t)}
            onResetFilters={handleResetAll}
          />
        </div>

        {/* Mobile Filter Sheet Drawer (chỉ render khi mở để tránh duplicate ID) */}
        {showMobileFilter ? (
          <Sheet open={showMobileFilter} onOpenChange={setShowMobileFilter}>
            <SheetContent side="bottom" className="p-4 sm:p-6">
              <SheetHeader className="mb-4 text-left">
                <SheetTitle>Bộ lọc tìm kiếm sân</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 pb-16">
                <FilterSidebar
                  sportType={sportTypeParam}
                  city={effectiveCity}
                  district={districtParam}
                  sort={sort}
                  hasGps={userCoords !== null}
                  priceRange={priceRange}
                  selectedDate={selectedDate}
                  timeSlotRange={timeSlotRange}
                  onSportTypeChange={(s) =>
                    applyFilters({ q, sportType: s, city: effectiveCity, district: districtParam })
                  }
                  onCityChange={(c) =>
                    applyFilters({ q, sportType: sportTypeParam, city: c, district: undefined })
                  }
                  onDistrictChange={(d) =>
                    applyFilters({ q, sportType: sportTypeParam, city: effectiveCity, district: d })
                  }
                  onSortChange={(nextSort) => setSort(nextSort)}
                  onPriceRangeChange={(range) => setPriceRange(range)}
                  onDateChange={(d) => setSelectedDate(d)}
                  onTimeSlotRangeChange={(t) => setTimeSlotRange(t)}
                  onResetFilters={handleResetAll}
                />
              </div>
              <div className="fixed inset-x-0 bottom-0 z-10 flex gap-2 border-t border-border/80 bg-card p-4 shadow-lg">
                <Button variant="outline" onClick={handleResetAll} className="flex-1 rounded-xl text-xs font-bold">
                  Xoá bộ lọc
                </Button>
                <Button
                  onClick={() => setShowMobileFilter(false)}
                  className="flex-1 rounded-xl text-xs font-bold shadow-sm"
                >
                  Xem kết quả ({items.length})
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        ) : null}

        {/* Results Container */}
        <div className="space-y-4">
          {/* Header Bar: Total Count + Active Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
            <div>
              {query.data ? (
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Kết quả ({query.data.total} sân)
                </h2>
              ) : (
                <div className="h-6 w-32 animate-pulse rounded bg-muted" />
              )}
              {sort === 'distance' && userCoords === null ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Bạn chưa bật định vị GPS. Vui lòng bấm "Gần tôi" để tính khoảng cách.
                </p>
              ) : null}
            </div>

            {/* Active filter pills (chỉ hiện khi có kết quả items > 0 để tránh đụng nút Xoá bộ lọc của empty state) */}
            {activeFiltersCount > 0 && items.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {sportTypeParam ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 font-semibold text-accent-foreground">
                    {SPORT_TYPE_LABELS[sportTypeParam as SportType] ?? sportTypeParam}
                    <button
                      type="button"
                      onClick={() =>
                        applyFilters({ q, sportType: undefined, city: effectiveCity, district: districtParam })
                      }
                      className="hover:opacity-75"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ) : null}
                {districtParam ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 font-semibold text-accent-foreground">
                    <MapPin className="size-3" />
                    {districtParam}
                    <button
                      type="button"
                      onClick={() =>
                        applyFilters({ q, sportType: sportTypeParam, city: effectiveCity, district: undefined })
                      }
                      className="hover:opacity-75"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetAll}
                  className="h-6 px-2 text-[11px] font-bold text-muted-foreground hover:text-foreground"
                >
                  Xoá tất cả
                </Button>
              </div>
            ) : null}
          </div>

          {/* Grid or Empty/Loading States */}
          {query.isPending ? (
            <SkeletonGrid />
          ) : query.isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center text-destructive">
              Đã xảy ra lỗi khi tải danh sách sân. Vui lòng thử lại sau.
            </div>
          ) : isFarFromHanoi ? (
            /* EC-04: > 50km from Hanoi */
            <div className="rounded-2xl border border-dashed border-border/80 p-10 text-center space-y-3 bg-card/60">
              <MapPin className="mx-auto size-12 text-primary/60" />
              <h3 className="font-bold text-base">
                Bạn đang ở cách Hà Nội ~{Math.round(distanceToHanoi)} km
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Hiện tại hệ thống SanGo đang phục vụ các cụm sân chất lượng cao tại Hà Nội và TP.HCM.
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  handleClearGps();
                  applyFilters({ city: 'Hà Nội' });
                }}
                className="mt-2 rounded-xl text-xs font-bold"
              >
                Xem tất cả sân Hà Nội
              </Button>
            </div>
          ) : items.length === 0 ? (
            /* EC-05 & Standard Empty State */
            <div className="rounded-2xl border border-dashed border-border/80 p-10 text-center space-y-3 bg-card/60">
              <SearchX className="mx-auto size-12 text-muted-foreground/50" />
              <h3 className="font-bold text-base">
                {userCoords !== null && radiusKm !== undefined
                  ? `Không tìm thấy cụm sân nào trong bán kính ${radiusKm} km quanh bạn`
                  : 'Không tìm thấy sân phù hợp'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Hãy thử nới lỏng bộ lọc khoảng giá, mở rộng bán kính GPS hoặc chọn khu vực lân cận.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {userCoords !== null && radiusKm !== undefined && radiusKm < 20 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const next = radiusKm === 3 ? 5 : radiusKm === 5 ? 10 : 20;
                      setRadiusKm(next);
                    }}
                    className="rounded-xl text-xs font-bold"
                  >
                    Mở rộng bán kính lên {radiusKm === 3 ? 5 : radiusKm === 5 ? 10 : 20} km
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetAll}
                  className="rounded-xl text-xs font-bold"
                >
                  Xoá bộ lọc
                </Button>
                {userCoords !== null ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      handleClearGps();
                      applyFilters({ city: 'Hà Nội' });
                    }}
                    className="rounded-xl text-xs font-bold"
                  >
                    Xem tất cả sân Hà Nội
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
              {items.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {query.data && query.data.pages > 1 ? (
            <div className="flex justify-center items-center gap-2 pt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() =>
                  applyFilters({
                    q,
                    sportType: sportTypeParam,
                    city: effectiveCity,
                    district: districtParam,
                    page: page - 1,
                  })
                }
                className="rounded-xl text-xs font-bold"
              >
                Trang trước
              </Button>
              <span className="flex items-center px-3 font-score text-xs font-bold text-muted-foreground">
                Trang {page} / {query.data.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= query.data.pages}
                onClick={() =>
                  applyFilters({
                    q,
                    sportType: sportTypeParam,
                    city: effectiveCity,
                    district: districtParam,
                    page: page + 1,
                  })
                }
                className="rounded-xl text-xs font-bold"
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
