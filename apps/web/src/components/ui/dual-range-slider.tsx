import React from 'react';
import { formatVND } from '../../lib/utils';

export interface DualRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value?: [number, number];
  onChange?: (value: [number, number]) => void;
  className?: string;
}

export function DualRangeSlider({
  min,
  max,
  step = 25000,
  value,
  onChange,
  className = '',
}: DualRangeSliderProps): React.ReactElement {
  const minVal = value?.[0] ?? min;
  const maxVal = value?.[1] ?? max;

  const minPercent = Math.min(100, Math.max(0, Math.round(((minVal - min) / (max - min)) * 100)));
  const maxPercent = Math.min(100, Math.max(0, Math.round(((maxVal - min) / (max - min)) * 100)));

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), maxVal - step);
    onChange?.([val, maxVal]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), minVal + step);
    onChange?.([minVal, val]);
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between text-xs font-mono-num">
        <span className="font-bold text-foreground bg-secondary/80 px-2 py-0.5 rounded-md border border-border/40">
          {formatVND(minVal)}
        </span>
        <span className="text-muted-foreground text-[10px] uppercase font-bold">đến</span>
        <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
          {formatVND(maxVal)}
        </span>
      </div>

      <div className="relative h-6 flex items-center">
        {/* Background Track */}
        <div className="absolute w-full h-1.5 rounded-full bg-secondary/80" />

        {/* Selected Range Highlight Track */}
        <div
          className="absolute h-1.5 rounded-full bg-primary"
          style={{
            left: `${minPercent}%`,
            width: `${Math.max(0, maxPercent - minPercent)}%`,
          }}
        />

        {/* Left Thumb Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={handleMinChange}
          className="pointer-events-none absolute w-full h-1.5 opacity-0 cursor-pointer z-30"
          style={{ pointerEvents: 'auto' }}
        />

        {/* Right Thumb Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={handleMaxChange}
          className="pointer-events-none absolute w-full h-1.5 opacity-0 cursor-pointer z-30"
          style={{ pointerEvents: 'auto' }}
        />

        {/* Custom Visual Thumbs */}
        <div
          className="absolute w-4 h-4 rounded-full bg-background border-2 border-primary shadow-xs -translate-x-1/2 pointer-events-none transition-transform hover:scale-110 z-20"
          style={{ left: `${minPercent}%` }}
        />
        <div
          className="absolute w-4 h-4 rounded-full bg-background border-2 border-primary shadow-xs -translate-x-1/2 pointer-events-none transition-transform hover:scale-110 z-20"
          style={{ left: `${maxPercent}%` }}
        />
      </div>
    </div>
  );
}
