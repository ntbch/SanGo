import React from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getVenuesListApi,
  getVenuesMapApi,
  getVenueDetailApi,
  VenueFilters,
} from '../api/venues-api';
import { VenueCard } from '../components/venue-card';
import { VenueFilterSidebar } from '../components/venue-filter-sidebar';
import { VenueMobileFilterDrawer } from '../components/venue-mobile-filter-drawer';
import { VenueTopSortBar } from '../components/venue-top-sort-bar';
import { VenueMapView } from '../components/venue-map-view';
import { VenueGallery } from '../components/venue-gallery';
import { VenueCourtsList } from '../components/venue-courts-list';
import { VenueTabsInfo } from '../components/venue-tabs-info';
import { VenueBookingSidebar } from '../components/venue-booking-sidebar';
import { Skeleton } from '../../../components/ui/skeleton';
import { Button } from '../../../components/ui/button';
import {
  Compass,
  MapPin,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function VenuesPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);

  // Đọc filters từ URL search params
  const filters: VenueFilters = {
    sportType: searchParams.get('sportType') || undefined,
    city: searchParams.get('city') || 'Hà Nội',
    district: searchParams.get('district') || undefined,
    q: searchParams.get('q') || undefined,
    sortBy: (searchParams.get('sortBy') as any) || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
    amenities: searchParams.get('amenities') ? searchParams.get('amenities')!.split(',') : undefined,
    timeOfDay: (searchParams.get('timeOfDay') as any) || undefined,
    radiusKm: searchParams.get('radiusKm') ? Number(searchParams.get('radiusKm')) : undefined,
    userLat: searchParams.get('userLat') ? Number(searchParams.get('userLat')) : undefined,
    userLng: searchParams.get('userLng') ? Number(searchParams.get('userLng')) : undefined,
  };

  const page = Number(searchParams.get('page')) || 1;
  const limit = 12;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['venues', filters, page],
    queryFn: () => getVenuesListApi({ ...filters, page, limit }),
  });

  const handleFilterChange = (newFilters: VenueFilters) => {
    const params = new URLSearchParams();
    if (newFilters.sportType) params.set('sportType', newFilters.sportType);
    if (newFilters.city) params.set('city', newFilters.city);
    if (newFilters.district) params.set('district', newFilters.district);
    if (newFilters.q) params.set('q', newFilters.q);
    if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy);
    if (newFilters.minPrice !== undefined) params.set('minPrice', String(newFilters.minPrice));
    if (newFilters.maxPrice !== undefined) params.set('maxPrice', String(newFilters.maxPrice));
    if (newFilters.minRating !== undefined) params.set('minRating', String(newFilters.minRating));
    if (newFilters.amenities && newFilters.amenities.length > 0) {
      params.set('amenities', newFilters.amenities.join(','));
    }
    if (newFilters.timeOfDay) params.set('timeOfDay', newFilters.timeOfDay);
    if (newFilters.radiusKm) params.set('radiusKm', String(newFilters.radiusKm));
    if (newFilters.userLat) params.set('userLat', String(newFilters.userLat));
    if (newFilters.userLng) params.set('userLng', String(newFilters.userLng));
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = data?.totalPages || 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Drawer */}
      <VenueMobileFilterDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        totalCount={data?.total}
      />

      {/* Main Dual-Layout Container */}
      <div className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6">
        <div className="flex items-start gap-6">
          {/* Left Column: Desktop Filter Sidebar (280px) */}
          <VenueFilterSidebar filters={filters} onFilterChange={handleFilterChange} />

          {/* Right Column: Main Content Area */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Top Sort & Search Bar */}
            <VenueTopSortBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
              totalCount={data?.total}
            />

            {/* Loading State: Shimmer Skeleton */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-border/80 bg-card p-0 overflow-hidden space-y-3"
                  >
                    <Skeleton className="aspect-[16/9] w-full rounded-none" />
                    <div className="p-4 space-y-2.5">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <div className="flex gap-1 pt-1">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="pt-3 border-t border-border/50 flex justify-between items-center">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-8 w-20 rounded-xl" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="py-16 text-center space-y-3">
                <p className="text-sm font-semibold text-destructive">
                  Không thể kết nối đến máy chủ cụm sân
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Thử lại
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && (!data?.items || data.items.length === 0) && (
              <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                  <Compass className="h-6 w-6" />
                </div>
                <h2 className="text-base font-bold text-foreground">Không tìm thấy sân phù hợp</h2>
                <p className="text-xs text-muted-foreground">
                  Thử tìm kiếm với từ khóa khác hoặc nới lỏng các điều kiện lọc.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange({ city: 'Hà Nội' })}
                  className="gap-1.5 font-semibold text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Đặt lại bộ lọc</span>
                </Button>
              </div>
            )}

            {/* Results Grid */}
            {!isLoading && !isError && data?.items && data.items.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {data.items.map((venue) => (
                    <VenueCard key={venue.id} venue={venue} />
                  ))}
                </div>

                {/* Pagination Bar */}
                {totalPages > 1 && (
                  <div className="pt-6 border-t border-border/60 flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => handlePageChange(page - 1)}
                      className="gap-1 text-xs"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Trang trước</span>
                    </Button>

                    <span className="text-xs font-semibold text-muted-foreground font-mono-num">
                      Trang {page} / {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => handlePageChange(page + 1)}
                      className="gap-1 text-xs"
                    >
                      <span>Trang sau</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MapPage(): React.ReactElement {
  const [bbox, setBbox] = React.useState<string>('20.95,105.75,21.10,105.95'); // Mặc định Hà Nội
  const [sportType, setSportType] = React.useState<string>('');
  const [search, setSearch] = React.useState<string>('');

  const { data } = useQuery({
    queryKey: ['venues-map', bbox, sportType, search],
    queryFn: () => getVenuesMapApi({ bbox, sportType: sportType || undefined, q: search || undefined }),
    enabled: Boolean(bbox),
  });

  const handleBoundsChange = React.useCallback((newBbox: string) => {
    setBbox((prev) => (prev === newBbox ? prev : newBbox));
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] w-full relative flex flex-col">
      {/* Top Map Action Strip */}
      <div className="z-20 bg-card/90 backdrop-blur-md border-b border-border/80 px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-bold text-foreground">Bản Đồ Cụm Sân</h1>
          <span className="text-xs font-mono-num text-muted-foreground">
            ({data?.items?.length || 0} sân hiển thị)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sportType}
            onChange={(e) => setSportType(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background/80 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Tất cả môn</option>
            <option value="FOOTBALL5">Bóng đá</option>
            <option value="PICKLEBALL">Pickleball</option>
            <option value="BADMINTON">Cầu lông</option>
            <option value="TENNIS">Tennis</option>
          </select>

          <input
            type="text"
            placeholder="Tìm tên sân..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-36 sm:w-48 rounded-lg border border-input bg-background/80 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Map Canvas Component */}
      <div className="flex-1 w-full relative">
        <VenueMapView
          venues={data?.items || []}
          onBoundsChange={handleBoundsChange}
        />
      </div>
    </div>
  );
}

export function VenueDetailPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();

  const { data: venue, isLoading, isError } = useQuery({
    queryKey: ['venue-detail', slug],
    queryFn: () => getVenueDetailApi(slug || ''),
    enabled: Boolean(slug),
  });

  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 space-y-6">
        <Skeleton className="h-72 sm:h-96 w-full rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !venue) {
    return (
      <div className="w-full px-4 py-16 text-center space-y-4 max-w-md mx-auto">
        <h2 className="text-lg font-bold text-foreground">Không tìm thấy cụm sân</h2>
        <p className="text-xs text-muted-foreground">
          Cụm sân này có thể chưa được kích hoạt hoặc đường dẫn không chính xác.
        </p>
        <Link to="/venues">
          <Button size="sm" variant="outline">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 space-y-8">
      {/* 1. Header & Multi-Image Interactive Gallery */}
      <VenueGallery venue={venue} />

      {/* 2. Main Content & Sticky Booking Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns: Courts Matrix & 4 Tabs Info */}
        <div className="lg:col-span-2 space-y-8 min-w-0">
          {/* Danh sách sân con với bộ lọc môn */}
          <VenueCourtsList
            courts={venue.courts}
            venueSlugOrId={venue.slug || venue.id}
          />

          {/* 4 Tabs: Tổng quan, Tiện ích, Đánh giá API, Vị trí */}
          <VenueTabsInfo venue={venue} />
        </div>

        {/* Right 1 Column: Sticky Booking & Deposit Sidebar */}
        <div className="lg:col-span-1">
          <VenueBookingSidebar venue={venue} />
        </div>
      </div>
    </div>
  );
}
