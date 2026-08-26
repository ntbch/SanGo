/**
 * Thẻ "Điểm uy tín" trên trang hồ sơ (F2): vòng tròn tiến độ score + breakdown
 * + các huy hiệu (icon + tooltip tiêu chí). Dùng lại ở bất kỳ đâu cần.
 */
import { Award, Clock, CalendarCheck2, CalendarX2 } from 'lucide-react';
import type { ReactElement } from 'react';

import { Skeleton } from '../../../components/ui/skeleton';
import { cn } from '../../../lib/utils';
import type { MyReputation } from '../types';

const SIZE = 96;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-destructive';
}

export function ReputationCard({
  reputation,
  loading,
}: {
  reputation: MyReputation | undefined;
  loading: boolean;
}): ReactElement {
  const score = reputation?.score ?? 0;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * CIRCUMFERENCE;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
        Điểm uy tín
      </h2>

      {loading ? (
        <div className="mt-4 flex items-center gap-6">
          <Skeleton className="size-24 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            {/* Vòng tiến độ điểm */}
            <div className="relative inline-flex items-center justify-center">
              <svg width={SIZE} height={SIZE} role="img" aria-label={`Điểm uy tín ${score}/100`}>
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  strokeWidth={STROKE}
                  className="stroke-muted"
                />
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                  transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                  className={cn('transition-[stroke-dasharray]', scoreColor(score))}
                  style={{ stroke: 'currentColor' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('font-score text-2xl font-extrabold', scoreColor(score))}>
                  {score}
                </span>
                <span className="text-[10px] text-muted-foreground">/ 100</span>
              </div>
            </div>

            {/* Breakdown */}
            {reputation ? (
              <ul className="space-y-1.5 text-sm" aria-label="Chi tiết điểm uy tín">
                <li className="flex items-center gap-2">
                  <CalendarCheck2 className="size-4 text-emerald-500" aria-hidden />
                  Đúng giờ:{' '}
                  <strong className="font-score">{reputation.breakdown.onTimeCheckIns}</strong> lần
                </li>
                <li className="flex items-center gap-2">
                  <CalendarX2 className="size-4 text-destructive" aria-hidden />
                  Hủy sát giờ:{' '}
                  <strong className="font-score">{reputation.breakdown.lateCancels}</strong> lần
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" aria-hidden />
                  No-show: <strong className="font-score">
                    {reputation.breakdown.noShows}
                  </strong>{' '}
                  lần
                </li>
              </ul>
            ) : null}
          </div>

          {/* Huy hiệu */}
          {reputation && reputation.badges.length > 0 ? (
            <div className="mt-5 border-t pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Huy hiệu
              </p>
              <ul className="flex flex-wrap gap-3">
                {reputation.badges.map((badge) => (
                  <li
                    key={badge.code}
                    title={
                      badge.unlocked
                        ? `Đã đạt: ${badge.current}/${badge.target}`
                        : `Chưa đạt: ${badge.current}/${badge.target}`
                    }
                    className={cn(
                      'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',
                      badge.unlocked
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border bg-muted/50 text-muted-foreground opacity-70',
                    )}
                  >
                    <Award className="size-3.5" aria-hidden />
                    {badge.name}
                    <span className="font-score opacity-80">
                      {badge.current}/{badge.target}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
