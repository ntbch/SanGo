import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getVenueDetailApi } from '../api/venues-api';
import { VenueGallery } from '../components/venue-gallery';
import { VenueCourtsList } from '../components/venue-courts-list';
import { VenueTabsInfo } from '../components/venue-tabs-info';
import { VenueBookingSidebar } from '../components/venue-booking-sidebar';
import { Skeleton } from '../../../components/ui/skeleton';
import { Button } from '../../../components/ui/button';

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
