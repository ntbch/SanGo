import React from 'react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Đã có lỗi xảy ra',
  message = 'Không thể tải được dữ liệu vào lúc này. Vui lòng kiểm tra lại kết nối mạng.',
  onRetry,
  className,
}: ErrorStateProps): React.ReactElement {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-destructive/30 bg-destructive/5',
        className,
      )}
    >
      <h3 className="text-base sm:text-lg font-bold text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <div className="mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="font-semibold border-destructive/40 text-foreground hover:bg-destructive/10 transition-colors active:scale-[0.98]"
          >
            Thử lại ngay
          </Button>
        </div>
      )}
    </div>
  );
}
