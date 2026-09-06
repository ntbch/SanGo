import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getVenuesListApi, type VenueFilters } from '../api/venues-api';
import { VenueFilterSidebar } from '../components/venue-filter-sidebar';
import { VenueMobileFilterDrawer } from '../components/venue-mobile-filter-drawer';
import { VenueTopSortBar } from '../components/venue-top-sort-bar';
import { VenueResultsView } from '../components/venue-results-view';
import { VenueMapView } from '../components/venue-map-view';

export function VenuesPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [showMap, setShowMap] = React.useState(true);

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <VenueMobileFilterDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        totalCount={data?.total}
      />

      <div className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6">
        <div className="flex items-start gap-6">
          <VenueFilterSidebar filters={filters} onFilterChange={handleFilterChange} />

          <div className="flex-1 min-w-0 space-y-5">
            <VenueTopSortBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
              totalCount={data?.total}
              showMap={showMap}
              onToggleMap={() => setShowMap((prev) => !prev)}
            />

            {/* Split-View Layout: 60% Left List / 40% Right Sticky Map */}
            {showMap ? (
              <div className="lg:flex lg:gap-6 items-start">
                <div className="w-full lg:w-[60%] min-w-0">
                  <VenueResultsView
                    items={data?.items}
                    isLoading={isLoading}
                    isError={isError}
                    page={page}
                    totalPages={data?.totalPages || 1}
                    onPageChange={handlePageChange}
                    onFilterChange={handleFilterChange}
                    onRefetch={refetch}
                  />
                </div>

                <div className="hidden lg:block lg:w-[40%] shrink-0 sticky top-20 h-[calc(100vh-6rem)] rounded-2xl border border-border overflow-hidden bg-card shadow-xs">
                  <VenueMapView
                    venues={data?.items || []}
                    onBoundsChange={() => {}}
                  />
                </div>
              </div>
            ) : (
              <div className="w-full">
                <VenueResultsView
                  items={data?.items}
                  isLoading={isLoading}
                  isError={isError}
                  page={page}
                  totalPages={data?.totalPages || 1}
                  onPageChange={handlePageChange}
                  onFilterChange={handleFilterChange}
                  onRefetch={refetch}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
