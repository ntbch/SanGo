/**
 * Trang đích cho link mời đội (S2-F1): /dashboard/teams/join?team=<teamId>.
 * Link được copy 1 chạm từ trang chi tiết đội — người nhận mở ra thấy trước
 * thông tin đội và trạng thái tham gia của mình thay vì lỗi "không tìm thấy".
 */
import { ArrowLeft, Check, Clock, Info, Trophy, Users } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { useMyTeams, useTeam } from '../queries';

const SPORT_LABELS: Record<string, string> = {
  PICKLEBALL: 'Pickleball',
  BADMINTON: 'Cầu lông',
  TENNIS: 'Tennis',
  FOOTBALL5: 'Bóng đá',
  FOOTBALL7: 'Bóng đá',
};

export function TeamJoinPage(): ReactElement {
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get('team') ?? '';
  const teamQuery = useTeam(teamId || undefined);
  const myTeamsQuery = useMyTeams();

  const team = teamQuery.data;
  const membership = (myTeamsQuery.data ?? []).find((m) => m.team.id === teamId);

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1 text-xs text-muted-foreground"
      >
        <Link to="/dashboard/teams">
          <ArrowLeft className="size-3.5" aria-hidden /> Danh sách đội của tôi
        </Link>
      </Button>

      {!teamId ? (
        <Card className="rounded-xl border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Info className="size-8 text-muted-foreground/40" aria-hidden />
            <p className="font-medium">Liên kết mời không hợp lệ</p>
            <p className="text-sm text-muted-foreground">
              Link thiếu mã đội. Hãy nhờ đội trưởng gửi lại link mời đầy đủ.
            </p>
          </CardContent>
        </Card>
      ) : teamQuery.isPending ? (
        <Card className="rounded-xl border-border/60">
          <CardContent className="space-y-3 p-6">
            <Skeleton className="size-14 rounded-xl" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ) : teamQuery.isError || !team ? (
        <Card className="rounded-xl border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Info className="size-8 text-muted-foreground/40" aria-hidden />
            <p className="font-medium">Không tìm thấy đội thể thao</p>
            <p className="text-sm text-muted-foreground">
              Đội có thể đã bị giải tán hoặc link không đúng.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl border-border/60">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-3.5">
              <div className="flex size-14 items-center justify-center rounded-xl bg-primary/15">
                <Trophy className="size-7 text-primary" aria-hidden />
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight">{team.name}</h1>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge variant="outline">{SPORT_LABELS[team.sportType] ?? team.sportType}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Đội trưởng: <strong>{team.captain.fullName}</strong>
                  </span>
                </div>
              </div>
            </div>

            {team.description ? (
              <p className="text-sm text-muted-foreground">{team.description}</p>
            ) : null}

            {membership?.status === 'ACTIVE' ? (
              <div className="space-y-3 rounded-lg bg-emerald-500/10 p-4">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  <Check className="size-4" aria-hidden /> Bạn đã là thành viên của đội này
                </p>
                <Button asChild className="w-full rounded-lg font-bold">
                  <Link to={`/dashboard/teams/${team.id}`}>Vào trang đội</Link>
                </Button>
              </div>
            ) : membership?.status === 'PENDING' ? (
              <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
                Lời mời vào đội đã ghi nhận và đang chờ đội trưởng duyệt.
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
                <Users className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  Bạn chưa là thành viên. Hiện đội mời thành viên qua đội trưởng — hãy nhắn{' '}
                  <strong className="text-foreground/80">{team.captain.fullName}</strong> thêm bạn
                  vào đội (theo email tài khoản SanGo), sau đó trạng thái sẽ cập nhật tại đây.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
