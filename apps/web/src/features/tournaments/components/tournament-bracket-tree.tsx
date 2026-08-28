import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Swords } from 'lucide-react';
import { TournamentMatch } from '../api/tournaments-api';
import { cn } from '../../../lib/utils';

interface TournamentBracketTreeProps {
  rounds: number[];
  matchesByRound: Record<number, TournamentMatch[]>;
  isManager: boolean;
  onSelectMatchToScore: (match: TournamentMatch) => void;
}

export function TournamentBracketTree({
  rounds,
  matchesByRound,
  isManager,
  onSelectMatchToScore,
}: TournamentBracketTreeProps): React.ReactElement {
  return (
    <Card className="p-6 border border-border/80 bg-card shadow-md space-y-6 overflow-x-auto">
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div>
          <h3 className="text-base font-black text-foreground">Sơ Đồ Cây Loại Trực Tiếp</h3>
          <p className="text-xs text-muted-foreground">Tự động đẩy đội thắng vào vòng kế tiếp.</p>
        </div>
      </div>

      {rounds.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
          <Swords className="h-8 w-8 mx-auto text-muted-foreground/40" />
          <p className="font-bold text-foreground">Chưa sinh nhánh đấu</p>
          <p>Ban tổ chức sẽ bốc thăm và sinh nhánh đấu sau khi kết thúc hạn đăng ký.</p>
        </div>
      ) : (
        <div className="flex gap-8 min-w-[700px] py-4">
          {rounds.map((r) => {
            const roundMatches = matchesByRound[r] || [];
            const roundTitle =
              r === 1 && rounds.length === 3
                ? 'Tứ Kết'
                : r === 2 && rounds.length === 3
                ? 'Bán Kết'
                : r === rounds.length
                ? 'Chung Kết'
                : `Vòng ${r}`;

            return (
              <div key={r} className="flex-1 space-y-4">
                <div className="text-center p-2 rounded-xl bg-secondary/60 border border-border/60">
                  <span className="text-xs font-black uppercase text-foreground">{roundTitle}</span>
                </div>

                <div className="space-y-4">
                  {roundMatches.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-secondary/30 border border-border/60 space-y-2 text-xs"
                    >
                      {/* Home Team */}
                      <div
                        className={cn(
                          'flex items-center justify-between p-2 rounded-xl',
                          m.winnerTeamId && m.winnerTeamId === m.homeTeamId
                            ? 'bg-emerald-500/15 text-emerald-600 font-black'
                            : 'text-foreground font-semibold',
                        )}
                      >
                        <span className="truncate">{m.homeTeam?.name || 'Chờ xác định'}</span>
                        <span className="font-mono-num font-bold">{m.homeScore ?? '-'}</span>
                      </div>

                      {/* Away Team */}
                      <div
                        className={cn(
                          'flex items-center justify-between p-2 rounded-xl',
                          m.winnerTeamId && m.winnerTeamId === m.awayTeamId
                            ? 'bg-emerald-500/15 text-emerald-600 font-black'
                            : 'text-foreground font-semibold',
                        )}
                      >
                        <span className="truncate">{m.awayTeam?.name || 'Chờ xác định'}</span>
                        <span className="font-mono-num font-bold">{m.awayScore ?? '-'}</span>
                      </div>

                      {isManager && m.status !== 'DONE' && m.homeTeamId && m.awayTeamId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectMatchToScore(m)}
                          className="w-full text-[10px] font-bold h-7 mt-1 cursor-pointer"
                        >
                          Cập nhật tỷ số
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
