import React from 'react';
import { Card } from '../../../components/ui/card';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { MyTeamMembership } from '../api/teams-api';
import { cn } from '../../../lib/utils';

interface TeamCardProps {
  membership: MyTeamMembership;
  sportNameMap?: Record<string, string>;
}

const DEFAULT_SPORT_NAME_MAP: Record<string, string> = {
  FOOTBALL: 'Bóng Đá',
  PICKLEBALL: 'Pickleball',
  BADMINTON: 'Cầu Lông',
  TENNIS: 'Tennis',
  BASKETBALL: 'Bóng Rổ',
};

export function TeamCard({
  membership: m,
  sportNameMap = DEFAULT_SPORT_NAME_MAP,
}: TeamCardProps): React.ReactElement {
  const t = m.team;

  return (
    <Card
      key={m.membershipId}
      className="group relative overflow-hidden border border-border/80 hover:border-primary/50 bg-card hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
    >
      <div className="p-6 space-y-4">
        {/* Top Row: Avatar & Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary font-black text-xl border border-primary/25 shadow-sm group-hover:scale-105 transition-transform">
            {t.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase border border-primary/20">
              {sportNameMap[t.sportType] || t.sportType}
            </span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider',
                m.role === 'CAPTAIN'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-secondary text-muted-foreground',
              )}
            >
              {m.role === 'CAPTAIN' ? 'Đội Trưởng' : 'Thành Viên'}
            </span>
          </div>
        </div>

        {/* Team Info */}
        <div className="space-y-1">
          <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
            {t.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {t.description || 'Đội thể thao phong trào SanGo.'}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-center">
          <div className="p-2 rounded-xl bg-secondary/40">
            <span className="text-[10px] text-muted-foreground font-bold block">Thành viên</span>
            <span className="font-mono-num font-black text-xs text-foreground">
              {t.memberCount ?? 1} Cầu thủ
            </span>
          </div>
          <div className="p-2 rounded-xl bg-secondary/40">
            <span className="text-[10px] text-muted-foreground font-bold block">Đội trưởng</span>
            <span className="font-bold text-xs text-foreground truncate block">
              {t.captain?.fullName || 'Bạn'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="px-6 py-3.5 bg-secondary/20 border-t border-border/50 flex items-center justify-between">
        <span className="text-[11px] font-bold text-muted-foreground">Phòng điều hành đội</span>
        <Link
          to={`/teams/${t.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
        >
          <span>Vào phòng đội</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
