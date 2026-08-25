import { CalendarClock, MapPinned, ShieldCheck, Sparkles } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { APP_NAME, SPORT_TYPE_LABELS, type SportType } from '@courthub/shared';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { VenueCard } from '../features/public/components/venue-card';
import { useVenues } from '../features/public/queries';
import { useAuthStore } from '../lib/auth/auth-store';
import { DEFAULT_SITE_DESCRIPTION, usePageMeta } from '../lib/seo';

const sportEntries = Object.entries(SPORT_TYPE_LABELS) as [SportType, string][];
const TOP_VENUES_COUNT = 6;

/**
 * Landing công khai tại "/" (đề bài P1-F1): khách chưa đăng nhập xem được
 * hero marketing + khối tính năng + Top sân nổi bật thay vì bị đẩy sang /login.
 */
export function HomePage(): ReactElement {
  const user = useAuthStore((state) => state.user);
  const topVenuesQuery = useVenues({ page: 1 });
  const topVenues = (topVenuesQuery.data?.items ?? []).slice(0, TOP_VENUES_COUNT);

  // SEO: landing dùng title/description mặc định của site.
  usePageMeta(undefined, DEFAULT_SITE_DESCRIPTION);

  return (
    <div className="py-8">
      {/* Hero */}
      <section className="rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-8 text-center md:p-14">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-medium uppercase tracking-wide text-primary">
          <Sparkles className="size-3.5" aria-hidden />
          Nền tảng đặt sân thể thao trực tuyến
        </p>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
          {APP_NAME} — Sân chơi đúng ý, giờ chơi đúng hẹn
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Tìm cụm sân gần bạn, giữ chỗ an toàn 10 phút, đặt cọc online và check-in bằng mã QR — tất
          cả trong một nền tảng.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/venues">Khám phá sân</Link>
          </Button>
          {user ? (
            <Button size="lg" variant="outline" asChild>
              <Link to="/dashboard">Vào bảng điều khiển</Link>
            </Button>
          ) : (
            <Button size="lg" variant="outline" asChild>
              <Link to="/register">Đăng ký</Link>
            </Button>
          )}
        </div>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {sportEntries.map(([sport, label]) => (
            <li
              key={sport}
              className="rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground"
            >
              {label}
            </li>
          ))}
        </ul>
      </section>

      {/* Ba khối tính năng chính */}
      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <Feature
          icon={<MapPinned className="size-5" aria-hidden />}
          title="Tìm sân theo bản đồ"
          desc="Vị trí, tiện ích, khung giờ trống cập nhật realtime."
        />
        <Feature
          icon={<CalendarClock className="size-5" aria-hidden />}
          title="Giữ chỗ 10 phút"
          desc="Chốt slot an toàn trong lúc thanh toán cọc online."
        />
        <Feature
          icon={<ShieldCheck className="size-5" aria-hidden />}
          title="Check-in QR"
          desc="Mã đơn riêng, chống trùng lịch ở tầng database."
        />
      </section>

      {/* Top sân nổi bật — dữ liệu public GET /venues */}
      <section aria-labelledby="top-venues-heading" className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="top-venues-heading" className="text-2xl font-bold">
              Sân nổi bật
            </h2>
            <p className="text-sm text-muted-foreground">
              Những cụm sân đang được đặt nhiều nhất tuần này.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-primary">
            <Link to="/venues">Xem tất cả sân →</Link>
          </Button>
        </div>

        {topVenuesQuery.isPending ? (
          <div
            className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
            aria-busy="true"
            aria-label="Đang tải sân nổi bật"
          >
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="aspect-[16/10] rounded-xl" />
            ))}
          </div>
        ) : topVenues.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {topVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            Chưa có sân nào được công bố. Vui lòng quay lại sau.
          </p>
        )}
      </section>
    </div>
  );
}

interface FeatureProps {
  icon: ReactElement;
  title: string;
  desc: string;
}

function Feature({ icon, title, desc }: FeatureProps): ReactElement {
  return (
    <div className="rounded-xl border bg-card p-5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
