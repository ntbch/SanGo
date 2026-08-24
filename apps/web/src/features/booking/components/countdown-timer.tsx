import { useEffect, useState, type ReactElement } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface CountdownTimerProps {
  expiresAt: string; // ISO string
  onExpire?: () => void;
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps): ReactElement {
  const [remainingSecs, setRemainingSecs] = useState<number>(() => {
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    const update = () => {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setRemainingSecs(0);
        onExpire?.();
      } else {
        setRemainingSecs(diff);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(remainingSecs / 60);
  const seconds = remainingSecs % 60;
  const isLow = remainingSecs > 0 && remainingSecs <= 120; // < 2 phút
  const isExpired = remainingSecs === 0;

  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 rounded-xl p-3 text-center transition-colors border',
        isExpired && 'bg-destructive/10 border-destructive/30 text-destructive',
        isLow &&
          !isExpired &&
          'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 animate-pulse',
        !isLow &&
          !isExpired &&
          'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
      )}
      role="timer"
      aria-live="polite"
    >
      {isExpired ? (
        <>
          <AlertTriangle className="size-5" aria-hidden />
          <span className="font-semibold">Đã hết thời gian giữ chỗ (10 phút)</span>
        </>
      ) : (
        <>
          <Clock className="size-5" aria-hidden />
          <div className="space-x-1.5">
            <span className="text-xs font-medium uppercase tracking-wide">
              Thời gian giữ chỗ còn lại:
            </span>
            <span className="font-mono text-lg font-bold">{timeStr}</span>
          </div>
        </>
      )}
    </div>
  );
}
