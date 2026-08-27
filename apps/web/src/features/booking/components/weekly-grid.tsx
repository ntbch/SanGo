import { Check } from 'lucide-react';
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
  // Recipe §4.5: slot trống — card nền sáng, hover đổi sang primary.
  AVAILABLE: {
    bg: 'border-input bg-card text-foreground cursor-pointer transition-colors hover:border-primary hover:text-primary',
    text: 'Trống',
    label: 'Trống',
    selectable: true,
  },
  // Recipe §4.5: slot không còn — gạch chéo + opacity-40, KHÔNG đổi màu khác.
  BOOKED: {
    bg: 'border-border bg-muted text-muted-foreground line-through opacity-40 cursor-not-allowed',
    text: 'Đã kín',
    label: 'Đã kín',
    selectable: false,
  },
  HELD: {
    bg: 'border-border bg-muted text-muted-foreground line-through opacity-40 cursor-not-allowed',
    text: 'Đang giữ',
    label: 'Đang giữ',
    selectable: false,
  },
  MAINTENANCE: {
    bg: 'border-border bg-muted text-muted-foreground line-through opacity-40 cursor-not-allowed',
    text: 'Bảo trì',
    label: 'Bảo trì',
    selectable: false,
  },
  PAST: {
    bg: 'border-border bg-muted text-muted-foreground line-through opacity-40 cursor-not-allowed',
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-input bg-card" />
          <span>Trống (chọn được)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded border-turf bg-turf" />
          <span className="font-medium text-foreground">Đang chọn</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded border-border bg-muted opacity-60" />
          <span>Không khả dụng: đã kín · đang giữ · bảo trì · quá hạn</span>
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
                <td className="p-2 text-center font-score text-xs text-muted-foreground sticky left-0 bg-card z-10">
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
                          'w-full px-1 py-2 rounded-lg border text-xs font-medium transition-all flex flex-col items-center justify-center gap-0.5 min-h-[48px]',
                          isSelected
                            ? 'border-turf bg-turf font-bold text-navy-deep shadow-sm'
                            : style.bg,
                        )}
                      >
                        {isSelected ? (
                          <>
                            <span className="flex items-center gap-1">
                              <Check className="size-3" aria-hidden /> Đã chọn
                            </span>
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
