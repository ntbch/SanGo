import React from 'react';
import { Card } from '../../../components/ui/card';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Calendar, Crown, Award, ChevronRight } from 'lucide-react';
import { Tournament } from '../api/tournaments-api';
import { formatVND, cn } from '../../../lib/utils';

interface TournamentCardProps {
  tournament: Tournament;
}

export function TournamentCard({ tournament: t }: TournamentCardProps): React.ReactElement {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REGISTRATION':
        return { label: 'Đang Mở Đăng Ký', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
      case 'ONGOING':
        return { label: 'Đang Diễn Ra', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' };
      case 'FINISHED':
        return { label: 'Đã Kết Thúc', className: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' };
      default:
        return { label: status, className: 'bg-secondary text-muted-foreground' };
    }
  };

  const statusInfo = getStatusBadge(t.status);
  const teamCount = t.teams?.length || 0;

  return (
    <Card
      key={t.id}
      className="group relative overflow-hidden border border-border/80 hover:border-primary/50 bg-card hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
    >
      <div className="p-6 space-y-4">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase border border-primary/20">
            {t.sportType}
          </span>
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border',
              statusInfo.className,
            )}
          >
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
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
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
          <div className="p-2 rounded-xl bg-secondary/40">
            <span className="text-[10px] text-muted-foreground font-bold block">Đội Đã Ghi Danh</span>
            <span className="font-mono-num font-black text-xs text-foreground">
              {teamCount} / {t.maxTeams} Đội
            </span>
          </div>
          <div className="p-2 rounded-xl bg-secondary/40">
            <span className="text-[10px] text-muted-foreground font-bold block">Tổng Giải Thưởng</span>
            <span className="font-mono-num font-black text-xs text-primary">
              {formatVND(t.prizePool || 0)}
            </span>
          </div>
        </div>

        {/* Champion Display if finished */}
        {t.status === 'FINISHED' && t.championTeam && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-[11px] text-muted-foreground">Quán quân:</span>
              <strong className="text-foreground font-bold">{t.championTeam.name}</strong>
            </div>
            <Award className="h-4 w-4 text-amber-500 shrink-0" />
          </div>
        )}
      </div>

      {/* Footer Action Link */}
      <div className="px-6 py-3.5 bg-secondary/20 border-t border-border/50 flex items-center justify-between">
        <span className="text-[11px] font-bold text-muted-foreground">Sơ đồ nhánh đấu &amp; Lịch thi</span>
        <Link
          to={`/tournaments/${t.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
        >
          <span>Xem bảng đấu</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
