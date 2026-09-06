import React from 'react';
import { Card } from '../../../components/ui/card';
import { MapPin } from 'lucide-react';
import { OpenMatch } from '../api/matches-api';
import { formatVND } from '../../../lib/utils';

interface MatchDetailHeroProps {
  match: OpenMatch;
  isHost: boolean;
}

export function MatchDetailHero({ match, isHost }: MatchDetailHeroProps): React.ReactElement {
  const hostName = match.hostUser?.fullName || 'Chưa cập nhật';

  return (
    <Card className="relative overflow-hidden border border-border bg-card p-6 sm:p-8 shadow-sm rounded-3xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-border/60">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase border border-primary/20">
              {match.sportType || 'THỂ THAO'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-secondary text-muted-foreground text-[10px] font-bold">
              {match.skillLevel || 'Chưa cập nhật'}
            </span>
            {isHost && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[9px] font-black uppercase">
                Bạn là Chủ Kèo
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{match.title}</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>{match.venueName || 'Cụm Sân Thể Thao'} · {match.venueAddress || 'Hà Nội'}</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-secondary/50 border border-border/60 text-center shrink-0">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Thời Gian Bóng Lăn</span>
          <p className="font-mono-num font-black text-base text-foreground">
            {match.date ? new Date(match.date).toLocaleDateString('vi-VN') : 'Hôm nay'}
          </p>
          <p className="font-mono-num text-xs text-primary font-bold">{match.startTime && match.endTime ? match.startTime + ' - ' + match.endTime : 'Chưa cập nhật'}</p>
        </div>
      </div>

      {/* 4 Quick Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 text-center">
        <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Slot Đã Đăng Ký</span>
          <span className="font-mono-num font-black text-base text-foreground">
            {match.filledSlots ?? '—'} / {match.totalSlots ?? '—'}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Slot Còn Thiếu</span>
          <span className="font-mono-num font-black text-base text-primary">
            {match.totalSlots !== undefined && match.filledSlots !== undefined ? Math.max(0, match.totalSlots - match.filledSlots) : '—'} Người
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Chi Phí / Người</span>
          <span className="font-mono-num font-black text-base text-foreground">
            {match.costPerPerson ? formatVND(match.costPerPerson) : 'Chưa cập nhật'}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Chủ Kèo</span>
          <span className="font-bold text-xs text-foreground truncate block">{hostName}</span>
        </div>
      </div>
    </Card>
  );
}
