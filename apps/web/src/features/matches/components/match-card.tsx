import React from 'react';
import { Card } from '../../../components/ui/card';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, ArrowRight } from 'lucide-react';
import { OpenMatch } from '../api/matches-api';
import { formatVND, cn } from '../../../lib/utils';

interface MatchCardProps {
  match: OpenMatch;
}

export function MatchCard({ match: m }: MatchCardProps): React.ReactElement {
  const total = m.totalSlots ?? 10;
  const filled = m.filledSlots ?? 0;
  const slotsLeft = Math.max(0, total - filled);
  const fillPercent = Math.min(100, Math.round((filled / total) * 100));
  const hostName = m.hostUser?.fullName || 'Chủ kèo SanGo';

  // Capacity states
  const isFull = slotsLeft === 0;
  const isUrgent = slotsLeft > 0 && slotsLeft <= 2;



  return (
    <Card
      key={m.id}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card hover:shadow-md transition-shadow duration-150 flex flex-col justify-between"
    >
      {/* Full-card accessible click hitbox */}
      <Link
        to={`/matches/${m.id}`}
        aria-label={`Xem chi tiết kèo thi đấu: ${m.title}`}
        className="absolute inset-0 z-10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-2xl"
      />

      <div className="p-6 space-y-4 relative z-20 pointer-events-none">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-secondary text-foreground text-[10px] font-mono-num font-bold uppercase tracking-wider border border-border">
              {m.sportType || 'THỂ THAO'}
            </span>
            {m.requiresApproval === true && (
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-secondary text-foreground border border-border">
                Cần duyệt
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {isFull ? (
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono-num font-bold bg-muted text-muted-foreground border border-border">
                Đã đủ người
              </span>
            ) : isUrgent ? (
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono-num font-bold bg-secondary text-foreground border border-border">
                Còn {slotsLeft} slot
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono-num font-bold bg-secondary text-foreground border border-border">
                {m.skillLevel || 'Giao lưu nhẹ'}
              </span>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {m.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {m.description || 'Tham gia CLB giao lưu.'}
          </p>
        </div>

        {/* Venue & Time Info */}
        <div className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">{m.venueName || 'Cụm sân SanGo'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>{m.date ? new Date(m.date).toLocaleDateString('vi-VN') : 'Hôm nay'}</span>
            <span className="text-border">·</span>
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-mono-num font-medium text-foreground">
              {m.startTime || '18:00'} - {m.endTime || '19:30'}
            </span>
          </div>
        </div>

        {/* Slots Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-[11px] font-mono-num">
            <span className="text-muted-foreground">Slot đã tham gia:</span>
            <span className="font-bold text-foreground">
              {filled}/{total} ({slotsLeft > 0 ? `Còn ${slotsLeft} chỗ` : 'Đã kín'})
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                isFull
                  ? 'bg-muted-foreground/60'
                  : isUrgent
                    ? 'bg-amber-500'
                    : 'bg-primary',
              )}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        {/* Cost Box */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/40 border border-border/60">
          <span className="text-[11px] text-muted-foreground font-medium">Chi phí chia đều:</span>
          <span className="font-mono-num font-black text-sm text-primary">
            {formatVND(m.costPerPerson || 65000)} <span className="text-[10px] font-normal text-muted-foreground">/ người</span>
          </span>
        </div>
      </div>

      {/* Footer Link & Action */}
      <div className="px-6 py-3.5 bg-secondary/30 border-t border-border/50 flex items-center justify-between relative z-20 pointer-events-none">
        <div className="flex items-center gap-2 text-xs text-muted-foreground truncate mr-2">
          <span className="h-5 w-5 rounded-full bg-primary/15 text-primary font-black text-[10px] flex items-center justify-center shrink-0">
            {hostName.charAt(0).toUpperCase()}
          </span>
          <span className="truncate">
            Chủ kèo: <strong className="text-foreground font-semibold">{hostName}</strong>
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform shrink-0">
          <span>Tham gia ngay</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Card>
  );
}
