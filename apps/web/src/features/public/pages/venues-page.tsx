import {
  Crosshair,
  LayoutGrid,
  Loader2,
  Map as MapIcon,
  MapPin,
  SearchX,
  Search,
  X,
} from 'lucide-react';
import { type FormEvent, type ReactElement, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SUPPORTED_CITIES,
  calculateHaversineDistanceKm,
  districtsOfCity,
} from '@sango/shared';

import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/skeleton';
import { useToast } from '../../../components/ui/use-toast';

import { FilterSidebar, type VenueSort } from '../components/filter-sidebar';
import { InteractiveVenuesMap } from '../components/interactive-venues-map';
import { VenueCard } from '../components/venue-card';
import { useVenues, useVenuesMap } from '../queries';

function SkeletonGrid(): ReactElement {
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      role="status"
      aria-busy="true"
      aria-label="Đang tải danh sách sân"
    >
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <div key={index} className="space-y-3 rounded-xl border p-0">
          <Skeleton className="aspect-[16/10] w-full rounded-b-none" />
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

interface VenuesPageProps {
  /** Tiêu đề hero — trang chủ nhúng lại trang này ở chế độ rút gọn. */
  compact?: boolean;
}

const RADIUS_OPTIONS = [3, 5, 10, 20] as const;

/** Chuỗi container chuẩn Athletic Synergy (đặc tả §3). */
const SHELL_CONTAINER = 'w-full px-4 sm:px-6 lg:px-10';

/** Trang danh sách sân: hero tìm kiếm + lọc quận + GPS Gần tôi + sidebar lọc + lưới kết quả phân trang. */
export function VenuesPage({ compact = false }: VenuesPageProps): ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const q = searchParams.get('q') ?? '';
  const sportTypeParam = searchParams.get('sportType') ?? undefined;
  const districtParam = searchParams.get('district') ?? undefined;
  const cityParam = searchParams.get('city') ?? undefined;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  /** Link cũ chỉ có ?district=: suy ra thành phố (so khớp bỏ qua hoa/thường). */
  const effectiveCity =
    cityParam ??
    SUPPORTED_CITIES.find((supported) => {
      if (districtParam === undefined) return false;
      return districtsOfCity(supported).some(
        (d) => d.toLowerCase() === districtParam.toLowerCase(),
      );
    });
  /** Nhãn vị trí gộp để hiển thị: "Cầu Giấy, Hà Nội" / "TP. Hồ Chí Minh". */
  const locationLabel = districtParam
    ? `${districtParam}${effectiveCity ? `, ${effectiveCity}` : ''}`
    : effectiveCity;

  const [sort, setSort] = useState<VenueSort>('newest');
  const [draftQ, setDraftQ] = useState(q);

  // F5 Map: Chế độ xem 'split' (chia đôi danh sách + bản đồ), 'list' (chỉ danh sách), 'map' (chỉ bản đồ)
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [mapBbox, setMapBbox] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | undefined>(undefined);
  const [hoveredVenueId, setHoveredVenueId] = useState<string | undefined>(undefined);

  // EC-02: trình duyệt không hỗ trợ Geolocation -> khoá nút GPS kèm tooltip.
  const geoSupported = typeof navigator !== 'undefined' && Boolean(navigator.geolocation);

  // GPS state
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
  const data = query.data;

  // F5 Map: Gọi API /venues/map khi bbox thay đổi (di chuyển/zoom)
  const mapQuery = useVenuesMap(
    mapBbox
      ? {
          bbox: mapBbox,
          sportType: sportTypeParam,
          q: q === '' ? undefined : q,
          limit: 60,
        }
      : null,
  );

  let items = [...(data?.items ?? [])].map((venue) => {
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

  if (userCoords !== null && radiusKm !== undefined) {
    items = items.filter((venue) => venue.distanceKm !== undefined && venue.distanceKm <= radiusKm);
  }

  // EC-04: người dùng ở quá xa Hà Nội (> 50 km đường chim bay từ Hoàn Kiếm).
  const distanceToHanoiCenter =
    userCoords !== null
      ? calculateHaversineDistanceKm(userCoords.lat, userCoords.lng, 21.0285, 105.8542)
      : null;
  const isFarFromHanoi = distanceToHanoiCenter !== null && distanceToHanoiCenter > 50;

  items.sort((a, b) => {
    if (sort === 'distance') {
      return (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999);
    }
    const priceOf = (v: typeof a) =>
      Math.min(...v.courts.map((c) => c.defaultPricePerSlot), Number.MAX_SAFE_INTEGER);
    if (sort === 'price-asc') return priceOf(a) - priceOf(b);
    if (sort === 'price-desc') return priceOf(b) - priceOf(a);
    return 0; // newest: giữ thứ tự server
  });

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
    // Đổi thành phố -> luôn xoá quận cũ vì quận thuộc thành phố mới có thể không còn hợp lệ
    if (next.city) params.set('city', next.city);
    else if ('city' in next) params.delete('city');
    if (next.district) params.set('district', next.district);
    params.set('page', String(next.page ?? 1));
    setSearchParams(params);
  }

  function handleGetLocation(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
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
        setRadiusKm(5); // Mặc định 5 km theo spec AC-02.2
        setSort('distance');
        toast({
          title: 'Đã xác định vị trí',
          description: 'Đang hiển thị các cụm sân trong bán kính 5 km quanh bạn.',
        });
      },
      (error) => {
        setIsLocating(false);
        if (error.code === 1) {
          // PERMISSION_DENIED (EC-01)
          toast({
            title: 'Từ chối quyền vị trí',
            description:
              'Không thể lấy vị trí do bạn đã từ chối quyền. Vui lòng chọn quận thủ công từ danh sách.',
            variant: 'destructive',
          });
        } else {
          // TIMEOUT / POSITION_UNAVAILABLE (EC-03)
          toast({
            title: 'Lỗi định vị',
            description: 'Không thể xác định vị trí hiện tại. Vui lòng thử lại hoặc chọn quận.',
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
    if (sort === 'distance') {
      setSort('newest');
    }
  }

  function onHeroSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    applyFilters({
      q: draftQ.trim() || undefined,
      sportType: sportTypeParam,
      city: effectiveCity,
      district: districtParam,
    });
  }

  return (
    <div className={compact ? 'space-y-6' : `${SHELL_CONTAINER} space-y-6 py-8`}>
      {!compact ? (
        <section className="relative isolate overflow-hidden rounded-xl bg-navy p-6 text-white sm:p-10">
          {/* Nền nhiều lớp copy pattern hero golden home-page: quầng turf + oxygen, vệt chéo */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(40rem 20rem at 12% -20%, rgba(46,204,113,0.25), transparent 60%),' +
                'radial-gradient(30rem 16rem at 95% -10%, rgba(56,189,248,0.18), transparent 55%),' +
                'linear-gradient(115deg, rgba(255,255,255,0.05) 0%, transparent 35%), #131b2e',
            }}
          />
          <div
            aria-hidden
            className="absolute inset-y-0 right-[-10%] -z-10 hidden w-1/3 rotate-12 bg-[repeating-linear-gradient(115deg,rgba(46,204,113,0.07)_0px,rgba(46,204,113,0.07)_14px,transparent_14px,transparent_36px)] lg:block"
          />
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Tìm sân thể thao gần bạn
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            Khám phá cụm sân tại Hà Nội &amp; TP. Hồ Chí Minh với điều hướng Google Maps và định vị
            thông minh.
          </p>

          <form
            onSubmit={onHeroSubmit}
            className="mt-5 flex flex-col gap-3 rounded-xl bg-card p-4 text-left shadow-[0_12px_40px_rgba(2,8,20,0.45)] sm:flex-row sm:items-center"
          >
            <Input
              value={draftQ}
              onChange={(event) => setDraftQ(event.target.value)}
              placeholder="Tên sân, khu vực hoặc môn chơi..."
              aria-label="Từ khoá tìm kiếm"
              className="h-12 border-input bg-background text-foreground sm:flex-1"
            />

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <select
                id="hero-city-select"
                aria-label="Chọn thành phố"
                value={effectiveCity ?? ''}
                onChange={(event) =>
                  applyFilters({
                    q: draftQ.trim() || undefined,
                    sportType: sportTypeParam,
                    city: event.target.value ? event.target.value : undefined,
                    // Đổi thành phố -> xoá quận cũ
                    district: undefined,
                  })
                }
                className="h-12 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-40"
              >
                <option value="">Tất cả thành phố</option>
                {SUPPORTED_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>

              <select
                id="hero-district-select"
                aria-label="Chọn nhanh quận"
                value={districtParam ?? ''}
                disabled={!effectiveCity}
                onChange={(event) =>
                  applyFilters({
                    q: draftQ.trim() || undefined,
                    sportType: sportTypeParam,
                    city: effectiveCity,
                    district: event.target.value ? event.target.value : undefined,
                  })
                }
                className="h-12 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 sm:w-44"
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
                  <option value="">Chọn thành phố trước</option>
                )}
              </select>
            </div>

            <Button type="submit" size="lg" className="rounded-lg font-bold sm:w-auto">
              Tìm sân
              <Search className="size-4" aria-hidden />
            </Button>

            <Button
              type="button"
              variant={userCoords !== null ? 'default' : 'outline'}
              onClick={handleGetLocation}
              disabled={isLocating || !geoSupported}
              title={
                geoSupported
                  ? undefined
                  : 'Trình duyệt của bạn không hỗ trợ định vị GPS. Vui lòng chọn quận từ danh sách.'
              }
              className="font-bold sm:w-auto"
              aria-label="Định vị gần tôi"
            >
              {isLocating ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Crosshair className="size-4" aria-hidden />
              )}
              {userCoords !== null ? 'Đang bật GPS' : 'Gần tôi'}
            </Button>
          </form>
        </section>
      ) : null}

      {/* Dải chọn bán kính khi bật GPS */}
      {userCoords !== null ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent bg-accent/50 p-3">
          <div
            role="group"
            aria-label="Bán kính tìm kiếm gần bạn"
            className="flex flex-wrap items-center gap-2"
          >
            <span className="flex items-center gap-1 text-xs font-semibold text-accent-foreground">
              <MapPin className="size-3.5" aria-hidden /> Bán kính gần bạn:
            </span>
            {RADIUS_OPTIONS.map((r) => (
              <Button
                key={r}
                type="button"
                size="sm"
                variant={radiusKm === r ? 'default' : 'outline'}
                className="h-7 rounded-full px-3 text-xs"
                aria-pressed={radiusKm === r}
                onClick={() => setRadiusKm(r)}
              >
                {r} km
              </Button>
            ))}
            <Button
              type="button"
              size="sm"
              variant={radiusKm === undefined ? 'default' : 'outline'}
              className="h-7 rounded-full px-3 text-xs"
              aria-pressed={radiusKm === undefined}
              onClick={() => setRadiusKm(undefined)}
            >
              Tất cả
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearGps}
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="size-3.5" aria-hidden /> Tắt định vị
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-56 lg:shrink-0">
          <FilterSidebar
            sportType={sportTypeParam}
            city={effectiveCity}
            district={districtParam}
            sort={sort}
            hasGps={userCoords !== null}
            onSportTypeChange={(value) =>
              applyFilters({ q, sportType: value, city: cityParam, district: districtParam })
            }
            onCityChange={(value) =>
              // Đổi thành phố -> luôn reset quận về "tất cả"
              applyFilters({ q, sportType: sportTypeParam, city: value, district: undefined })
            }
            onDistrictChange={(value) =>
              applyFilters({ q, sportType: sportTypeParam, city: cityParam, district: value })
            }
            onSortChange={setSort}
          />
        </div>

        <section className="min-w-0 flex-1 space-y-4">
          {sort === 'distance' && userCoords === null && data !== undefined ? (
            <p className="rounded-lg border border-dashed border-accent bg-accent/40 p-2 text-xs text-muted-foreground">
              Bạn đang chọn sắp xếp “Gần nhất trước” nhưng chưa bật định vị. Nhấn “Gần tôi” để sắp
              xếp theo khoảng cách thực tế.
            </p>
          ) : null}
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">
              Kết quả{data !== undefined ? ` (${data.total} sân)` : ''}
              {locationLabel ? (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  tại {locationLabel}
                </span>
              ) : null}
            </h2>

            {/* F5 Map: Nút chuyển chế độ xem (Danh sách, Bản đồ, Chia đôi) */}
            <div
              className="flex items-center gap-1 rounded-lg border bg-card p-1 shadow-xs"
              role="group"
              aria-label="Chế độ xem"
            >
              <Button
                type="button"
                size="sm"
                variant={viewMode === 'split' ? 'default' : 'ghost'}
                className="h-8 gap-1.5 px-3 text-xs font-semibold hidden md:flex"
                onClick={() => setViewMode('split')}
                aria-pressed={viewMode === 'split'}
              >
                <LayoutGrid className="size-3.5" />
                <MapIcon className="size-3.5" />
                Chia đôi
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                className="h-8 gap-1.5 px-3 text-xs font-semibold"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
              >
                <LayoutGrid className="size-3.5" />
                Danh sách
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                className="h-8 gap-1.5 px-3 text-xs font-semibold"
                onClick={() => setViewMode('map')}
                aria-pressed={viewMode === 'map'}
              >
                <MapIcon className="size-3.5" />
                Bản đồ
              </Button>
            </div>
          </header>

          {query.isPending ? <SkeletonGrid /> : null}
          {query.isError ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
            >
              Không tải được danh sách sân. Vui lòng thử lại.
            </p>
          ) : null}

          {/* Nội dung kết quả theo viewMode */}
          <div className="space-y-6">
            {/* Chế độ BẢN ĐỒ TOÀN MÀN HÌNH */}
            {viewMode === 'map' ? (
              <div className="h-[650px] w-full">
                <InteractiveVenuesMap
                  items={mapQuery.data?.items ?? []}
                  selectedVenueId={selectedVenueId}
                  hoveredVenueId={hoveredVenueId}
                  onBoundsChange={setMapBbox}
                  onSelectVenue={(v) => setSelectedVenueId(v.id)}
                  className="size-full h-[650px]"
                />
              </div>
            ) : viewMode === 'split' ? (
              /* Chế độ CHIA ĐÔI: Danh sách cuộn bên trái, Bản đồ ghim bên phải */
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-6 xl:col-span-7">
                  {data !== undefined && items.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
                      <SearchX className="size-10 text-muted-foreground/60" aria-hidden />
                      <div>
                        <p className="font-medium">
                          {isFarFromHanoi && distanceToHanoiCenter !== null
                            ? `Bạn đang ở cách Hà Nội ~${distanceToHanoiCenter} km`
                            : userCoords !== null && radiusKm !== undefined
                              ? `Không tìm thấy cụm sân nào trong bán kính ${radiusKm} km quanh bạn`
                              : locationLabel
                                ? `Không tìm thấy cụm sân nào tại ${locationLabel}`
                                : 'Không tìm thấy sân phù hợp'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {isFarFromHanoi
                            ? 'Vị trí của bạn nằm ngoài vùng phủ Hà Nội. Bạn vẫn có thể xem toàn bộ cụm sân tại Hà Nội.'
                            : userCoords !== null && radiusKm !== undefined
                              ? 'Bạn có thể mở rộng bán kính tìm kiếm hoặc xem tất cả cụm sân tại Hà Nội.'
                              : 'Thử bỏ bớt bộ lọc hoặc đổi từ khoá khác.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {userCoords !== null && radiusKm !== undefined && radiusKm < 20 ? (
                          <Button size="sm" onClick={() => setRadiusKm(radiusKm < 10 ? 10 : 20)}>
                            Mở rộng bán kính lên {radiusKm < 10 ? '10' : '20'} km
                          </Button>
                        ) : null}
                        {userCoords !== null ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRadiusKm(undefined)}
                          >
                            Xem tất cả sân Hà Nội
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDraftQ('');
                            setUserCoords(null);
                            setRadiusKm(undefined);
                            applyFilters({});
                          }}
                        >
                          Xoá bộ lọc
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {items.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {items.map((venue) => (
                          <div
                            key={venue.id}
                            onMouseEnter={() => setHoveredVenueId(venue.id)}
                            onMouseLeave={() => setHoveredVenueId(undefined)}
                            className={
                              selectedVenueId === venue.id ? 'ring-2 ring-primary rounded-xl' : ''
                            }
                          >
                            <VenueCard venue={venue} />
                          </div>
                        ))}
                      </div>
                      {data !== undefined && data.pages > 1 ? (
                        <nav
                          className="flex items-center justify-center gap-3 pt-2"
                          aria-label="Phân trang"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() =>
                              applyFilters({
                                q,
                                sportType: sportTypeParam,
                                city: cityParam,
                                district: districtParam,
                                page: page - 1,
                              })
                            }
                          >
                            Trang trước
                          </Button>
                          <span className="font-score text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Trang {data.page}/{data.pages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={data !== undefined && page >= data.pages}
                            onClick={() =>
                              applyFilters({
                                q,
                                sportType: sportTypeParam,
                                city: cityParam,
                                district: districtParam,
                                page: page + 1,
                              })
                            }
                          >
                            Trang sau
                          </Button>
                        </nav>
                      ) : null}
                    </>
                  ) : null}
                </div>

                {/* Bản đồ bên phải sticky */}
                <div className="hidden lg:block lg:col-span-6 xl:col-span-5">
                  <div className="sticky top-24 h-[calc(100vh-8rem)] min-h-[500px]">
                    <InteractiveVenuesMap
                      items={mapQuery.data?.items ?? []}
                      selectedVenueId={selectedVenueId}
                      hoveredVenueId={hoveredVenueId}
                      onBoundsChange={setMapBbox}
                      onSelectVenue={(v) => setSelectedVenueId(v.id)}
                      className="size-full"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Chế độ CHỈ DANH SÁCH (Grid đầy đủ) */
              <>
                {data !== undefined && items.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
                    <SearchX className="size-10 text-muted-foreground/60" aria-hidden />
                    <div>
                      <p className="font-medium">
                        {isFarFromHanoi && distanceToHanoiCenter !== null
                          ? `Bạn đang ở cách Hà Nội ~${distanceToHanoiCenter} km`
                          : userCoords !== null && radiusKm !== undefined
                            ? `Không tìm thấy cụm sân nào trong bán kính ${radiusKm} km quanh bạn`
                            : locationLabel
                              ? `Không tìm thấy cụm sân nào tại ${locationLabel}`
                              : 'Không tìm thấy sân phù hợp'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isFarFromHanoi
                          ? 'Vị trí của bạn nằm ngoài vùng phủ Hà Nội. Bạn vẫn có thể xem toàn bộ cụm sân tại Hà Nội.'
                          : userCoords !== null && radiusKm !== undefined
                            ? 'Bạn có thể mở rộng bán kính tìm kiếm hoặc xem tất cả cụm sân tại Hà Nội.'
                            : 'Thử bỏ bớt bộ lọc hoặc đổi từ khoá khác.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {userCoords !== null && radiusKm !== undefined && radiusKm < 20 ? (
                        <Button size="sm" onClick={() => setRadiusKm(radiusKm < 10 ? 10 : 20)}>
                          Mở rộng bán kính lên {radiusKm < 10 ? '10' : '20'} km
                        </Button>
                      ) : null}
                      {userCoords !== null ? (
                        <Button variant="outline" size="sm" onClick={() => setRadiusKm(undefined)}>
                          Xem tất cả sân Hà Nội
                        </Button>
                      ) : null}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDraftQ('');
                          setUserCoords(null);
                          setRadiusKm(undefined);
                          applyFilters({});
                        }}
                      >
                        Xoá bộ lọc
                      </Button>
                    </div>
                  </div>
                ) : null}

                {items.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                      {items.map((venue) => (
                        <VenueCard key={venue.id} venue={venue} />
                      ))}
                    </div>
                    {data !== undefined && data.pages > 1 ? (
                      <nav
                        className="flex items-center justify-center gap-3 pt-2"
                        aria-label="Phân trang"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() =>
                            applyFilters({
                              q,
                              sportType: sportTypeParam,
                              city: cityParam,
                              district: districtParam,
                              page: page - 1,
                            })
                          }
                        >
                          Trang trước
                        </Button>
                        <span className="font-score text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Trang {data.page}/{data.pages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={data !== undefined && page >= data.pages}
                          onClick={() =>
                            applyFilters({
                              q,
                              sportType: sportTypeParam,
                              city: cityParam,
                              district: districtParam,
                              page: page + 1,
                            })
                          }
                        >
                          Trang sau
                        </Button>
                      </nav>
                    ) : null}
                  </>
                ) : null}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
