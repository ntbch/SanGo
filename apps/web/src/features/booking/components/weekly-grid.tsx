import { useMemo, type ReactElement } from 'react';
import { cn } from '../../../lib/utils';
import { minutesToTime, formatVnd } from '../../public/format';
import type { DaySlots, SelectedSlot, SlotState, TimeSlot } from '../types';
import { getWeekDays } from '../slot-utils';

interface WeeklyGridProps {
  byDate: DaySlots[];
  fromDate: string;
  slotMinutes: number;
  openMinute: number;
  closeMinute: number;
  selectedSlots: SelectedSlot[];
  onToggleSlot: (date: string, slot: TimeSlot) => void;
}

const STATE_STYLES: Record<
  SlotState,
  { bg: string; text: string; label: string; selectable: boolean }
> = {
  AVAILABLE: {
    bg: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 cursor-pointer',
    text: 'Trống',
    label: 'Trống',
    selectable: true,
  },
  BOOKED: {
    bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 cursor-not-allowed opacity-75',
    text: 'Đã kín',
    label: 'Đã kín',
    selectable: false,
  },
  HELD: {
    bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 cursor-not-allowed animate-pulse',
    text: 'Đang giữ',
    label: 'Đang giữ',
    selectable: false,
  },
  MAINTENANCE: {
    bg: 'bg-muted/80 border-border text-muted-foreground cursor-not-allowed opacity-60',
    text: 'Bảo trì',
    label: 'Bảo trì',
    selectable: false,
  },
  PAST: {
    bg: 'bg-muted/40 border-border/50 text-muted-foreground/50 cursor-not-allowed opacity-40',
    text: 'Quá hạn',
    label: 'Quá hạn',
    selectable: false,
  },
};

export function WeeklyGrid({
  byDate,
  fromDate,
  slotMinutes,
  openMinute,
  closeMinute,
  selectedSlots,
  onToggleSlot,
}: WeeklyGridProps): ReactElement {
  const weekDays = useMemo(() => getWeekDays(fromDate), [fromDate]);

  // Tạo danh sách các timeline rows từ openMinute -> closeMinute theo bước slotMinutes
  const timeRows = useMemo(() => {
    const rows: Array<{ start: number; end: number }> = [];
    for (let m = openMinute; m + slotMinutes <= closeMinute; m += slotMinutes) {
      rows.push({ start: m, end: m + slotMinutes });
    }
    return rows;
  }, [openMinute, closeMinute, slotMinutes]);

  // Map slot theo key: `${date}_${startMinute}`
  const slotMap = useMemo(() => {
    const map = new Map<string, TimeSlot>();
    for (const day of byDate) {
      for (const s of day.slots) {
        map.set(`${day.date}_${s.startMinute}`, s);
      }
    }
    return map;
  }, [byDate]);

  const selectedKeySet = useMemo(() => {
    return new Set(selectedSlots.map((s) => `${s.date}_${s.startMinute}`));
  }, [selectedSlots]);

  return (
    <div className="space-y-4">
      {/* Chú thích màu trạng thái */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground rounded-lg bg-muted/40 p-3">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-emerald-400 bg-emerald-100 dark:bg-emerald-900" />
          <span>Trống (chọn được)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-primary bg-primary text-primary-foreground" />
          <span className="font-medium text-foreground">Đang chọn</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-amber-400 bg-amber-100 dark:bg-amber-900" />
          <span>Đang giữ (10')</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-rose-300 bg-rose-100 dark:bg-rose-900" />
          <span>Đã kín</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-border bg-muted" />
          <span>Quá hạn / Bảo trì</span>
        </div>
      </div>

      {/* Grid lịch 7 cột */}
      <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="w-20 p-2.5 text-center text-xs font-semibold text-muted-foreground sticky left-0 bg-muted/30 z-10">
                Giờ
              </th>
              {weekDays.map((d) => (
                <th
                  key={d.date}
                  className={cn(
                    'p-2.5 text-center font-medium border-l',
                    d.isToday && 'bg-primary/10 text-primary font-bold',
                  )}
                >
                  <div className="text-xs">{d.shortDay}</div>
                  <div className="text-sm">
                    {d.date.slice(8, 10)}/{d.date.slice(5, 7)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeRows.map((row) => (
              <tr key={row.start} className="border-b last:border-b-0 hover:bg-muted/10">
                <td className="p-2 text-center text-xs font-mono text-muted-foreground sticky left-0 bg-card z-10">
                  {minutesToTime(row.start)}
                </td>
                {weekDays.map((d) => {
                  const key = `${d.date}_${row.start}`;
                  const slot = slotMap.get(key) ?? {
                    startMinute: row.start,
                    endMinute: row.end,
                    state: 'AVAILABLE' as SlotState,
                  };
                  const isSelected = selectedKeySet.has(key);
                  const style = STATE_STYLES[slot.state] ?? STATE_STYLES.AVAILABLE;

                  return (
                    <td key={d.date} className="p-1 border-l text-center">
                      <button
                        type="button"
                        disabled={!style.selectable}
                        onClick={() => onToggleSlot(d.date, slot)}
                        aria-pressed={isSelected}
                        aria-label={`Slot ${d.date} ${minutesToTime(slot.startMinute)} - ${style.label}`}
                        className={cn(
                          'w-full py-2 px-1 rounded-md border text-xs font-medium transition-all flex flex-col items-center justify-center gap-0.5 min-h-[46px]',
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground shadow-sm ring-2 ring-primary/40 font-bold scale-[0.98]'
                            : style.bg,
                        )}
                      >
                        {isSelected ? (
                          <>
                            <span>Đã chọn ✓</span>
                            {slot.price ? (
                              <span className="text-[10px] opacity-90">
                                {formatVnd(slot.price)}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <span className="line-clamp-1">{style.text}</span>
                            {slot.state === 'AVAILABLE' && slot.price ? (
                              <span className="text-[10px] opacity-80">
                                {formatVnd(slot.price)}
                              </span>
                            ) : null}
                          </>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
