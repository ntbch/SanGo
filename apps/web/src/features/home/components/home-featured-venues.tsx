import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getVenuesListApi } from '../../venues/api/venues-api';
import { VenueCard } from '../../venues/components/venue-card';
import { Skeleton } from '../../../components/ui/skeleton';
import { ArrowRight, Star } from 'lucide-react';
import { SportType } from '../../../lib/constants';

const CURATED_FEATURED_VENUES = [
  {
    id: 'curated-1',
    name: 'Sân Bóng Đá Đại Học Thủy Lợi',
    address: '175 Tây Sơn, Đống Đa, Hà Nội',
    city: 'Hà Nội',
    sportTypes: [SportType.FOOTBALL5],
    minPrice: 350000,
    maxPrice: 650000,
    rating: 4.9,
    totalReviews: 128,
    images: ['/mock-football.svg'],
    isOnlineBooking: true,
  },
  {
    id: 'curated-2',
    name: 'Pickleball Thảo Điền Sport Complex',
    address: '28 Thảo Điền, Quận 2, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    sportTypes: [SportType.PICKLEBALL],
    minPrice: 150000,
    maxPrice: 280000,
    rating: 5.0,
    totalReviews: 94,
    images: ['/mock-pickleball.svg'],
    isOnlineBooking: true,
  },
  {
    id: 'curated-3',
    name: 'Cụm Sân Cầu Lông Cầu Giấy Pro',
    address: '35 Trần Quý Kiên, Cầu Giấy, Hà Nội',
    city: 'Hà Nội',
    sportTypes: [SportType.BADMINTON],
    minPrice: 90000,
    maxPrice: 160000,
    rating: 4.8,
    totalReviews: 76,
    images: ['/mock-badminton.svg'],
    isOnlineBooking: true,
  },
  {
    id: 'curated-4',
    name: 'CLB Tennis Phú Thọ Chuẩn Quốc Tế',
    address: '219 Lý Thường Kiệt, Quận 11, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    sportTypes: [SportType.TENNIS],
    minPrice: 200000,
    maxPrice: 400000,
    rating: 4.9,
    totalReviews: 115,
    images: ['/mock-tennis.svg'],
    isOnlineBooking: true,
  },
];

export function HomeFeaturedVenues(): React.ReactElement {
  const { data, isLoading } = useQuery({
    queryKey: ['featured-venues'],
    queryFn: () => getVenuesListApi({ limit: 4 }),
  });

  const venuesToDisplay = data?.items && data.items.length > 0 ? data.items.slice(0, 4) : CURATED_FEATURED_VENUES;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-500" />
            <span>Đánh Giá Cao Nhất</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground mt-0.5">
            Cụm Sân Tiêu Biểu Được Yêu Thích
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Các cụm sân đạt chuẩn thi đấu với mặt sân cao cấp và đầy đủ tiện ích phòng thay đồ, bãi đỗ xe.
          </p>
        </div>
        <Link to="/venues" className="text-xs font-bold text-primary hover:text-emerald-400 flex items-center gap-1 group transition-colors">
          <span>Xem tất cả sân</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {venuesToDisplay.map((venue: any) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      )}
    </section>
  );
}
