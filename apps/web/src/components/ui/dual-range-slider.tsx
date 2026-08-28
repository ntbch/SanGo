import React, { useRef, useState, useCallback } from 'react';
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
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null);

  const rawMin = value?.[0] ?? min;
  const rawMax = value?.[1] ?? max;

  const minVal = Math.min(Math.max(rawMin, min), max);
  const maxVal = Math.max(Math.min(rawMax, max), minVal);

  const minPercent = Math.min(100, Math.max(0, ((minVal - min) / (max - min)) * 100));
  const maxPercent = Math.min(100, Math.max(0, ((maxVal - min) / (max - min)) * 100));

  const getValueFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const rawValue = min + fraction * (max - min);
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.min(max, Math.max(min, steppedValue));
    },
    [min, max, step],
  );

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!trackRef.current) return;

    const clickedValue = getValueFromPointer(e.clientX);
    const distToMin = Math.abs(clickedValue - minVal);
    const distToMax = Math.abs(clickedValue - maxVal);

    let thumbToMove: 'min' | 'max';
    if (distToMin < distToMax) {
      thumbToMove = 'min';
    } else if (distToMax < distToMin) {
      thumbToMove = 'max';
    } else {
      thumbToMove = clickedValue <= minVal ? 'min' : 'max';
    }

    setActiveThumb(thumbToMove);
    trackRef.current.setPointerCapture(e.pointerId);

    if (thumbToMove === 'min') {
      const newMin = Math.min(clickedValue, maxVal - step);
      onChange?.([newMin, maxVal]);
    } else {
      const newMax = Math.max(clickedValue, minVal + step);
      onChange?.([minVal, newMax]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeThumb) return;
    const currentVal = getValueFromPointer(e.clientX);

    if (activeThumb === 'min') {
      const newMin = Math.min(Math.max(min, currentVal), maxVal - step);
      onChange?.([newMin, maxVal]);
    } else {
      const newMax = Math.max(Math.min(max, currentVal), minVal + step);
      onChange?.([minVal, newMax]);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeThumb) {
      try {
        trackRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setActiveThumb(null);
    }
  };

  const handleThumbPointerDown = (thumb: 'min' | 'max') => (e: React.PointerEvent) => {
    e.stopPropagation();
    setActiveThumb(thumb);
    trackRef.current?.setPointerCapture(e.pointerId);
  };

  const handleKeyDownMin = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const newMin = Math.max(min, minVal - step);
      onChange?.([newMin, maxVal]);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const newMin = Math.min(maxVal - step, minVal + step);
      onChange?.([newMin, maxVal]);
    }
  };

  const handleKeyDownMax = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const newMax = Math.max(minVal + step, maxVal - step);
      onChange?.([minVal, newMax]);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const newMax = Math.min(max, maxVal + step);
      onChange?.([minVal, newMax]);
    }
  };

  return (
    <div className={`space-y-2.5 select-none ${className}`}>
      <div className="flex items-center justify-between text-xs font-mono-num">
        <span className="font-bold text-foreground bg-secondary/80 px-2 py-0.5 rounded-md border border-border/40">
          {formatVND(minVal)}
        </span>
        <span className="text-muted-foreground text-[10px] uppercase font-bold">đến</span>
        <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
          {formatVND(maxVal)}
        </span>
      </div>

      <div
        ref={trackRef}
        onPointerDown={handleTrackPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative h-7 flex items-center cursor-pointer touch-none"
      >
        {/* Background Track */}
        <div className="absolute w-full h-1.5 rounded-full bg-secondary/80 pointer-events-none" />

        {/* Selected Range Highlight Track */}
        <div
          className="absolute h-1.5 rounded-full bg-primary pointer-events-none"
          style={{
            left: `${minPercent}%`,
            width: `${Math.max(0, maxPercent - minPercent)}%`,
          }}
        />

        {/* Left Thumb */}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Giá tối thiểu"
          aria-valuemin={min}
          aria-valuemax={maxVal - step}
          aria-valuenow={minVal}
          onKeyDown={handleKeyDownMin}
          onPointerDown={handleThumbPointerDown('min')}
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-card border-2 border-primary shadow-md flex items-center justify-center transition-transform cursor-grab active:cursor-grabbing hover:scale-125 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
            activeThumb === 'min' ? 'scale-125 ring-2 ring-primary/40 z-30' : 'z-20'
          }`}
          style={{ left: `${minPercent}%` }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </div>

        {/* Right Thumb */}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Giá tối đa"
          aria-valuemin={minVal + step}
          aria-valuemax={max}
          aria-valuenow={maxVal}
          onKeyDown={handleKeyDownMax}
          onPointerDown={handleThumbPointerDown('max')}
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-card border-2 border-primary shadow-md flex items-center justify-center transition-transform cursor-grab active:cursor-grabbing hover:scale-125 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
            activeThumb === 'max' ? 'scale-125 ring-2 ring-primary/40 z-30' : 'z-20'
          }`}
          style={{ left: `${maxPercent}%` }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
