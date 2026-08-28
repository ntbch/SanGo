import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface WeekDayInfo {
  dateStr: string;
  dayLabel: string;
  dateNum: string;
  isToday: boolean;
  isPast: boolean;
}

export interface WeekInfo {
  mondayStr: string;
  rangeLabel: string;
  days: WeekDayInfo[];
}

interface BookingDateSelectorProps {
  weekInfo: WeekInfo;
  weekOffset: number;
  onWeekOffsetChange: (offset: number) => void;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  slotsData?: {
    byDate?: Array<{
      date: string;
      slots: Array<{ state: string }>;
    }>;
  };
}

export function BookingDateSelector({
  weekInfo,
  weekOffset,
  onWeekOffsetChange,
  selectedDate,
  onSelectDate,
  slotsData,
}: BookingDateSelectorProps): React.ReactElement {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          2. Chọn ngày &amp; tuần thi đấu
        </label>

        {/* Week Controls */}
        <div className="flex items-center gap-2 bg-secondary/40 border border-border/70 p-1 rounded-2xl">
          <button
            type="button"
            disabled={weekOffset <= 0}
            onClick={() => onWeekOffsetChange(Math.max(0, weekOffset - 1))}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="text-xs font-bold font-mono-num px-2 text-foreground">
            Tuần: {weekInfo.rangeLabel}
          </span>

          <button
            type="button"
            disabled={weekOffset >= 8}
            onClick={() => onWeekOffsetChange(weekOffset + 1)}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {weekOffset > 0 && (
            <button
              type="button"
              onClick={() => onWeekOffsetChange(0)}
              className="ml-1 px-2.5 py-1 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold shadow-xs cursor-pointer"
            >
              Tuần này
            </button>
          )}
        </div>
      </div>

      {/* 7 Days of Selected Week Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {weekInfo.days.map((d) => {
          const isSelected = selectedDate === d.dateStr;
          const daySlotItems = slotsData?.byDate?.find((x) => x.date === d.dateStr)?.slots || [];
          const availableCount = daySlotItems.filter((s) => s.state === 'AVAILABLE').length;

          return (
            <button
              key={d.dateStr}
              type="button"
              disabled={d.isPast}
              onClick={() => onSelectDate(d.dateStr)}
              className={cn(
                'p-3 rounded-2xl border text-center transition-all cursor-pointer relative flex flex-col justify-between min-h-[76px]',
                d.isPast && 'opacity-40 bg-muted/20 border-border/30 cursor-not-allowed',
                isSelected &&
                  'bg-primary text-primary-foreground border-primary shadow-md shadow-emerald-500/20 ring-2 ring-primary/30 scale-[1.02] z-10',
                !isSelected &&
                  !d.isPast &&
                  'bg-card border-border/80 text-foreground hover:bg-secondary/60 hover:border-primary/50',
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={cn(
                    'text-[11px] font-bold',
                    isSelected ? 'text-primary-foreground' : d.isToday ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {d.dayLabel}
                </span>
                {d.isToday && (
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      isSelected ? 'bg-white' : 'bg-primary animate-pulse',
                    )}
                  />
                )}
              </div>

              <span className="font-mono-num font-black text-sm sm:text-base block my-0.5">
                {d.dateNum}
              </span>

              <span
                className={cn(
                  'text-[10px] font-mono-num block truncate',
                  isSelected
                    ? 'text-primary-foreground/80'
                    : availableCount > 0
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-muted-foreground',
                )}
              >
                {d.isPast ? 'Đã qua' : availableCount > 0 ? `${availableCount} slot trống` : 'Hết slot'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
