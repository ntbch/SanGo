import { MapPin } from 'lucide-react';
import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';

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

/** Thẻ sân trong lưới kết quả tìm kiếm — ảnh, tên, địa chỉ, giá từ, rating. */
export function VenueCard({ venue }: VenueCardProps): ReactElement {
  const price = priceFrom(venue);
  const image = venue.images[0];
  return (
    <Link to={`/venues/${venue.slug}`} className="group focus-visible:outline-none">
      <Card className="h-full overflow-hidden pt-0 transition group-hover:-translate-y-0.5 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <div className={cn2(image !== undefined)}>
          {image !== undefined ? (
            <img src={image} alt={venue.name} loading="lazy" className="size-full object-cover" />
          ) : (
            <span className="text-4xl font-bold text-emerald-700/60 dark:text-emerald-300/50">
              {venue.name.charAt(0)}
            </span>
          )}
        </div>
        <CardContent className="space-y-1.5 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-semibold group-hover:text-primary">{venue.name}</h3>
            {venue.ratingAvg !== undefined ? (
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <StarRating value={venue.ratingAvg} />
                {venue.ratingAvg.toFixed(1)}
              </span>
            ) : null}
          </div>
          <p className="flex items-center gap-1 line-clamp-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" aria-hidden />
            {venue.address}
          </p>
          {price !== undefined ? (
            <p className="pt-1 text-sm font-medium text-primary">từ {formatVnd(price)}/slot</p>
          ) : (
            <Badge variant="secondary">Chưa có giá</Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function cn2(hasImage: boolean): string {
  return hasImage
    ? 'aspect-[16/10] w-full overflow-hidden bg-muted'
    : `flex aspect-[16/10] w-full items-center justify-center overflow-hidden ${IMAGE_FALLBACK_GRADIENT}`;
}
