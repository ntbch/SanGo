import {
  ArrowRight,
  CalendarClock,
  MapPinned,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { type FormEvent, type ReactElement, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  APP_NAME,
  UserRole,
  HANOI_DISTRICTS,
  SPORT_TYPE_LABELS,
  type SportType,
} from '@courthub/shared';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { VenueCard } from '../features/public/components/venue-card';
import { useVenues } from '../features/public/queries';
import { useAuthStore } from '../lib/auth/auth-store';
import { DEFAULT_SITE_DESCRIPTION, usePageMeta } from '../lib/seo';

const sportEntries = Object.entries(SPORT_TYPE_LABELS) as [SportType, string][];
const TOP_VENUES_COUNT = 6;

/** Container chuẩn 1280px của shell public (khớp PublicLayout). */
const SHELL_CONTAINER = 'mx-auto w-full max-w-[1280px] px-4 md:px-6';

/**
 * Landing công khai tại "/" (đề bài P1-F1) — diện mạo "Athletic Synergy":
 * hero navy "sân vận động đêm" với thanh tìm kiếm nhanh, khối tính năng,
 * Top sân nổi bật và banner ghép trận. Khách chưa đăng nhập vẫn xem được.
 */
export function HomePage(): ReactElement {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const topVenuesQuery = useVenues({ page: 1 });
  const topVenues = (topVenuesQuery.data?.items ?? []).slice(0, TOP_VENUES_COUNT);

  const [sport, setSport] = useState('');
  const [district, setDistrict] = useState('');

  // SEO: landing dùng title/description mặc định của site.
  usePageMeta(undefined, DEFAULT_SITE_DESCRIPTION);

  function handleSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const params = new URLSearchParams();
    if (sport !== '') params.set('sportType', sport);
    if (district !== '') params.set('district', district);
    const qs = params.toString();
    navigate(qs === '' ? '/venues' : `/venues?${qs}`);
  }

  return (
    <div>
      {/* ── Hero: navy full-bleed, đèn pha sân vận động, nội dung cap 1280px ── */}
      <section className="relative isolate overflow-hidden bg-navy">
        {/* Nền nhiều lớp thay ảnh Stitch: quầng sáng cỏ nhân tạo + vệt chéo khí chất thể thao */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(60rem 30rem at 15% -10%, rgba(46,204,113,0.28), transparent 60%),' +
              'radial-gradient(50rem 26rem at 90% 0%, rgba(56,189,248,0.18), transparent 55%),' +
              'linear-gradient(115deg, rgba(255,255,255,0.05) 0%, transparent 35%), #131b2e',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-y-0 right-[-10%] -z-10 hidden w-1/3 rotate-12 bg-[repeating-linear-gradient(115deg,rgba(46,204,113,0.07)_0px,rgba(46,204,113,0.07)_14px,transparent_14px,transparent_36px)] lg:block"
        />

        <div className={`${SHELL_CONTAINER} flex flex-col items-center py-16 text-center md:py-24`}>
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-turf-bright backdrop-blur">
            <Sparkles className="size-3.5" aria-hidden />
            Nền tảng đặt sân thể thao trực tuyến
          </p>
          <h1 className="mt-6 max-w-4xl text-balance text-4xl font-extrabold leading-[1.08] tracking-[-0.02em] text-white sm:text-5xl lg:text-6xl">
            {APP_NAME} — Đam Mê Thể Thao, Đặt Sân Dễ Dàng
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-white/80 md:text-lg">
            {APP_NAME} quy tụ các cụm sân chất lượng cao tại Hà Nội: tìm sân gần bạn, giữ chỗ an
            toàn 10 phút, đặt cọc online và check-in bằng mã QR — tất cả trong một nền tảng.
          </p>

          {/* Thanh tìm kiếm nhanh — dẫn thẳng sang /venues với bộ lọc có thật */}
          <form
            onSubmit={handleSearch}
            className="mt-9 flex w-full max-w-5xl flex-col gap-3 rounded-xl bg-card p-4 text-left shadow-[0_12px_40px_rgba(2,8,20,0.45)] md:flex-row md:items-stretch"
            aria-label="Tìm kiếm sân thể thao"
          >
            <label className="flex-1">
              <span className="sr-only">Chọn môn thể thao</span>
              <select
                aria-label="Chọn môn thể thao"
                value={sport}
                onChange={(event) => setSport(event.target.value)}
                className="h-12 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Chọn môn thể thao</option>
                {sportEntries.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex-1">
              <span className="sr-only">Chọn khu vực (Quận/Huyện)</span>
              <select
                aria-label="Chọn khu vực"
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                className="h-12 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Chọn khu vực (Quận/Huyện)</option>
                {HANOI_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="submit"
              size="lg"
              className="rounded-lg px-7 font-bold transition-colors hover:bg-primary/90"
            >
              Tìm sân
              <Search className="size-4" aria-hidden />
            </Button>
          </form>

          {/* Chip môn thể thao — lọc nhanh theo từng môn */}
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {sportEntries.map(([value, label]) => (
              <li key={value}>
                <Link
                  to={`/venues?sportType=${encodeURIComponent(value)}`}
                  className="inline-block rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-sm text-white/85 backdrop-blur transition hover:border-turf/50 hover:bg-turf/15 hover:text-white"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA chính theo vai trò (P1-F1): khách → khám phá/đăng ký; customer → đơn của mình; staff → bảng điều khiển */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              asChild
              className="rounded-lg font-bold shadow-[0_12px_30px_rgba(2,8,20,0.35)] transition-shadow hover:shadow-[0_16px_40px_rgba(2,8,20,0.45)]"
            >
              <Link to="/venues">Khám phá sân</Link>
            </Button>
            {user ? (
              user.role !== UserRole.CUSTOMER ? (
                <Button size="lg" variant="outline" asChild className="rounded-lg border-white/25 bg-transparent font-bold text-white hover:bg-white/10 hover:text-white">
                  {/* Chủ sân / quản trị: vào thẳng bảng điều khiển */}
                  <Link to="/dashboard">Bảng điều khiển</Link>
                </Button>
              ) : (
                <Button size="lg" variant="outline" asChild className="rounded-lg border-white/25 bg-transparent font-bold text-white hover:bg-white/10 hover:text-white">
                  {/* Customer đã đăng nhập: về đơn của mình, không lộ khái niệm dashboard */}
                  <Link to="/dashboard/my-bookings">Đơn đặt sân</Link>
                </Button>
              )
            ) : (
              <Button size="lg" variant="outline" asChild className="rounded-lg border-white/25 bg-transparent font-bold text-white hover:bg-white/10 hover:text-white">
                <Link to="/register">Đăng ký</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ── Ba khối tính năng chính ── */}
      <section className={`${SHELL_CONTAINER} mt-12`} aria-label="Tính năng nổi bật">
        <div className="grid gap-5 sm:grid-cols-3">
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
        </div>
      </section>

      {/* ── Top sân nổi bật — dữ liệu public GET /venues ── */}
      <section aria-labelledby="top-venues-heading" className={`${SHELL_CONTAINER} mt-14`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="top-venues-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
              Sân Phổ Biến Nhất
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Những cụm sân đang được đặt nhiều nhất tuần này.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild className="gap-1 font-bold text-primary hover:bg-accent">
            <Link to="/venues">
              Xem tất cả sân
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>

        {topVenuesQuery.isPending ? (
          <div
            className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            aria-busy="true"
            aria-label="Đang tải sân nổi bật"
          >
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="aspect-[16/10] rounded-xl" />
            ))}
          </div>
        ) : topVenues.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            Chưa có sân nào được công bố. Vui lòng quay lại sau.
          </p>
        )}
      </section>

      {/* ── Banner Ghép trận (tính năng có thật — thay banner khuyến mãi tĩnh của Stitch) ── */}
      <section className={`${SHELL_CONTAINER} my-14`} aria-labelledby="matches-banner-heading">
        <div className="relative isolate overflow-hidden rounded-xl bg-gradient-to-r from-ocean to-oxygen/80 p-8 text-white shadow-[0_4px_20px_rgba(15,23,42,0.05)] md:p-10">
          <Users
            aria-hidden
            className="absolute -right-6 top-1/2 size-56 -translate-y-1/2 opacity-15 md:size-72"
          />
          <div className="relative z-10 max-w-2xl">
            <h2 id="matches-banner-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
              Thiếu Người Chơi? Ghép Trận Ngay
            </h2>
            <p className="mt-2 leading-relaxed text-white/90">
              Các đơn đặt sân đang công khai tìm người tham gia — xem danh sách trận mở và tham gia
              chỉ trong vài chạm.
            </p>
            <Button asChild className="mt-6 rounded-lg bg-turf px-6 py-3 font-bold text-navy-deep hover:bg-turf-bright">
              <Link to="/matches" className="gap-2">
                Xem trận mở
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
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
    <div className="rounded-xl border border-border/70 bg-card p-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
      <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
        {icon}
      </span>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}
