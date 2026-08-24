import { ArrowLeft, Banknote, Clock, MapPin, Star } from 'lucide-react';
import { Suspense, lazy, useState, type ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';

import { minutesToTime, formatVnd } from '../format';
import { StarRating } from '../components/star-rating';
import { useVenue, useVenueReviews } from '../queries';

// Bản đồ nạp lười — Leaflet khá nặng, chỉ tải khi vào trang chi tiết.
const VenueMap = lazy(() => import('../components/venue-map'));

function DetailSkeleton(): ReactElement {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8" aria-busy="true">
      <Skeleton className="h-8 w-40" />
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

/** Trang chi tiết cụm sân: gallery, tiện ích, sân con + giá, bản đồ, đánh giá. */
export function VenueDetailPage(): ReactElement {
  const { slug = '' } = useParams();
  const [imageIndex, setImageIndex] = useState(0);

  const venueQuery = useVenue(slug);
  const reviewsQuery = useVenueReviews(slug);

  if (venueQuery.isPending) return <DetailSkeleton />;
  if (venueQuery.isError) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <p className="font-medium">Không tìm thấy cụm sân này.</p>
        <Button asChild variant="outline">
          <Link to="/venues">
            <ArrowLeft className="size-4" aria-hidden /> Về danh sách sân
          </Link>
        </Button>
      </div>
    );
  }

  const venue = venueQuery.data;
  const images = venue.images.length > 0 ? venue.images : [];
  const activeImage = images[imageIndex] ?? images[0];
  const reviews = reviewsQuery.data?.items ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link to="/venues">
            <ArrowLeft className="size-4" aria-hidden /> Tìm sân
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold sm:text-3xl">{venue.name}</h1>
          {venue.ratingAvg !== undefined ? (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <StarRating value={venue.ratingAvg} size="md" />
              <strong className="text-foreground">{venue.ratingAvg.toFixed(1)}</strong>(
              {venue.ratingCount ?? 0} đánh giá)
            </span>
          ) : null}
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        {/* Gallery */}
        <section aria-label="Hình ảnh sân">
          <div className="aspect-video w-full overflow-hidden rounded-xl border bg-muted">
            {activeImage !== undefined ? (
              <img
                src={activeImage}
                alt={`${venue.name} - ảnh ${imageIndex + 1}`}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-emerald-200 via-emerald-100 to-teal-200 text-6xl font-bold text-emerald-700/50 dark:from-emerald-900 dark:via-emerald-950 dark:to-teal-900 dark:text-emerald-300/40">
                {venue.name.charAt(0)}
              </div>
            )}
          </div>
          {images.length > 1 ? (
            <div className="mt-2 grid grid-cols-6 gap-2">
              {images.slice(0, 6).map((src, index) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setImageIndex(index)}
                  aria-label={`Xem ảnh ${index + 1}`}
                  aria-current={index === imageIndex}
                  className={`aspect-square overflow-hidden rounded-md border-2 transition ${index === imageIndex ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        {/* Thông tin */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <p className="flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {venue.address}
            </p>
            <p className="flex items-center gap-2 text-sm">
              <Clock className="size-4 shrink-0 text-primary" aria-hidden />
              Mở cửa {minutesToTime(venue.openMinute)} – {minutesToTime(venue.closeMinute)} hằng
              ngày
            </p>
            <p className="flex items-center gap-2 text-sm">
              <Banknote className="size-4 shrink-0 text-primary" aria-hidden />
              Đặt cọc {venue.depositPercent}% · Huỷ trước 24h hoàn 100%
            </p>
            {venue.amenities.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold">Tiện ích</p>
                <ul className="flex flex-wrap gap-1.5">
                  {venue.amenities.map((amenity) => (
                    <li key={amenity}>
                      <Badge variant="secondary">{amenity}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <Suspense fallback={<Skeleton className="h-80 w-full rounded-xl" />}>
              <VenueMap lat={venue.lat} lng={venue.lng} name={venue.name} address={venue.address} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Sân con */}
      <section aria-labelledby="courts-heading" className="space-y-4">
        <h2 id="courts-heading" className="text-xl font-semibold">
          Sân con ({venue.courts.length})
        </h2>
        {venue.courts.length === 0 ? (
          <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            Cụm sân chưa công bố sân con nào.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {venue.courts.map((court) => (
              <Card key={court.id}>
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">{court.name}</h3>
                    <Badge variant="outline">{court.sportType}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Slot {court.slotMinutes} phút</p>
                  <p className="text-base font-semibold text-primary">
                    từ {formatVnd(court.defaultPricePerSlot)}/slot
                  </p>
                  <Button asChild size="sm" className="w-full">
                    {/* t11 sẽ thay bằng lịch tuần của court này */}
                    <a href={`/venues/${venue.slug}`} onClick={(event) => event.preventDefault()}>
                      Chọn giờ →
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Đánh giá */}
      <section aria-labelledby="reviews-heading" className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 id="reviews-heading" className="text-xl font-semibold">
            Đánh giá
          </h2>
          {venue.ratingAvg !== undefined ? (
            <span className="flex items-center gap-1 text-sm font-semibold text-amber-500">
              <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
              {venue.ratingAvg.toFixed(1)}
            </span>
          ) : null}
          <span className="text-sm text-muted-foreground">
            ({reviewsQuery.data?.total ?? venue.ratingCount ?? 0})
          </span>
        </div>
        {reviews.length === 0 ? (
          <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            Chưa có đánh giá nào cho cụm sân này.
          </p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{review.author}</span>
                  <span className="text-xs text-muted-foreground">{review.createdAt}</span>
                </div>
                <StarRating value={review.rating} className="mt-1" />
                {review.comment !== undefined && review.comment !== '' ? (
                  <p className="mt-2 text-sm text-muted-foreground">“{review.comment}”</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
