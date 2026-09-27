import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import { OpenMatch } from '../api/matches-api';
import { formatVND } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

interface MatchCardProps {
  match: OpenMatch;
}

export function MatchCard({ match: m }: MatchCardProps): React.ReactElement {
  const total = m.totalSlots ?? 0;
  const filled = m.filledSlots ?? 0;
  const slotsLeft = Math.max(0, total - filled);
  // total === 0 nghĩa là dữ liệu chưa có số chỗ, KHÔNG phải kèo đã kín — trước đây
  // card hiện "Đã đủ" cho mọi match thiếu trường này.
  const isFull = total > 0 && slotsLeft === 0;

  const formattedDate = React.useMemo(() => {
    if (!m.date) return 'Hôm nay';
    try {
      const d = new Date(m.date);
      return isNaN(d.getTime()) ? m.date : d.toLocaleDateString('vi-VN');
    } catch {
      return m.date;
    }
  }, [m.date]);

  return (
    <div
      key={m.id}
      data-testid={`match-card-${m.id}`}
      className="group flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 sm:p-5 rounded-2xl border border-border bg-card hover:shadow-md transition-shadow gap-4"
    >
      {/* Date & Time Tabular Schedule */}
      <div data-testid="fixture-date-column" className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-1 shrink-0 sm:min-w-[130px] sm:border-r sm:border-border/60 sm:pr-5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span>{formattedDate}</span>
        </div>
        <div className="font-mono-num font-black text-base sm:text-lg text-foreground tabular-nums">
          {m.startTime && m.endTime ? m.startTime + ' - ' + m.endTime : 'Chưa cập nhật'}
        </div>
      </div>

      {/* Match Details */}
      <div data-testid="fixture-main" className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-secondary text-foreground text-[10px] font-mono-num font-bold uppercase tracking-wider border border-border">
            {m.sportType || 'THỂ THAO'}
          </span>
          {m.skillLevel && (
            <span className="px-2 py-0.5 rounded-md bg-secondary text-muted-foreground text-[10px] font-medium border border-border">
              {m.skillLevel}
            </span>
          )}
          {m.requiresApproval === true && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-secondary text-foreground border border-border">
              Cần duyệt
            </span>
          )}
        </div>

        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
          <Link to={`/matches/${m.id}`} className="focus:outline-none focus:underline">
            {m.title}
          </Link>
        </h3>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground truncate">{m.venueName || 'Cụm sân SanGo'}</span>
            {m.venueAddress && <span className="text-muted-foreground truncate">· {m.venueAddress}</span>}
          </div>
        </div>
      </div>

      {/* Slots, Financials & CTA */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-4 shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border/60">
        <div className="flex flex-col sm:items-end gap-1">
          <div className="flex items-center gap-2">
            {isFull ? (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono-num font-bold bg-muted text-muted-foreground border border-border">
                Đã đủ
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono-num font-bold bg-secondary text-foreground border border-border">
                Còn {slotsLeft} slot
              </span>
            )}
            <span className="text-xs text-muted-foreground font-mono-num">
              ({filled}/{total})
            </span>
          </div>
          <div className="font-mono-num font-extrabold text-base text-primary tabular-nums">
            {m.costPerPerson ? formatVND(m.costPerPerson) : 'Chưa cập nhật'}
            <span className="text-[11px] font-normal text-muted-foreground ml-1">/ người</span>
          </div>
        </div>

        <Button
          asChild
          size="sm"
          className="active:scale-[0.98] font-bold shrink-0 transition-transform"
        >
          <Link to={`/matches/${m.id}`}>
            <span>Chi tiết</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
