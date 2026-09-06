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
        'rounded-2xl border p-4 transition-colors duration-200',
        isExpired || isUrgent
          ? 'bg-destructive/10 border-destructive text-destructive'
          : 'bg-secondary/40 border-border text-foreground',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl font-bold shrink-0',
              isExpired || isUrgent
                ? 'bg-destructive/20 text-destructive'
                : 'bg-primary/10 text-primary',
            )}
          >
            {isUrgent || isExpired ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Clock className="h-5 w-5" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">
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

        <div className="text-right shrink-0">
          <span
            className={cn(
              'font-mono-num font-black text-2xl tracking-tight tabular-nums',
              isExpired || isUrgent ? 'text-destructive' : 'text-primary',
            )}
          >
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      {!isExpired && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary/80">
          <div
            className={cn(
              'h-full transition-all duration-1000 ease-linear rounded-full',
              isUrgent ? 'bg-destructive' : 'bg-primary',
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}
