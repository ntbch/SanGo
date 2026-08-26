/** Trang công khai danh sách giải đấu (F7). */
import { Plus, Trophy } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { usePageMeta } from '../../../lib/seo';
import { CreateTournamentDialog } from '../components/create-tournament-dialog';
import { TournamentStatusBadge } from '../components/status-badge';
import { useTournaments } from '../queries';

const SPORT_LABELS: Record<string, string> = {
  PICKLEBALL: 'Pickleball',
  BADMINTON: 'Cầu lông',
  TENNIS: 'Tennis',
  FOOTBALL5: 'Bóng đá 5',
  FOOTBALL7: 'Bóng đá 7',
};

export function TournamentsPage(): ReactElement {
  const me = useAuthStore((state) => state.user);
  const boardQuery = useTournaments();
  const [createOpen, setCreateOpen] = useState(false);

  usePageMeta(
    'Giải đấu CourtHub',
    'Các giải đấu thể thao loại trực tiếp — theo dõi bảng đấu, kết quả và đội vô địch.',
  );

  const items = boardQuery.data ?? [];
  const canCreate = me?.role === 'OWNER' || me?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
            <Trophy className="size-6 text-primary" aria-hidden />
            Giải đấu
          </h1>
          <p className="text-sm text-muted-foreground">
            Các giải đấu loại trực tiếp — theo dõi bảng đấu và đội vô địch.
          </p>
        </div>
        {canCreate ? (
          <Button className="rounded-lg font-bold" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden /> Tạo giải mới
          </Button>
        ) : null}
      </header>

      {boardQuery.isPending ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : boardQuery.isError ? (
        <Card className="rounded-xl border-destructive/30 bg-destructive/10">
          <CardContent className="p-6 text-center text-sm text-destructive">
            Không tải được danh sách giải đấu.
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="rounded-xl border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Trophy className="size-10 text-muted-foreground/50" aria-hidden />
            <p className="font-medium">Chưa có giải đấu nào</p>
            <p className="text-sm text-muted-foreground">
              Chủ sân / quản trị viên tạo giải, captain đăng ký đội để bắt đầu.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((tour) => (
            <Link key={tour.id} to={`/tournaments/${tour.id}`} className="block h-full">
              <Card className="h-full rounded-xl border-border/60 transition-shadow hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                <CardContent className="flex h-full flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-bold leading-snug">{tour.name}</h2>
                    <TournamentStatusBadge status={tour.status} />
                  </div>

                  {tour.description ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{tour.description}</p>
                  ) : null}

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">
                      {SPORT_LABELS[tour.sportType] ?? tour.sportType}
                    </Badge>
                    <span data-testid="team-count">
                      {tour.teamCount}/{tour.maxTeams} đội
                    </span>
                    {tour.champion ? (
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        🏆 {tour.champion.name}
                      </span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateTournamentDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
