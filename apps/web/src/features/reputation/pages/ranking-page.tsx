/** Trang Bảng xếp hạng uy tín (F2) — top N theo score, highlight chính mình. */
import { Medal, Trophy } from 'lucide-react';
import type { ReactElement } from 'react';

import { Badge } from '../../../components/ui/badge';
import { Card, CardContent } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { usePageMeta } from '../../../lib/seo';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { cn } from '../../../lib/utils';
import { UserAvatar } from '../../profile/components/user-avatar';
import { useLeaderboard } from '../queries';

function rankStyle(rank: number): string {
  if (rank === 1) return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
  if (rank === 2) return 'bg-slate-400/20 text-slate-600 dark:text-slate-300';
  if (rank === 3) return 'bg-orange-500/15 text-orange-600 dark:text-orange-400';
  return 'bg-muted text-muted-foreground';
}

export function RankingPage(): ReactElement {
  const me = useAuthStore((state) => state.user);
  const boardQuery = useLeaderboard(20);
  const entries = boardQuery.data?.items ?? [];

  usePageMeta(
    'Bảng xếp hạng uy tín',
    'Xếp hạng người chơi SanGo theo điểm uy tín: đúng giờ, hủy sát giờ và no-show.',
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
          <Trophy className="size-6 text-primary" aria-hidden />
          Bảng xếp hạng uy tín
        </h1>
        <p className="text-sm text-muted-foreground">
          Điểm tính từ lịch sử đặt sân: check-in đúng giờ cộng điểm, hủy sát giờ và no-show trừ
          điểm.
        </p>
      </header>

      <Card className="rounded-xl border-border/60 p-0">
        <CardContent className="p-0">
          {boardQuery.isPending ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : boardQuery.isError ? (
            <div className="p-6 text-center text-sm text-destructive">
              Không tải được bảng xếp hạng. {friendlyApiMessage(boardQuery.error)}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <Medal className="size-8 text-muted-foreground/40" aria-hidden />
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu xếp hạng.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Hạng</TableHead>
                  <TableHead>Thành viên</TableHead>
                  <TableHead>Điểm uy tín</TableHead>
                  <TableHead className="text-right">Đúng giờ / No-show</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, index) => {
                  const rank = index + 1;
                  const isMe = entry.isMe === true || entry.userId === me?.id;
                  return (
                    <TableRow
                      key={entry.userId}
                      data-testid="leaderboard-row"
                      aria-current={isMe ? 'true' : undefined}
                      className={cn(isMe && 'bg-primary/5')}
                    >
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex size-7 items-center justify-center rounded-full text-xs font-extrabold',
                            rankStyle(rank),
                          )}
                        >
                          {rank}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            fullName={entry.fullName}
                            avatarUrl={entry.avatarUrl ?? undefined}
                            size={32}
                          />
                          <span className="font-medium">{entry.fullName}</span>
                          {isMe ? <Badge>Bạn</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-score text-base font-bold">{entry.score}</span>
                          <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:block">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.max(0, Math.min(100, entry.score))}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-score text-sm">
                        {entry.breakdown.onTimeCheckIns} / {entry.breakdown.noShows}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
