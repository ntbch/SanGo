import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  ChevronRight,
  Clock,
  MapPin,
  Navigation,
  Star,
  Zap,
} from 'lucide-react';
import { Suspense, lazy, useState, type ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';
import { buildGoogleMapsUrl, hasUsableCoords } from '@sango/shared';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';

import { minutesToTime, formatVnd, formatReviewDate } from '../format';
import { StarRating } from '../components/star-rating';
import { useVenue, useVenueReviews } from '../queries';

// Bản đồ nạp lười — Leaflet khá nặng, chỉ tải khi vào trang chi tiết.
const VenueMap = lazy(() => import('../components/venue-map'));

function DetailSkeleton(): ReactElement {
  return (
    <div className="space-y-8" aria-busy="true">
      <Skeleton className="h-7 w-72" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="sticky top-28 h-80 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Trang chi tiết cụm sân — archetype 2 cột: nội dung trái, card đặt sân sticky phải. */
export function VenueDetailPage(): ReactElement {
  const { slug = '' } = useParams();
  const [imageIndex, setImageIndex] = useState(0);

  const venueQuery = useVenue(slug);
  const reviewsQuery = useVenueReviews(slug);

  if (venueQuery.isPending) return <DetailSkeleton />;
  if (venueQuery.isError) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
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

  // Card đặt sân sticky: giá thấp nhất trong các sân con làm mốc "Giá từ".
  const prices = venue.courts.map((court) => court.defaultPricePerSlot);
  const minPrice = prices.length > 0 ? Math.min(...prices) : undefined;
  const firstCourtId = venue.courts[0]?.id;

  return (
    <div className="space-y-8">
      {/* Breadcrumb nhẹ */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
      >
        <Link to="/" className="transition-colors hover:text-primary">
          Trang chủ
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link to="/venues" className="transition-colors hover:text-primary">
          Tìm sân
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-semibold text-foreground">{venue.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Cột nội dung chính */}
        <div className="flex flex-col gap-8 lg:col-span-8">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{venue.name}</h1>
              {venue.district ? (
                <span className="rounded-full bg-navy/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                  {venue.district}
                </span>
              ) : null}
            </div>
            {venue.ratingAvg !== undefined ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <StarRating value={venue.ratingAvg} size="md" />
                <strong className="text-foreground">{venue.ratingAvg.toFixed(1)}</strong>(
                {venue.ratingCount ?? 0} đánh giá)
              </div>
            ) : null}
          </header>

          {/* Gallery ảnh chính + dãy thumbnail */}
          <section aria-label="Hình ảnh sân" className="space-y-3">
            <div className="group aspect-video w-full overflow-hidden rounded-xl border border-border/60 bg-muted shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
              {activeImage !== undefined ? (
                <img
                  src={activeImage}
                  alt={`${venue.name} - ảnh ${imageIndex + 1}`}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-emerald-200 via-emerald-100 to-teal-200 text-6xl font-bold text-emerald-700/50 dark:from-emerald-900 dark:via-emerald-950 dark:to-teal-900 dark:text-emerald-300/40">
                  {venue.name.charAt(0)}
                </div>
              )}
            </div>
            {images.length > 1 ? (
              <div className="grid grid-cols-6 gap-2">
                {images.slice(0, 6).map((src, index) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setImageIndex(index)}
                    aria-label={`Xem ảnh ${index + 1}`}
                    aria-current={index === imageIndex}
                    className={`group/thumb aspect-square overflow-hidden rounded-lg border-2 transition ${
                      index === imageIndex
                        ? 'border-primary'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={src}
                      alt=""
                      className="size-full object-cover transition-transform duration-500 group-hover/thumb:scale-110"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          {/* Vị trí + bản đồ */}
          <section aria-labelledby="location-heading" className="space-y-3">
            <h2 id="location-heading" className="text-xl font-semibold tracking-tight">
              Vị trí sân
            </h2>
            <div className="space-y-4 rounded-xl border border-border/60 bg-card p-4 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {venue.address}
                </p>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-full font-bold"
                >
                  <a
                    href={buildGoogleMapsUrl(venue.lat, venue.lng, venue.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chỉ đường trên Google Maps"
                  >
                    <Navigation className="size-3.5 text-primary" aria-hidden />
                    Chỉ đường trên Google Maps
                  </a>
                </Button>
              </div>
              {/* EC-06: thiếu/0 tọa độ -> không render bản đồ, hiển thị ghi chú thay thế. */}
              {hasUsableCoords(venue.lat, venue.lng) ? (
                <Suspense fallback={<Skeleton className="h-80 w-full rounded-xl" />}>
                  <VenueMap
                    lat={venue.lat}
                    lng={venue.lng}
                    name={venue.name}
                    address={venue.address}
                  />
                </Suspense>
              ) : (
                <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Cụm sân chưa có tọa độ bản đồ. Vui lòng dùng nút “Chỉ đường trên Google Maps” phía
                  trên để tìm theo địa chỉ.
                </p>
              )}
            </div>
          </section>

          {/* Tiện ích — chip pill nền accent */}
          {venue.amenities.length > 0 ? (
            <section aria-labelledby="amenities-heading" className="space-y-3">
              <h2 id="amenities-heading" className="text-xl font-semibold tracking-tight">
                Tiện ích
              </h2>
              <ul className="flex flex-wrap gap-2">
                {venue.amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="rounded-full border border-border/60 bg-accent px-3.5 py-1.5 text-xs font-medium text-accent-foreground"
                  >
                    {amenity}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Sân con */}
          <section aria-labelledby="courts-heading" className="space-y-4">
            <h2 id="courts-heading" className="text-xl font-semibold tracking-tight">
              Sân con ({venue.courts.length})
            </h2>
            {venue.courts.length === 0 ? (
              <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                Cụm sân chưa công bố sân con nào.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {venue.courts.map((court) => (
                  <Card
                    key={court.id}
                    className="rounded-xl border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow duration-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
                  >
                    <CardContent className="flex h-full flex-col gap-2 p-5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold tracking-tight">{court.name}</h3>
                        <Badge variant="outline">{court.sportType}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Slot {court.slotMinutes} phút</p>
                      <p className="text-lg font-extrabold text-primary">
                        từ {formatVnd(court.defaultPricePerSlot)}/slot
                      </p>
                      <Button asChild size="sm" className="mt-auto w-full rounded-lg font-bold">
                        <Link to={`/venues/${venue.slug}/book?courtId=${court.id}`}>
                          Chọn giờ
                          <ArrowRight className="size-4" aria-hidden />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Đánh giá */}
          <section aria-labelledby="reviews-heading" className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="reviews-heading" className="text-xl font-semibold tracking-tight">
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
              <ul className="grid gap-4 md:grid-cols-2">
                {reviews.map((review) => {
                  const author = review.customer?.fullName ?? review.author ?? 'Khách hàng';
                  return (
                    <li
                      key={review.id}
                      className="rounded-xl border border-border/60 bg-card p-4 shadow-[0_4px_20px_rgba(15,23,42,0.05)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                          {author.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{author}</p>
                          <StarRating value={review.rating} className="mt-0.5" />
                        </div>
                        <span className="shrink-0 font-score text-xs text-muted-foreground">
                          {formatReviewDate(review.createdAt)}
                        </span>
                      </div>
                      {review.comment !== undefined && review.comment !== '' ? (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          “{review.comment}”
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Cột hành động — card đặt sân sticky (spec A3: top-28 dưới header h-20) */}
        <aside className="lg:col-span-4">
          <div className="sticky top-28 flex flex-col gap-5 rounded-xl border border-border/60 bg-card p-6 shadow-[0_12px_30px_rgba(15,23,42,0.1)]">
            <div className="space-y-1.5 border-b border-dashed border-border pb-4">
              <p className="font-score text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Giá từ
              </p>
              <p className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-primary">
                  {minPrice !== undefined ? formatVnd(minPrice) : '—'}
                </span>
                <span className="text-xs font-medium text-muted-foreground">/slot</span>
              </p>
              <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                <Zap className="size-3.5" aria-hidden /> Có sẵn khung giờ hôm nay
              </p>
            </div>

            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>
                  Mở cửa {minutesToTime(venue.openMinute)} – {minutesToTime(venue.closeMinute)} hằng
                  ngày
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Banknote className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>Đặt cọc {venue.depositPercent}% · Huỷ trước 24h hoàn 100%</span>
              </li>
            </ul>

            <div className="border-t border-dashed border-border pt-4">
              {venue.courts.length > 0 ? (
                <Button
                  asChild
                  size="lg"
                  className="w-full rounded-lg font-bold shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_12px_30px_rgba(15,23,42,0.1)]"
                >
                  <Link
                    to={
                      firstCourtId !== undefined
                        ? `/venues/${venue.slug}/book?courtId=${firstCourtId}`
                        : `/venues/${venue.slug}/book`
                    }
                  >
                    Đặt sân ngay
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              ) : (
                <p className="rounded-xl border border-dashed py-6 text-center text-sm text-muted-foreground">
                  Cụm sân chưa mở lịch đặt.
                </p>
              )}
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Chọn sân con và khung giờ ở bước tiếp theo.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
