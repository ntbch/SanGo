import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getVenueDetailApi } from '../../venues/api/venues-api';
import { VenueBookingSection } from '../../venues/components/venue-booking-section';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { MapPin } from 'lucide-react';

export function BookingCalendarPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();

  const { data: venue, isLoading: venueLoading } = useQuery({
    queryKey: ['venue-detail', slug],
    queryFn: () => getVenueDetailApi(slug || ''),
    enabled: Boolean(slug),
  });

  if (venueLoading) {
    return (
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="w-full px-4 py-16 text-center space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Không tìm thấy cụm sân.</p>
        <Link to="/venues">
          <Button size="sm" variant="outline">Quay lại</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 space-y-8 pb-32">
      {/* Top Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to={`/venues/${venue.slug || venue.id}`} className="hover:text-primary transition-colors">
            {venue.name}
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold">Chọn Lịch Đặt Sân</span>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>{venue.address}, {venue.district}, {venue.city}</span>
        </p>
      </div>

      {/* Reusable Clean Venue Booking Section */}
      <VenueBookingSection venue={venue} showHeader={true} />
    </div>
  );
}
