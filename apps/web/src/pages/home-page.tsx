import { CalendarClock, MapPinned, ShieldCheck } from 'lucide-react';
import type { ReactElement } from 'react';
import { Navigate, Link } from 'react-router-dom';

import { APP_NAME, SPORT_TYPE_LABELS, type SportType } from '@courthub/shared';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../lib/auth/auth-store';

const sportEntries = Object.entries(SPORT_TYPE_LABELS) as [SportType, string][];

/** Trang chủ placeholder: chưa đăng nhập thì chuyển thẳng tới /login (đề bài T7). */
export function HomePage(): ReactElement {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="py-12">
      <section className="rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-8 text-center md:p-14">
        <p className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-medium uppercase tracking-wide text-primary">
          Nền tảng đã sẵn sàng · Auth OK
        </p>
        <h1 className="mt-5 text-5xl font-black tracking-tight md:text-6xl">{APP_NAME}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Xin chào {user.fullName}! Hệ thống đặt và quản lý sân thể thao trực tuyến — tìm sân, giữ
          chỗ, đặt cọc, check-in.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/dashboard">Vào bảng điều khiển</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/venues">Khám phá sân thể thao</Link>
          </Button>
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
