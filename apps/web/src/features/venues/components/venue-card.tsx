import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/card';
import { buttonVariants } from '../../../components/ui/button';
import { VenueItem } from '../api/venues-api';
import { SPORT_LABELS, SportType } from '../../../lib/constants';
import { formatMinutesToTime, formatVND, cn } from '../../../lib/utils';
import { Star, MapPin, Navigation, ArrowRight } from 'lucide-react';

export interface VenueCardProps {
  venue: VenueItem;
}

export function VenueCard({ venue }: VenueCardProps): React.ReactElement {
  if (!venue) return <></>;

  // Tính toán trạng thái mở/đóng cửa an toàn
  const now = new Date();
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  const openMin = typeof venue.openMinute === 'number' ? venue.openMinute : 360;
  const closeMin = typeof venue.closeMinute === 'number' ? venue.closeMinute : 1380;
  const isOpen = currentMinute >= openMin && currentMinute <= closeMin;

  const sports = venue.availableSports ?? venue.sportTypes ?? (venue.courts ? Array.from(new Set(venue.courts.map(c => c.sportType))) : []);

  const getFallbackImage = () => {
    if (sports.includes(SportType.FOOTBALL5) || sports.includes(SportType.FOOTBALL7)) return '/mock-football.svg';
    if (sports.includes(SportType.PICKLEBALL)) return '/mock-pickleball.svg';
    if (sports.includes(SportType.BADMINTON)) return '/mock-badminton.svg';
    if (sports.includes(SportType.TENNIS)) return '/mock-tennis.svg';
    return '/sample-court.svg';
  };

  const thumbnail =
    venue.images && venue.images.length > 0 && !venue.images[0].includes('unsplash')
      ? venue.images[0]
      : getFallbackImage();

  const courtCount = venue.totalCourts ?? venue.courtsCount ?? venue.courts?.length ?? 1;
  const rating = venue.avgRating ? Number(venue.avgRating).toFixed(1) : '5.0';

  return (
    <Card className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-150 flex flex-col sm:flex-row hover:border-foreground/20">
      {/* 4:3 Image Container (Desktop/Tablet row, mobile stacked) */}
      <div className="relative aspect-[4/3] w-full sm:w-56 shrink-0 overflow-hidden bg-muted">
        <img
          src={thumbnail}
          alt={venue.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = getFallbackImage();
          }}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-between gap-3">
        <div className="space-y-2">
          {/* Title & Rating Row */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base sm:text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {venue.name}
            </h3>
            <div className="flex items-center gap-1 font-mono-num font-semibold text-xs text-foreground shrink-0 pt-0.5">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{rating}</span>
              {venue.reviewsCount !== undefined && venue.reviewsCount > 0 && (
                <span className="text-muted-foreground font-normal">({venue.reviewsCount})</span>
              )}
            </div>
          </div>

          {/* Address (formatted without duplicate district/city) */}
          <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>
              {(() => {
                const addr = venue.address || '';
                const parts: string[] = addr ? [addr] : [];
                if (venue.district && !addr.toLowerCase().includes(venue.district.toLowerCase())) {
                  parts.push(venue.district);
                }
                if (venue.city && !addr.toLowerCase().includes(venue.city.toLowerCase())) {
                  parts.push(venue.city);
                }
                return parts.join(', ');
              })()}
            </span>
          </p>

          {/* Meta Text Row: Open/Closed Status + Hours + GPS Distance */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-0.5">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span
                className={cn(
                  'h-2 w-2 rounded-full shrink-0',
                  isOpen ? 'bg-emerald-500' : 'bg-rose-500',
                )}
              />
              <span>{isOpen ? 'Đang mở cửa' : 'Đã đóng cửa'}</span>
            </span>

            <span className="text-border">•</span>

            <span className="font-mono-num text-xs">
              {formatMinutesToTime(openMin)} - {formatMinutesToTime(closeMin)}
            </span>

            {typeof venue.distanceKm === 'number' && (
              <>
                <span className="text-border">•</span>
                <span className="inline-flex items-center gap-1 font-mono-num font-bold text-foreground">
                  <Navigation className="h-3 w-3 text-muted-foreground" />
                  <span>{venue.distanceKm.toFixed(1)} km</span>
                </span>
              </>
            )}
          </div>

          {/* Sports Badges: Flat semantic tokens */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {sports.slice(0, 3).map((s) => (
              <span
                key={s}
                className="bg-secondary text-secondary-foreground border border-border px-2 py-0.5 text-xs font-semibold rounded-md"
              >
                {SPORT_LABELS[s as SportType] || s}
              </span>
            ))}
            {courtCount > 0 && (
              <span className="text-xs text-muted-foreground font-mono-num pl-1">
                {courtCount} sân
              </span>
            )}
          </div>
        </div>

        {/* Card Bottom Row: Price & CTA Button */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider">
              Giá từ
            </span>
            <span className="font-mono-num font-extrabold text-base sm:text-lg text-foreground">
              {venue.priceFrom ? formatVND(venue.priceFrom) : '250.000 đ'}
              <span className="text-xs font-normal text-muted-foreground font-sans"> / slot</span>
            </span>
          </div>

          <Link
            to={`/venues/${venue.slug || venue.id}`}
            className={cn(
              buttonVariants({ size: 'sm' }),
              'font-semibold active:scale-[0.98]',
            )}
          >
            <span>Đặt sân</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
