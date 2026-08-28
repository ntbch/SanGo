import React from 'react';
import { Card } from '../../../components/ui/card';
import { TournamentTeamEntry } from '../api/tournaments-api';

interface TournamentRegisteredTeamsTabProps {
  teams?: TournamentTeamEntry[];
}

export function TournamentRegisteredTeamsTab({
  teams = [],
}: TournamentRegisteredTeamsTabProps): React.ReactElement {
  return (
    <Card className="p-6 border border-border/80 bg-card shadow-md space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div>
          <h3 className="text-base font-black text-foreground">Danh Sách Câu Lạc Bộ Ghi Danh</h3>
          <p className="text-xs text-muted-foreground">Các đội đã xác nhận tham gia giải đấu.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((tt) => (
          <div
            key={tt.id}
            className="p-4 rounded-2xl bg-secondary/30 border border-border/60 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-base">
                {tt.team?.name?.charAt(0).toUpperCase() || 'T'}
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{tt.team?.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  Đội trưởng: {tt.team?.captain?.fullName || 'Trần Đức'}
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
              Đã Đăng Ký
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
