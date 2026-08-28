import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { TournamentMatch } from '../api/tournaments-api';

interface TournamentMatchesTabProps {
  matches?: TournamentMatch[];
  isManager: boolean;
  onSelectMatchToScore: (match: TournamentMatch) => void;
}

export function TournamentMatchesTab({
  matches = [],
  isManager,
  onSelectMatchToScore,
}: TournamentMatchesTabProps): React.ReactElement {
  return (
    <Card className="p-6 border border-border/80 bg-card shadow-md space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div>
          <h3 className="text-base font-black text-foreground">Lịch Thi Đấu &amp; Nhập Tỷ Số</h3>
          <p className="text-xs text-muted-foreground">Theo dõi và cập nhật kết quả từng trận đấu.</p>
        </div>
      </div>

      <div className="space-y-4">
        {matches.map((m) => (
          <div
            key={m.id}
            className="p-4 rounded-2xl bg-secondary/30 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary">Trận #{m.position}</span>
                <span className="text-muted-foreground">· Vòng {m.round}</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-foreground">
                <span>{m.homeTeam?.name || 'TBD'}</span>
                <span className="font-mono-num text-primary font-bold">
                  {m.homeScore ?? '-'} : {m.awayScore ?? '-'}
                </span>
                <span>{m.awayTeam?.name || 'TBD'}</span>
              </div>
            </div>

            {isManager && m.status !== 'DONE' && m.homeTeamId && m.awayTeamId && (
              <Button
                size="sm"
                onClick={() => onSelectMatchToScore(m)}
                className="font-bold text-xs cursor-pointer"
              >
                Nhập Tỷ Số
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
