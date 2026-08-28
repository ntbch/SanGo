import React from 'react';
import { SPORT_LABELS } from '../../../lib/constants';
import { cn } from '../../../lib/utils';

export interface CourtItem {
  id: string;
  name: string;
  sportType: string;
  slotMinutes?: number;
}

interface BookingCourtTabsProps {
  courts: CourtItem[];
  selectedCourtId: string;
  onSelectCourt: (courtId: string) => void;
}

export function BookingCourtTabs({
  courts,
  selectedCourtId,
  onSelectCourt,
}: BookingCourtTabsProps): React.ReactElement | null {
  if (courts.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
        1. Chọn sân con ({courts.length} sân)
      </label>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {courts.map((court) => {
          const isSelected = selectedCourtId === court.id;
          return (
            <button
              key={court.id}
              type="button"
              onClick={() => onSelectCourt(court.id)}
              className={cn(
                'px-4 py-2.5 rounded-2xl border text-left shrink-0 transition-all cursor-pointer',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-emerald-500/20'
                  : 'bg-card border-border/80 text-foreground hover:bg-secondary/60',
              )}
            >
              <p className="text-xs sm:text-sm font-bold">{court.name}</p>
              <p
                className={cn(
                  'text-[10px]',
                  isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground',
                )}
              >
                {(SPORT_LABELS as Record<string, string>)[court.sportType] || court.sportType} · {court.slotMinutes || 60}p
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
