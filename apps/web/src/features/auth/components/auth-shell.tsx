
import type { ReactElement } from 'react';

import { APP_NAME } from '@sango/shared';

/**
 * Vỏ trang xác thực (A5 — "auth hẹp giữa"): panel navy gradient với quầng sáng
 * turf/oxygen giống hero trang chủ, logo brand text-turf-bright trên nền navy,
 * bên trong là thẻ trắng bo-xl max-w-md căn giữa.
 * Lớp nền copy nguyên pattern hero home-page (không đặt màu mới).
 */
export const AUTH_CARD_CLASS =
  'w-full max-w-md rounded-xl border border-border/60 bg-card p-6 text-card-foreground shadow-[0_16px_40px_rgba(2,8,20,0.45)] sm:p-8';

export function AuthShell({ children }: { children: ReactElement }): ReactElement {
  return (
    // Route auth nằm ngoài PublicLayout nên section này tự chiếm trọn viewport.
    <section className="relative isolate min-h-screen overflow-hidden bg-navy">
      {/* Nền nhiều lớp thay ảnh Stitch: quầng sáng cỏ nhân tạo + vệt chéo khí chất thể thao */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(50rem 24rem at 12% -12%, rgba(46,204,113,0.25), transparent 60%),' +
            'radial-gradient(44rem 22rem at 88% 108%, rgba(56,189,248,0.18), transparent 55%),' +
            'linear-gradient(115deg, rgba(255,255,255,0.05) 0%, transparent 35%), #131b2e',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-y-0 right-[-6%] -z-10 hidden w-1/4 rotate-12 bg-[repeating-linear-gradient(115deg,rgba(46,204,113,0.07)_0px,rgba(46,204,113,0.07)_14px,transparent_14px,transparent_36px)] lg:block"
      />

      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-14 sm:px-6 md:py-20 lg:px-10">
        {/* Brand trên nền navy — cùng ngôn ngữ footer public-layout */}
        <p className="mb-6 flex items-center gap-2 text-lg font-extrabold tracking-tight text-turf-bright">
          <img
            src="/logo-256.png"
            alt={`Logo ${APP_NAME}`}
            className="size-8 rounded-lg object-cover bg-white/10"
          />
          {APP_NAME}
        </p>
        {children}
      </div>
    </section>
  );
}
