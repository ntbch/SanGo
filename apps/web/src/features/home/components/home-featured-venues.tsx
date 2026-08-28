import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getVenuesListApi } from '../../venues/api/venues-api';
import { VenueCard } from '../../venues/components/venue-card';
import { Skeleton } from '../../../components/ui/skeleton';
import { ArrowRight, Star, MapPin } from 'lucide-react';

export function HomeFeaturedVenues(): React.ReactElement {
  const { data, isLoading } = useQuery({
    queryKey: ['featured-venues'],
    queryFn: () => getVenuesListApi({ limit: 4 }),
  });

  const venuesToDisplay = data?.items && data.items.length > 0 ? data.items.slice(0, 4) : [];

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
      ) : venuesToDisplay.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {venuesToDisplay.map((venue: any) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card/40">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <MapPin className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Đang tải và cập nhật cụm sân thể thao</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Hệ thống đang đồng bộ dữ liệu sân thi đấu. Bạn có thể duyệt danh sách sân hoặc chủ sân có thể đăng ký tạo cụm sân mới.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              to="/venues"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Duyệt tất cả sân
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
