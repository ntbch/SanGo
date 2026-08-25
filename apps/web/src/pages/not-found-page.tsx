import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { House } from 'lucide-react';

import { APP_NAME } from '@courthub/shared';
import { Button } from '../components/ui/button';

/** Trang 404 toàn cục — dead-end screen kiểu Stitch: khối đồ hoạ số 404 to + một CTA về trang chủ. */
export function NotFoundPage(): ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 md:p-6">
      <div className="w-full max-w-3xl space-y-8 text-center">
        {/* Khối đồ hoạ — dùng đúng bộ gradient fallback ảnh trống của spec, không thêm hex mới */}
        <div className="relative isolate flex aspect-[2/1] w-full items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-emerald-200 via-emerald-100 to-teal-200 shadow-[0_12px_30px_rgba(15,23,42,0.1)] dark:border-border dark:from-emerald-900 dark:via-emerald-950 dark:to-teal-900 md:aspect-[3/1]">
          <House className="absolute size-40 -rotate-12 opacity-10 sm:size-56" aria-hidden />
          <p className="relative z-10 text-7xl font-extrabold tracking-tighter text-primary drop-shadow-md sm:text-8xl lg:text-9xl">
            404
          </p>
        </div>

        <div className="mx-auto max-w-lg space-y-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Không tìm thấy trang</h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Có vẻ như bạn đã sút bóng ra ngoài vạch vôi. Đường dẫn này không tồn tại trong{' '}
            {APP_NAME} hoặc đã bị di chuyển sang địa chỉ khác.
          </p>
        </div>

        <Button
          asChild
          size="lg"
          className="rounded-lg font-bold shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_12px_30px_rgba(15,23,42,0.1)]"
        >
          <Link to="/">
            <House aria-hidden /> Quay về trang chủ
          </Link>
        </Button>
      </div>
    </div>
  );
}
