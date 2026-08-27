import { type ReactElement, useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { formatVnd } from '../../features/public/format';

interface PriceRangeSliderProps {
  min?: number;
  max?: number;
  minLimit?: number;
  maxLimit?: number;
  step?: number;
  onChange?: (range: { min?: number; max?: number }) => void;
  className?: string;
}

export function PriceRangeSlider({
  min = 0,
  max = 1000000,
  minLimit = 0,
  maxLimit = 1000000,
  step = 20000,
  onChange,
  className,
}: PriceRangeSliderProps): ReactElement {
  const [localMin, setLocalMin] = useState(min ?? minLimit);
  const [localMax, setLocalMax] = useState(max ?? maxLimit);

  useEffect(() => {
    setLocalMin(min ?? minLimit);
  }, [min, minLimit]);

  useEffect(() => {
    setLocalMax(max ?? maxLimit);
  }, [max, maxLimit]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), localMax - step);
    setLocalMin(val);
    onChange?.({ min: val > minLimit ? val : undefined, max: localMax < maxLimit ? localMax : undefined });
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), localMin + step);
    setLocalMax(val);
    onChange?.({ min: localMin > minLimit ? localMin : undefined, max: val < maxLimit ? val : undefined });
  };

  const minPercent = Math.max(0, Math.min(100, ((localMin - minLimit) / (maxLimit - minLimit)) * 100));
  const maxPercent = Math.max(0, Math.min(100, ((localMax - minLimit) / (maxLimit - minLimit)) * 100));

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-score font-bold text-foreground">
          {localMin <= minLimit ? '0 ₫' : formatVnd(localMin)}
        </span>
        <span className="text-muted-foreground font-medium text-[11px]">–</span>
        <span className="font-score font-bold text-primary">
          {localMax >= maxLimit ? 'Tất cả' : formatVnd(localMax)}
        </span>
      </div>

      <div className="relative flex h-5 w-full items-center">
        {/* Track background */}
        <div className="h-1.5 w-full rounded-full bg-muted" />
        
        {/* Highlighted active track */}
        <div
          className="absolute h-1.5 rounded-full bg-primary"
          style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
        />

        {/* Min Thumb input */}
        <input
          type="range"
          min={minLimit}
          max={maxLimit}
          step={step}
          value={localMin}
          onChange={handleMinChange}
          aria-label="Giá tối thiểu"
          className="pointer-events-none absolute h-1.5 w-full appearance-none bg-transparent accent-primary [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:cursor-pointer"
        />

        {/* Max Thumb input */}
        <input
          type="range"
          min={minLimit}
          max={maxLimit}
          step={step}
          value={localMax}
          onChange={handleMaxChange}
          aria-label="Giá tối đa"
          className="pointer-events-none absolute h-1.5 w-full appearance-none bg-transparent accent-primary [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>
    </div>
  );
}
