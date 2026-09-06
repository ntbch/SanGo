import React from 'react';
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
    <div className="p-6 rounded-2xl border border-border bg-card space-y-6 overflow-x-auto">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h3 className="text-base font-black text-foreground">Sơ Đồ Cây Loại Trực Tiếp</h3>
          <p className="text-xs text-muted-foreground">Đội thắng vào vòng sau theo nhánh thi đấu phẳng.</p>
        </div>
      </div>

      {rounds.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
          <Swords className="h-8 w-8 mx-auto text-muted-foreground/40" />
          <p className="font-bold text-foreground">Chưa sinh nhánh đấu</p>
          <p>BTC sẽ tiến hành bốc thăm và tạo nhánh thi đấu sau khi kết thúc đăng ký.</p>
        </div>
      ) : (
        <div className="flex gap-8 min-w-[720px] py-4 items-stretch">
          {rounds.map((r, rIdx) => {
            const roundMatches = matchesByRound[r] || [];
            const roundTitle =
              r === 1 && rounds.length === 3
                ? 'Tứ Kết'
                : r === 2 && rounds.length === 3
                ? 'Bán Kết'
                : r === rounds.length
                ? 'Chung Kết'
                : `Vòng ${r}`;

            const isLastRound = rIdx === rounds.length - 1;

            return (
              <div key={r} className="flex-1 flex flex-col space-y-4">
                <div className="text-center py-2 px-3 rounded-lg bg-secondary text-secondary-foreground border border-border mb-2">
                  <span className="text-xs font-mono-num font-bold uppercase tracking-wider">{roundTitle}</span>
                </div>

                <div className="flex-1 flex flex-col justify-around space-y-6">
                  {roundMatches.map((m, mIdx) => (
                    <div key={m.id} className="relative flex items-center">
                      <div className="w-full p-3.5 rounded-xl bg-card border border-border space-y-2 text-xs">
                        {/* Match metadata */}
                        <div className="flex items-center justify-between text-[10px] font-mono-num text-muted-foreground border-b border-border/40 pb-1.5">
                          <span className="font-semibold text-foreground/70">Trận #{m.position ?? mIdx + 1}</span>
                          {m.matchTime && (
                            <span>
                              {new Date(m.matchTime).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>

                        {/* Home Team */}
                        <div
                          className={cn(
                            'flex items-center justify-between p-2 rounded-lg border transition-colors',
                            m.winnerTeamId && m.winnerTeamId === m.homeTeamId
                              ? 'bg-secondary text-foreground font-black border-primary/40'
                              : 'bg-secondary/40 text-foreground/85 font-medium border-border',
                          )}
                        >
                          <span className="truncate pr-2">{m.homeTeam?.name || 'Chờ xác định'}</span>
                          <span className="font-mono-num font-extrabold tabular-nums shrink-0">{m.homeScore ?? '-'}</span>
                        </div>

                        {/* Away Team */}
                        <div
                          className={cn(
                            'flex items-center justify-between p-2 rounded-lg border transition-colors',
                            m.winnerTeamId && m.winnerTeamId === m.awayTeamId
                              ? 'bg-secondary text-foreground font-black border-primary/40'
                              : 'bg-secondary/40 text-foreground/85 font-medium border-border',
                          )}
                        >
                          <span className="truncate pr-2">{m.awayTeam?.name || 'Chờ xác định'}</span>
                          <span className="font-mono-num font-extrabold tabular-nums shrink-0">{m.awayScore ?? '-'}</span>
                        </div>

                        {isManager && m.status !== 'DONE' && m.homeTeamId && m.awayTeamId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSelectMatchToScore(m)}
                            className="w-full text-[10px] font-bold h-7 mt-1 border-border active:scale-[0.98] cursor-pointer"
                          >
                            Cập nhật tỷ số
                          </Button>
                        )}
                      </div>

                      {/* Straight connecting lineage branch line */}
                      {!isLastRound && (
                        <div
                          className="hidden sm:block absolute -right-8 top-1/2 w-8 border-t border-border"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
