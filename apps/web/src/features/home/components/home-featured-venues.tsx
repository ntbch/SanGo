import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getVenuesListApi } from '../../venues/api/venues-api';
import { VenueCard } from '../../venues/components/venue-card';
import { Skeleton } from '../../../components/ui/skeleton';
import { ArrowRight, Star } from 'lucide-react';

export function HomeFeaturedVenues(): React.ReactElement {
  const { data, isLoading } = useQuery({
    queryKey: ['featured-venues'],
    queryFn: () => getVenuesListApi({ limit: 4 }),
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-500" />
            <span>Đánh Giá Cao Nhất</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Cụm Sân Tiêu Biểu Được Yêu Thích
          </h2>
        </div>
        <Link to="/venues" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
          <span>Xem tất cả</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/80 bg-card overflow-hidden">
              <Skeleton className="aspect-[16/9] w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="pt-2 flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : data?.items && data.items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.items.slice(0, 4).map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
