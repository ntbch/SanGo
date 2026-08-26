import { MapPin, Navigation } from 'lucide-react';
import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { buildGoogleMapsUrl, formatDistance } from '@sango/shared';

import { Badge } from '../../../components/ui/badge';
import { Card, CardContent } from '../../../components/ui/card';

import { formatVnd } from '../format';
import type { VenueListItem } from '../types';

import { StarRating } from './star-rating';

function priceFrom(venue: VenueListItem): number | undefined {
  if (venue.courts.length === 0) return undefined;
  return Math.min(...venue.courts.map((court) => court.defaultPricePerSlot));
}

const IMAGE_FALLBACK_GRADIENT =
  'bg-gradient-to-br from-emerald-200 via-emerald-100 to-teal-200 dark:from-emerald-900 dark:via-emerald-950 dark:to-teal-900';

interface VenueCardProps {
  venue: VenueListItem;
}

/**
 * Thẻ sân trong lưới kết quả — diện mạo Athletic Synergy: ảnh 16:10 với chip
 * quận/khoảng cách đặt trên ảnh, tên đậm, giá "score" nổi bật và nút chỉ đường.
 * Text badge khoảng cách & nhãn Maps được test neo chặt (AC-03.3, EC-06).
 */
export function VenueCard({ venue }: VenueCardProps): ReactElement {
  const price = priceFrom(venue);
  const image = venue.images[0];
  const mapsUrl = buildGoogleMapsUrl(venue.lat, venue.lng, venue.address);
  // AC-03.3 + EC-06: '650 m' / '2.4 km'; ẩn badge khi không có khoảng cách hợp lệ.
  const distanceLabel = formatDistance(venue.distanceKm);

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden rounded-xl border-border/60 pt-0 shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow duration-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)] focus-within:ring-2 focus-within:ring-ring">
      <Link
        to={`/venues/${venue.slug}`}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-muted focus-visible:outline-none"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className={cn2(image !== undefined)}>
          {image !== undefined ? (
            <img
              src={image}
              alt={venue.name}
              loading="lazy"
              className="size-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="text-4xl font-bold text-emerald-700/60 dark:text-emerald-300/50">
              {venue.name.charAt(0)}
            </span>
          )}
        </div>
        {/* Chip trên ảnh theo mẫu Stitch: quận trái, khoảng cách phải */}
        <span className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          {venue.district ? (
            <span className="rounded-full bg-navy/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              {venue.district}
            </span>
          ) : (
            <span />
          )}
          {distanceLabel !== null ? (
            <span className="flex items-center gap-1 rounded-full bg-turf px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-on-turf shadow-sm">
              <MapPin className="size-3" aria-hidden />
              Cách bạn {distanceLabel}
            </span>
          ) : null}
        </span>
      </Link>

      <CardContent className="flex flex-1 flex-col justify-between space-y-2 p-4">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-base font-bold tracking-tight">
              <Link
                to={`/venues/${venue.slug}`}
                className="hover:text-primary focus-visible:outline-none focus-visible:underline"
              >
                {venue.name}
              </Link>
            </h3>
            {venue.ratingAvg !== undefined ? (
              <span className="flex shrink-0 items-center gap-1 font-semibold text-muted-foreground">
                <StarRating value={venue.ratingAvg} />
                <span className="text-foreground">{venue.ratingAvg.toFixed(1)}</span>
              </span>
            ) : null}
          </div>

          <p className="flex items-center gap-1 line-clamp-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" aria-hidden />
            {venue.address}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
          {price !== undefined ? (
            <p className="text-lg font-extrabold text-primary">
              từ {formatVnd(price)}
              <span className="ml-0.5 text-xs font-medium text-muted-foreground">/slot</span>
            </p>
          ) : (
            <Badge variant="secondary">Chưa có giá</Badge>
          )}

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Chỉ đường trên Google Maps"
            aria-label={`Chỉ đường đến ${venue.name} trên Google Maps`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background/80 px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:border-primary/50 hover:bg-accent hover:text-accent-foreground"
          >
            <Navigation className="size-3.5 text-primary" aria-hidden />
            Chỉ đường
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function cn2(hasImage: boolean): string {
  return hasImage
    ? 'aspect-[16/10] w-full overflow-hidden bg-muted'
    : `flex aspect-[16/10] w-full items-center justify-center overflow-hidden ${IMAGE_FALLBACK_GRADIENT}`;
}
