import { MapPin, Navigation } from 'lucide-react';
import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { buildGoogleMapsUrl, formatDistance } from '@courthub/shared';

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

/** Thẻ sân trong lưới kết quả tìm kiếm — ảnh, tên, địa chỉ, khoảng cách GPS, giá từ, rating & chỉ đường Google Maps. */
export function VenueCard({ venue }: VenueCardProps): ReactElement {
  const price = priceFrom(venue);
  const image = venue.images[0];
  const mapsUrl = buildGoogleMapsUrl(venue.lat, venue.lng, venue.address);
  // AC-03.3 + EC-06: '650 m' / '2.4 km'; ẩn badge khi không có khoảng cách hợp lệ.
  const distanceLabel = formatDistance(venue.distanceKm);

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden pt-0 transition hover:-translate-y-0.5 hover:shadow-lg focus-within:ring-2 focus-within:ring-ring">
      <Link
        to={`/venues/${venue.slug}`}
        className="block aspect-[16/10] w-full overflow-hidden bg-muted focus-visible:outline-none"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className={cn2(image !== undefined)}>
          {image !== undefined ? (
            <img
              src={image}
              alt={venue.name}
              loading="lazy"
              className="size-full object-cover transition group-hover:scale-105"
            />
          ) : (
            <span className="text-4xl font-bold text-emerald-700/60 dark:text-emerald-300/50">
              {venue.name.charAt(0)}
            </span>
          )}
        </div>
      </Link>

      <CardContent className="flex flex-1 flex-col justify-between space-y-2 p-4">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-semibold">
              <Link
                to={`/venues/${venue.slug}`}
                className="hover:text-primary focus-visible:outline-none focus-visible:underline"
              >
                {venue.name}
              </Link>
            </h3>
            {venue.ratingAvg !== undefined ? (
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <StarRating value={venue.ratingAvg} />
                {venue.ratingAvg.toFixed(1)}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {venue.district ? (
              <Badge variant="secondary" className="text-[11px] px-1.5 py-0 h-5">
                {venue.district}
              </Badge>
            ) : null}
            {distanceLabel !== null ? (
              <Badge
                variant="outline"
                className="text-[11px] px-1.5 py-0 h-5 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
              >
                📍 Cách bạn {distanceLabel}
              </Badge>
            ) : null}
          </div>

          <p className="flex items-center gap-1 line-clamp-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" aria-hidden />
            {venue.address}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          {price !== undefined ? (
            <p className="text-sm font-semibold text-primary">từ {formatVnd(price)}/slot</p>
          ) : (
            <Badge variant="secondary">Chưa có giá</Badge>
          )}

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Chỉ đường trên Google Maps"
            aria-label={`Chỉ đường đến ${venue.name} trên Google Maps`}
            className="inline-flex items-center gap-1 rounded-md border border-input bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:border-emerald-500 hover:bg-accent hover:text-emerald-700 dark:hover:text-emerald-400"
          >
            <Navigation className="size-3 text-emerald-600 dark:text-emerald-400" aria-hidden />
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
