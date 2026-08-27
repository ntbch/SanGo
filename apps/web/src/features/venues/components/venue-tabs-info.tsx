import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { VenueItem, getVenueReviewsApi } from '../api/venues-api';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import {
  Info,
  Sparkles,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  MessageSquare,
} from 'lucide-react';
import { cn, formatMinutesToTime } from '../../../lib/utils';

export interface VenueTabsInfoProps {
  venue: VenueItem;
}

export function VenueTabsInfo({ venue }: VenueTabsInfoProps): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'amenities' | 'reviews' | 'location'>('overview');

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['venue-reviews', venue.slug || venue.id],
    queryFn: () => getVenueReviewsApi(venue.slug || venue.id),
    enabled: activeTab === 'reviews',
  });

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${venue.name} ${venue.address} ${venue.district} ${venue.city}`,
    )}`;
    window.open(url, '_blank');
  };

  const tabs = [
    { id: 'overview', label: 'Tổng quan & Bảng giá', icon: Info },
    { id: 'amenities', label: 'Tiện ích cụm sân', icon: Sparkles },
    { id: 'reviews', label: `Đánh giá (${venue.reviewsCount ?? 24})`, icon: Star },
    { id: 'location', label: 'Vị trí & Đường đi', icon: MapPin },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Tab Navigation Strip */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70',
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Pricing Scheme */}
      {activeTab === 'overview' && (
        <Card className="p-5 space-y-4 border border-border/80 bg-card animate-in fade-in duration-150">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground">Giới thiệu cụm sân</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {venue.name} là cụm sân thể thao tiêu chuẩn đặt tại {venue.district}, {venue.city}. Sân được trang bị hệ thống mặt sân chất lượng cao, đèn chiếu sáng chống chói ban đêm và khu vực nghỉ ngơi tiện nghi cho vận động viên.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/40 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>Khung Giờ Hoạt Động</span>
              </div>
              <p className="text-xs text-muted-foreground font-mono-num">
                {formatMinutesToTime(venue.openMinute ?? 360)} - {formatMinutesToTime(venue.closeMinute ?? 1380)} hàng ngày
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/40 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                <span>Quy Định Giữ Chỗ & Cọc</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Khóa slot 10 phút chống trùng lịch. Yêu cầu đặt cọc <strong>{venue.depositPercent}%</strong> giá trị đơn.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 2: Amenities */}
      {activeTab === 'amenities' && (
        <Card className="p-5 space-y-4 border border-border/80 bg-card animate-in fade-in duration-150">
          <div>
            <h3 className="text-sm font-bold text-foreground">Tiện ích & Dịch vụ hỗ trợ</h3>
            <p className="text-xs text-muted-foreground">Các tiện ích sẵn có tại cụm sân phục vụ người chơi</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {(venue.amenities && venue.amenities.length > 0
              ? venue.amenities
              : ['Bãi đỗ xe máy', 'Bãi đỗ ô tô', 'Wifi miễn phí', 'Căng tin & Đồ uống', 'Phòng thay đồ', 'Đèn LED chiếu sáng']
            ).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/60 border border-border/50 text-xs font-semibold text-foreground"
              >
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 3: Reviews */}
      {activeTab === 'reviews' && (
        <Card className="p-5 space-y-4 border border-border/80 bg-card animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Đánh giá từ người chơi</h3>
              <p className="text-xs text-muted-foreground">Phản hồi thực tế từ các đơn đặt sân đã hoàn thành</p>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-500 font-bold text-xs border border-amber-500/20 font-mono-num">
              <Star className="h-4 w-4 fill-amber-500" />
              <span>{reviewsData?.avgRating ?? venue.avgRating ?? '5.0'} / 5.0</span>
            </div>
          </div>

          {reviewsLoading ? (
            <div className="space-y-2 py-4 text-center text-xs text-muted-foreground">
              Đang tải đánh giá...
            </div>
          ) : reviewsData?.items && reviewsData.items.length > 0 ? (
            <div className="space-y-3 divide-y divide-border/60">
              {reviewsData.items.map((rev) => (
                <div key={rev.id} className="pt-3 first:pt-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      {rev.customer?.fullName || 'Người chơi SanGo'}
                    </span>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{rev.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 py-6 text-center text-xs text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p>Chưa có đánh giá nào cho sân này. Hãy là người đầu tiên trải nghiệm và chia sẻ!</p>
            </div>
          )}
        </Card>
      )}

      {/* Tab 4: Location */}
      {activeTab === 'location' && (
        <Card className="p-5 space-y-4 border border-border/80 bg-card animate-in fade-in duration-150">
          <div>
            <h3 className="text-sm font-bold text-foreground">Vị trí & Chỉ đường</h3>
            <p className="text-xs text-muted-foreground">
              {venue.address}, {venue.district}, {venue.city}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/40 border border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">Tọa độ GPS</p>
              <p className="text-xs text-muted-foreground font-mono-num">
                Vĩ độ: {venue.lat.toFixed(4)} | Kinh độ: {venue.lng.toFixed(4)}
              </p>
            </div>

            <Button size="sm" onClick={openGoogleMaps} className="gap-2 text-xs font-bold shadow-xs">
              <Navigation className="h-3.5 w-3.5" />
              <span>Mở Google Maps</span>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
