import { Star } from 'lucide-react';
import { type ReactElement } from 'react';
import { cn } from '../../../lib/utils';

interface StarRatingProps {
  /** Điểm trung bình 0–5. */
  value: number;
  size?: 'sm' | 'md';
  className?: string;
}

/** Hiển thị sao chỉ đọc: đầy theo phần nguyên + nửa sao làm tròn 0.5. */
export function StarRating({ value, size = 'sm', className }: StarRatingProps): ReactElement {
  const dimension = size === 'sm' ? 'size-3.5' : 'size-4.5';
  const stars = [1, 2, 3, 4, 5].map((step) => {
    const filled = value >= step - 0.25;
    return (
      <Star
        key={step}
        className={cn(
          dimension,
          filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40',
        )}
        aria-hidden
      />
    );
  });
  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      role="img"
      aria-label={`Đánh giá ${value.toFixed(1)} trên 5`}
    >
      {stars}
    </span>
  );
}
