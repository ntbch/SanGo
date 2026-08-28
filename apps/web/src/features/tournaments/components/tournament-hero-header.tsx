import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { MapPin, Clock, ShieldCheck, Play, Crown, Award } from 'lucide-react';
import { Tournament } from '../api/tournaments-api';
import { formatVND, cn } from '../../../lib/utils';

interface TournamentHeroHeaderProps {
  tournament: Tournament;
  isManager: boolean;
  onOpenRegisterModal: () => void;
  onStartTournament: () => Promise<void>;
}

export function TournamentHeroHeader({
  tournament,
  isManager,
  onOpenRegisterModal,
  onStartTournament,
}: TournamentHeroHeaderProps): React.ReactElement {
  return (
    <Card className="relative overflow-hidden border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-xl rounded-3xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-border/60">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase border border-primary/20">
              {tournament.sportType}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-secondary text-muted-foreground text-[10px] font-bold uppercase">
              {tournament.city}
            </span>
            <span
              className={cn(
                'px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border',
                tournament.status === 'REGISTRATION'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : tournament.status === 'ONGOING'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
              )}
            >
              {tournament.status === 'REGISTRATION'
                ? 'Mở Đăng Ký'
                : tournament.status === 'ONGOING'
                ? 'Đang Thi Đấu'
                : 'Đã Trao Cúp'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {tournament.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 text-foreground font-semibold">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {tournament.district ? `${tournament.district}, ${tournament.city}` : tournament.city}
            </span>
            {tournament.registrationDeadline && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                <Clock className="h-3.5 w-3.5" />
                Hạn chót: {new Date(tournament.registrationDeadline).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tournament.status === 'REGISTRATION' && (
            <Button
              onClick={onOpenRegisterModal}
              size="sm"
              className="font-bold text-xs gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Đăng Ký Đội Vào Giải</span>
            </Button>
          )}

          {tournament.status === 'REGISTRATION' && isManager && (
            <Button
              onClick={onStartTournament}
              size="sm"
              variant="outline"
              className="font-bold text-xs gap-1.5 text-primary border-primary/40 hover:bg-primary/10 cursor-pointer"
            >
              <Play className="h-4 w-4" />
              <span>Khởi Tranh &amp; Sinh Nhánh Đấu</span>
            </Button>
          )}
        </div>
      </div>

      {/* 4 Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 text-center">
        <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Đội Ghi Danh</span>
          <span className="font-mono-num font-black text-base text-foreground">
            {tournament.teams?.length || 0} / {tournament.maxTeams} Đội
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Tổng Tiền Thưởng</span>
          <span className="font-mono-num font-black text-base text-primary">
            {formatVND(tournament.prizePool || 0)}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Lệ Phí / Đội</span>
          <span className="font-mono-num font-black text-base text-foreground">
            {formatVND(tournament.entryFee || 500000)}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-secondary/50 border border-border/50">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Khai Mạc</span>
          <span className="font-mono-num font-black text-base text-foreground">
            {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('vi-VN') : 'Sắp diễn ra'}
          </span>
        </div>
      </div>

      {/* Champion Trophy Display if finished */}
      {tournament.status === 'FINISHED' && tournament.championTeam && (
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-lg shadow-amber-500/30">
              <Crown className="h-7 w-7" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest block">
                Nhà Vô Địch Giải Đấu
              </span>
              <p className="text-lg font-black text-foreground">{tournament.championTeam.name}</p>
            </div>
          </div>
          <Award className="h-8 w-8 text-amber-500" />
        </div>
      )}
    </Card>
  );
}
