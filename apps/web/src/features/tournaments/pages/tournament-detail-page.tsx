/**
 * Trang chi tiết giải đấu (F7) — BRACKET 8 đội single-elimination hiển thị
 * theo cột round (QF -> SF -> F), đường nối CSS; captain đăng ký đội khi
 * REGISTRATION; host/admin nhập điểm tại trận READY; banner vô địch khi FINISHED.
 */
import { ArrowLeft, Loader2, Trophy, UserPlus } from 'lucide-react';
import { useMemo, type ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { useToast } from '../../../components/ui/use-toast';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { usePageMeta } from '../../../lib/seo';
import { useMyTeams } from '../../teams/queries';
import { BracketMatchCard } from '../components/bracket-match-card';
import { TournamentStatusBadge } from '../components/status-badge';
import { useRegisterTeam, useStartTournament, useTournament } from '../queries';
import type { TournamentMatchItem } from '../types';

const SPORT_LABELS: Record<string, string> = {
  PICKLEBALL: 'Pickleball',
  BADMINTON: 'Cầu lông',
  TENNIS: 'Tennis',
  FOOTBALL5: 'Bóng đá 5',
  FOOTBALL7: 'Bóng đá 7',
};

/** Tên round theo số trận trong vòng (giải 8 đội). */
function roundLabel(roundNumber: number): string {
  if (roundNumber === 1) return 'Tứ kết';
  if (roundNumber === 2) return 'Bán kết';
  return 'Chung kết';
}

export function TournamentDetailPage(): ReactElement {
  const { tournamentId = '' } = useParams();
  const me = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const tourQuery = useTournament(tournamentId || undefined);
  const myTeamsQuery = useMyTeams();
  const registerMutation = useRegisterTeam();
  const startMutation = useStartTournament();

  usePageMeta('Giải đấu', 'Bảng đấu loại trực tiếp, kết quả và đội vô địch.');

  const tour = tourQuery.data;

  /** Host/admin: ADMIN hoặc chính người tạo giải — khớp isManager phía BE. */
  const canManage = Boolean(tour && me && (me.role === 'ADMIN' || tour.createdBy.id === me.id));

  /** Các đội tôi làm captain mà chưa đăng ký giải này (chỉ hiện ở REGISTRATION). */
  const myCaptainTeams = useMemo(() => {
    if (!tour || !me) return [];
    const registeredIds = new Set(tour.teams.map((t) => t.team.id));
    return (myTeamsQuery.data ?? [])
      .filter((m) => m.role === 'CAPTAIN' && m.status === 'ACTIVE' && !registeredIds.has(m.team.id))
      .map((m) => m.team);
  }, [tour, me, myTeamsQuery.data]);

  /** Bracket nhóm theo round: round 1..3 -> các cột QF/SF/F. */
  const rounds = useMemo(() => {
    if (!tour) return [] as Array<{ roundNumber: number; matches: TournamentMatchItem[] }>;
    const map = new Map<number, TournamentMatchItem[]>();
    for (const m of tour.matches) {
      const list = map.get(m.round) ?? [];
      list.push(m);
      map.set(m.round, list);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a - b)
      .map(([roundNumber, matches]) => ({ roundNumber, matches }));
  }, [tour]);

  async function handleRegister(teamId: string): Promise<void> {
    try {
      await registerMutation.mutateAsync({ tournamentId, teamId });
      toast({ title: 'Đăng ký thành công', description: 'Chờ giải khởi tranh để thấy bảng đấu.' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Đăng ký thất bại',
        description: friendlyApiMessage(err),
      });
    }
  }

  async function handleStart(): Promise<void> {
    try {
      await startMutation.mutateAsync(tournamentId);
      toast({ title: 'Giải đã khởi động', description: 'Bảng đấu loại trực tiếp đã được sinh.' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Không khởi động được giải',
        description: friendlyApiMessage(err),
      });
    }
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
        <Link to="/tournaments">
          <ArrowLeft className="size-4" aria-hidden /> Danh sách giải
        </Link>
      </Button>

      {tourQuery.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : tourQuery.isError || !tour ? (
        <Card className="rounded-xl border-dashed">
          <CardContent className="p-12 text-center">
            <p className="font-medium">Không tìm thấy giải đấu.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Header giải */}
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{tour.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{SPORT_LABELS[tour.sportType] ?? tour.sportType}</Badge>
                <TournamentStatusBadge status={tour.status} />
                <span>
                  {tour.teams.length}/{tour.maxTeams} đội · Host:{' '}
                  <strong className="text-foreground/80">{tour.createdBy.fullName}</strong>
                </span>
              </div>
              {tour.description ? (
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{tour.description}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Captain đăng ký đội của mình */}
              {tour.status === 'REGISTRATION' && myCaptainTeams.length > 0 ? (
                <label className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-semibold">
                  <UserPlus className="size-3.5 text-primary" aria-hidden />
                  <select
                    aria-label="Đăng ký đội vào giải"
                    defaultValue=""
                    disabled={registerMutation.isPending}
                    onChange={(e) => {
                      if (e.target.value) void handleRegister(e.target.value);
                      e.target.value = '';
                    }}
                    className="bg-transparent text-xs focus-visible:outline-none"
                  >
                    <option value="" disabled>
                      Đăng ký đội...
                    </option>
                    {myCaptainTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {/* Host/admin khóa đăng ký + sinh bracket */}
              {canManage && tour.status === 'REGISTRATION' ? (
                <Button
                  size="sm"
                  className="gap-1.5 rounded-lg font-bold"
                  disabled={startMutation.isPending}
                  onClick={() => void handleStart()}
                >
                  {startMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  Khởi động giải
                </Button>
              ) : null}
            </div>
          </header>

          {/* Banner vô địch */}
          {tour.status === 'FINISHED' && tour.champion ? (
            <div
              data-testid="champion-banner"
              className="flex items-center justify-center gap-3 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-yellow-400/10 to-amber-500/15 px-6 py-5 text-center"
            >
              <Trophy className="size-8 text-amber-500" aria-hidden />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  Đội vô địch
                </p>
                <p className="text-lg font-extrabold">{tour.champion.name}</p>
              </div>
            </div>
          ) : null}

          {/* Bracket theo cột round */}
          <section aria-label="Bảng đấu">
            {rounds.length === 0 ? (
              <Card className="rounded-xl border-dashed">
                <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                  <Trophy className="size-8 text-muted-foreground/40" aria-hidden />
                  <p className="text-sm text-muted-foreground">
                    Bảng đấu sẽ tự sinh khi giải khởi động.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-stretch gap-6 overflow-x-auto pb-2">
                {rounds.map(({ roundNumber, matches }, ri) => (
                  <div key={roundNumber} className="min-w-[230px] flex-1">
                    <h2 className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {roundLabel(roundNumber)}
                    </h2>
                    <div className="flex h-[calc(100%-1.75rem)] flex-col justify-around gap-4">
                      {matches.map((match) => (
                        <BracketMatchCard
                          key={match.id}
                          match={match}
                          canManage={canManage}
                          hasLeft={ri > 0}
                          hasRight={ri < rounds.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Đội đã đăng ký */}
          {tour.teams.length > 0 ? (
            <section aria-label="Các đội tham dự">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Đội tham dự ({tour.teams.length})
              </h2>
              <ul className="flex flex-wrap gap-2">
                {tour.teams.map((entry) => (
                  <li key={entry.id}>
                    <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                      {entry.seed !== null ? (
                        <span className="font-score text-primary">#{entry.seed}</span>
                      ) : null}
                      {entry.team.name}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
