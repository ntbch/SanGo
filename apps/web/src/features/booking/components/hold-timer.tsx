import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface HoldTimerProps {
  expiresAt: string;
  onExpire?: () => void;
  className?: string;
}

export function HoldTimer({ expiresAt, onExpire, className }: HoldTimerProps): React.ReactElement {
  const [timeLeft, setTimeLeft] = React.useState<number>(0);
  const expireCalledRef = React.useRef(false);

  React.useEffect(() => {
    const targetTime = new Date(expiresAt).getTime();

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0 && !expireCalledRef.current) {
        expireCalledRef.current = true;
        onExpire?.();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft < 120 && timeLeft > 0;
  const isExpired = timeLeft === 0;

  // Tổng thời gian giữ chỗ mặc định 10 phút (600 giây)
  const totalSeconds = 600;
  const progressPercent = Math.min(100, Math.max(0, (timeLeft / totalSeconds) * 100));

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 transition-all duration-300',
        isExpired
          ? 'bg-destructive/10 border-destructive/30 text-destructive'
          : isUrgent
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 animate-pulse'
          : 'bg-primary/10 border-primary/20 text-foreground',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl font-bold',
              isExpired
                ? 'bg-destructive/20 text-destructive'
                : isUrgent
                ? 'bg-rose-500/20 text-rose-500'
                : 'bg-primary/20 text-primary',
            )}
          >
            {isUrgent || isExpired ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Clock className="h-5 w-5" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold">
              {isExpired
                ? 'Lượt giữ chỗ đã hết hạn'
                : isUrgent
                ? 'Sắp hết thời gian giữ chỗ!'
                : 'Thời gian giữ chỗ đang đếm ngược'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isExpired
                ? 'Slot đã được mở lại cho người khác'
                : 'Hoàn tất thanh toán để khóa sân vĩnh viễn'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span
            className={cn(
              'font-mono-num text-xl sm:text-2xl font-black tracking-tight',
              isExpired
                ? 'text-destructive'
                : isUrgent
                ? 'text-rose-500'
                : 'text-primary',
            )}
          >
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      {!isExpired && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-background/50">
          <div
            className={cn(
              'h-full transition-all duration-1000 ease-linear rounded-full',
              isUrgent ? 'bg-rose-500' : 'bg-primary',
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}
