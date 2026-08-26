/**
 * Một trận trong bracket (F7): tên đội + tỉ số, trạng thái; READY + đủ quyền
 * thì mở form nhập điểm inline. Connector line CSS nối sang vòng sau.
 */
import { Check, Loader2 } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../components/ui/use-toast';
import { cn } from '../../../lib/utils';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { useUpdateMatchScore } from '../queries';
import type { TournamentMatchItem } from '../types';

function TeamRow({
  name,
  score,
  isWinner,
  isDone,
}: {
  name: string | null;
  score: number | null;
  isWinner: boolean;
  isDone: boolean;
}): ReactElement {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs',
        isDone && !isWinner && 'text-muted-foreground opacity-60',
        isWinner && 'bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300',
      )}
    >
      <span className="truncate">
        {name ?? <span className="italic opacity-60">Chờ đội...</span>}
      </span>
      {score !== null && score !== undefined ? (
        <span className="font-score font-bold">{score}</span>
      ) : null}
    </div>
  );
}

export function BracketMatchCard({
  match,
  canManage,
  hasLeft,
  hasRight,
}: {
  match: TournamentMatchItem;
  canManage: boolean;
  hasLeft: boolean;
  hasRight: boolean;
}): ReactElement {
  const { toast } = useToast();
  const scoreMutation = useUpdateMatchScore();
  const [editing, setEditing] = useState(false);
  const [homeScore, setHomeScore] = useState(String(match.homeScore ?? 0));
  const [awayScore, setAwayScore] = useState(String(match.awayScore ?? 0));

  const done = match.status === 'DONE';
  const homeWon = done && match.winnerTeamId === match.homeTeam?.id;
  const awayWon = done && match.winnerTeamId === match.awayTeam?.id;
  const canEnter = canManage && match.status === 'READY' && match.homeTeam && match.awayTeam;

  async function submitScore(): Promise<void> {
    try {
      await scoreMutation.mutateAsync({
        matchId: match.id,
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
      });
      setEditing(false);
      toast({ title: 'Đã lưu tỷ số', description: 'Đội thắng tự động vào vòng tiếp theo.' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Không lưu được tỷ số',
        description: friendlyApiMessage(err),
      });
    }
  }

  return (
    <div className="relative" data-testid="bracket-match" data-status={match.status}>
      <div className="rounded-lg border border-border/60 bg-card p-2 shadow-xs">
        <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Trận {match.position} ·{' '}
          {done ? 'Kết thúc' : match.status === 'READY' ? 'Sẵn sàng' : 'Chờ đội'}
        </p>
        <TeamRow
          name={match.homeTeam?.name ?? null}
          score={match.homeScore}
          isWinner={homeWon}
          isDone={done}
        />
        <TeamRow
          name={match.awayTeam?.name ?? null}
          score={match.awayScore}
          isWinner={awayWon}
          isDone={done}
        />

        {/* Form nhập điểm inline — host/admin trên trận READY */}
        {canEnter ? (
          editing ? (
            <div className="mt-2 flex items-center gap-1.5 border-t pt-2">
              <Input
                type="number"
                min={0}
                aria-label="Tỷ số đội nhà"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="h-7 w-12 px-1 text-center font-score text-xs"
              />
              <span className="text-xs text-muted-foreground">–</span>
              <Input
                type="number"
                min={0}
                aria-label="Tỷ số đội khách"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="h-7 w-12 px-1 text-center font-score text-xs"
              />
              <Button
                size="sm"
                className="ml-auto h-7 gap-1 rounded-md px-2.5 text-xs font-bold"
                disabled={scoreMutation.isPending}
                onClick={() => void submitScore()}
              >
                {scoreMutation.isPending ? (
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                ) : (
                  <Check className="size-3" aria-hidden />
                )}
                Lưu
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 h-7 w-full rounded-md text-xs font-semibold"
              onClick={() => setEditing(true)}
            >
              Nhập tỷ số
            </Button>
          )
        ) : null}
      </div>

      {/* Đường nối CSS giữa các cột round — ẩn trên mobile (bracket cuộn ngang) */}
      {hasRight ? (
        <span
          aria-hidden
          className="absolute right-[-14px] top-1/2 hidden h-px w-[14px] bg-border md:block"
        />
      ) : null}
      {hasLeft ? (
        <span
          aria-hidden
          className="absolute left-[-14px] top-1/2 hidden h-px w-[14px] bg-border md:block"
        />
      ) : null}
    </div>
  );
}
