import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getVenuesListApi } from '../../venues/api/venues-api';
import { VenueCard } from '../../venues/components/venue-card';
import { VenueCardSkeleton, EmptyState } from '../../../components/feedback';
import { ArrowRight } from 'lucide-react';

export function HomeFeaturedVenues(): React.ReactElement {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['featured-venues'],
    queryFn: () => getVenuesListApi({ limit: 4 }),
  });

  const venuesToDisplay = data?.items && data.items.length > 0 ? data.items.slice(0, 4) : [];

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Cụm sân tiêu biểu được yêu thích
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Các cụm sân đạt tiêu chuẩn thi đấu với mặt sân chất lượng và đầy đủ tiện ích.
          </p>
        </div>
        <Link
          to="/venues"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-foreground hover:text-primary transition-all duration-150 active:scale-[0.98] group shrink-0"
        >
          <span>Xem tất cả 250+ sân</span>
          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <VenueCardSkeleton key={i} />
          ))}
        </div>
      ) : venuesToDisplay.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {venuesToDisplay.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có cụm sân nào được giới thiệu"
          description="Hệ thống đang đồng bộ dữ liệu sân thi đấu. Duyệt danh sách sân hoặc đăng ký tạo cụm sân mới."
          actionLabel="Duyệt tất cả sân"
          onAction={() => navigate('/venues')}
        />
      )}
    </section>
  );
}
