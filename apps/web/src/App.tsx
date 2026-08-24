import type { ReactElement } from 'react';

import { APP_NAME, SPORT_TYPE_LABELS, type SportType } from '@courthub/shared';

const sportEntries = Object.entries(SPORT_TYPE_LABELS) as [SportType, string][];

export default function App(): ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 px-6 text-slate-100">
      <main className="w-full max-w-xl space-y-8 text-center">
        <p className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1 text-xs font-medium tracking-wide text-emerald-300 uppercase">
          Giai đoạn 1 · Skeleton monorepo
        </p>

        <h1 className="text-6xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            {APP_NAME}
          </span>
        </h1>

        <p className="text-lg leading-relaxed text-slate-300">
          Hệ thống đặt và quản lý sân thể thao trực tuyến — tìm sân, giữ chỗ, đặt cọc, check-in.
        </p>

        <ul className="flex flex-wrap items-center justify-center gap-2">
          {sportEntries.map(([sport, label]) => (
            <li
              key={sport}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300"
            >
              {label}
            </li>
          ))}
        </ul>

        <footer className="pt-4 text-xs text-slate-500">
          pnpm workspaces · NestJS · React · TailwindCSS · Postgres 16 — CI phải xanh từ commit đầu
          tiên.
        </footer>
      </main>
    </div>
  );
}
