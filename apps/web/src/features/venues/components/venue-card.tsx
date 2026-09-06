import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../../components/ui/card';
import { VenueItem } from '../api/venues-api';
import { SPORT_LABELS, SportType } from '../../../lib/constants';
import { formatMinutesToTime, formatVND } from '../../../lib/utils';
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
    <Card className="group overflow-hidden rounded-2xl border border-border bg-card hover:shadow-md transition-shadow duration-150 flex flex-col justify-between">
      <div>
        {/* Aspect 16:9 Image Container */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          <img
            src={thumbnail}
            alt={venue.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = getFallbackImage();
            }}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
          />
          <div className="absolute inset-0 bg-black/40" />

          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
            {/* Open / Closed Status Pill */}
            <div className="flex items-center gap-1.5 rounded-md bg-black/75 px-2.5 py-1 text-[11px] font-bold text-white">
              <span
                className={`h-2 w-2 rounded-full ${
                  isOpen ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              <span>{isOpen ? 'Đang mở cửa' : 'Đã đóng cửa'}</span>
            </div>

            {/* GPS Distance Badge */}
            {typeof venue.distanceKm === 'number' && (
              <div className="flex items-center gap-1 font-mono-num font-bold text-[11px] bg-black/75 px-2.5 py-1 rounded-md text-white">
                <Navigation className="h-3 w-3 text-white" />
                <span>{venue.distanceKm.toFixed(1)} km</span>
              </div>
            )}
          </div>

          {/* Bottom Overlay: Operating Hours & Rating */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs">
            <span className="font-mono-num font-semibold text-zinc-100 text-[11px]">
              {formatMinutesToTime(openMin)} - {formatMinutesToTime(closeMin)}
            </span>

            <div className="flex items-center gap-1 bg-black/75 px-2 py-0.5 rounded-md text-white font-mono-num font-bold text-xs">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{rating}</span>
            </div>
          </div>
        </div>

        {/* Card Content Area */}
        <CardContent className="p-4 space-y-2.5">
          {/* Venue Title */}
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {venue.name}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>{venue.address ? `${venue.address}, ` : ''}{venue.district}, {venue.city}</span>
            </p>
          </div>

          {/* Sport Tags & Court Count */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {sports.slice(0, 2).map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 rounded-lg bg-secondary/80 text-[11px] font-semibold text-foreground border border-border/50"
              >
                {SPORT_LABELS[s as SportType] || s}
              </span>
            ))}
            {courtCount > 0 && (
              <span className="text-[11px] text-muted-foreground font-mono-num">
                {courtCount} sân
              </span>
            )}
          </div>
        </CardContent>
      </div>

      {/* Card Footer: Price & Direct Booking Action */}
      <div className="px-4 pb-4 pt-2 border-t border-border/50 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider">Giá từ</span>
          <span className="text-xs sm:text-sm font-mono-num font-bold text-primary">
            {venue.priceFrom ? formatVND(venue.priceFrom) : '250.000 đ'}
            <span className="text-[10px] font-normal text-muted-foreground"> / slot</span>
          </span>
        </div>

        <Link to={`/venues/${venue.slug || venue.id}`}>
          <div className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary px-3 py-1.5 rounded-xl border border-primary/20 transition-all cursor-pointer active:scale-[0.98]">
            <span>Đặt sân</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      </div>
    </Card>
  );
}
