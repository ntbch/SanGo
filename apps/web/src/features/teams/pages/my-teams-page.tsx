/** Trang 'Đội của tôi' (F1) — danh sách các đội tôi tham gia + tạo đội mới. */
import { Plus, Trophy, Users } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { Badge, type BadgeProps } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { useMyTeams } from '../queries';

const SPORT_LABELS: Record<string, string> = {
  PICKLEBALL: 'Pickleball',
  BADMINTON: 'Cầu lông',
  TENNIS: 'Tennis',
  FOOTBALL5: 'Bóng đá',
  FOOTBALL7: 'Bóng đá',
};

function statusBadge(status: string): { label: string; variant: BadgeProps['variant'] } | null {
  if (status === 'PENDING') return { label: 'Chờ duyệt', variant: 'warning' };
  return null;
}

export function MyTeamsPage(): ReactElement {
  const teamsQuery = useMyTeams();

  const items = teamsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Đội của tôi</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý đội nhóm, thành viên và sổ quỹ chia tiền.
          </p>
        </div>
        <Button asChild className="rounded-lg font-bold">
          <Link to="/dashboard/teams/new">
            <Plus className="size-4" aria-hidden /> Tạo đội mới
          </Link>
        </Button>
      </header>

      {teamsQuery.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="rounded-xl border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="size-10 text-muted-foreground/50" aria-hidden />
            <p className="font-medium">Bạn chưa tham gia đội nào</p>
            <p className="text-sm text-muted-foreground">
              Tạo đội mới hoặc chờ đội trưởng mời qua link để bắt đầu chơi cùng nhau.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((membership) => {
            const pending = statusBadge(membership.status);
            return (
              <Link key={membership.membershipId} to={`/dashboard/teams/${membership.team.id}`}>
                <Card className="h-full rounded-xl border-border/60 transition-shadow hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                  <CardContent className="flex h-full flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex size-11 items-center justify-center rounded-lg bg-primary/15">
                        <Trophy className="size-5 text-primary" aria-hidden />
                      </div>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Badge variant="outline">
                          {SPORT_LABELS[membership.team.sportType] ?? membership.team.sportType}
                        </Badge>
                        {pending ? <Badge variant={pending.variant}>{pending.label}</Badge> : null}
                        {membership.role === 'CAPTAIN' ? <Badge>Đội trưởng</Badge> : null}
                      </div>
                    </div>

                    <div>
                      <h2 className="font-bold leading-snug">{membership.team.name}</h2>
                      {membership.team.description ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {membership.team.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5" aria-hidden />
                        {membership.team.memberCount} thành viên
                      </span>
                      <span>
                        Đội trưởng:{' '}
                        <strong className="text-foreground/80">
                          {membership.team.captain.fullName}
                        </strong>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
