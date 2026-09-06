import React from 'react';
import { Card } from '../../../components/ui/card';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Calendar, Crown, Award, ChevronRight } from 'lucide-react';
import { Tournament } from '../api/tournaments-api';
import { formatVND } from '../../../lib/utils';

interface TournamentCardProps {
  tournament: Tournament;
}

export function TournamentCard({ tournament: t }: TournamentCardProps): React.ReactElement {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REGISTRATION':
        return { label: 'Đang mở đăng ký' };
      case 'ONGOING':
        return { label: 'Đang diễn ra' };
      case 'FINISHED':
        return { label: 'Đã kết thúc' };
      default:
        return { label: status };
    }
  };

  const statusInfo = getStatusBadge(t.status);
  const teamCount = t.teams?.length || 0;

  return (
    <Card
      key={t.id}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card flex flex-col justify-between"
    >
      <div className="p-6 space-y-4">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-mono-num font-bold uppercase tracking-wider border border-border">
            {t.sportType}
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-mono-num font-bold uppercase tracking-wider border border-border">
            {statusInfo.label}
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {t.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {t.rules || 'Thi đấu loại trực tiếp cup vô địch.'}
          </p>
        </div>

        {/* Location & Dates */}
        <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{t.district ? `${t.district}, ${t.city}` : t.city}</span>
          </div>
          {t.registrationDeadline && (
            <div className="flex items-center gap-2 text-muted-foreground font-medium">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Hạn đăng ký: {new Date(t.registrationDeadline).toLocaleDateString('vi-VN')}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>Khai mạc: {t.startDate ? new Date(t.startDate).toLocaleDateString('vi-VN') : 'Sắp diễn ra'}</span>
          </div>
        </div>

        {/* Quick Stat Strip */}
        <div className="grid grid-cols-2 gap-2 pt-2 text-center">
          <div className="p-2.5 rounded-xl bg-secondary/40 border border-border">
            <span className="text-[10px] text-muted-foreground font-bold block mb-1">Đội Đã Ghi Danh</span>
            <span className="font-mono-num font-black text-sm text-primary tabular-nums">
              {teamCount} / {t.maxTeams} Đội
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary/40 border border-border">
            <span className="text-[10px] text-muted-foreground font-bold block mb-1">Tổng Giải Thưởng</span>
            <span className="font-mono-num font-black text-sm text-primary tabular-nums">
              {formatVND(t.prizePool || 0)}
            </span>
          </div>
        </div>

        {/* Champion Display if finished */}
        {t.status === 'FINISHED' && t.championTeam && (
          <div className="p-2.5 rounded-xl bg-secondary text-secondary-foreground border border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary shrink-0" />
              <span className="text-[11px] text-muted-foreground">Quán quân:</span>
              <strong className="text-foreground font-bold">{t.championTeam.name}</strong>
            </div>
            <Award className="h-4 w-4 text-primary shrink-0" />
          </div>
        )}
      </div>

      {/* Footer Action Link */}
      <div className="px-6 py-3.5 bg-secondary/20 border-t border-border/50 flex items-center justify-between">
        <span className="text-[11px] font-bold text-muted-foreground">Sơ đồ nhánh đấu &amp; Lịch thi</span>
        <Link
          to={`/tournaments/${t.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-primary active:scale-[0.98] transition-transform cursor-pointer"
        >
          <span>Xem bảng đấu</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
