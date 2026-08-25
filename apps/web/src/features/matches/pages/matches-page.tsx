/**
 * Trang Ghép trận mở /matches (§3.11) — public: xem danh sách, đăng nhập để tham gia.
 * Card: sân, ngày giờ, ~giá/người, avatar chủ đơn, X/Y người, nút Tham gia/Rời.
 */
import { Users } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Skeleton } from '../../../components/ui/skeleton';
import { useToast } from '../../../components/ui/use-toast';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { cn } from '../../../lib/utils';
import { minutesToTime } from '../../public/format';

import { formatJoinedCount, hostInitial } from '../match-utils';
import { useJoinMatch, useLeaveMatch, useOpenMatches } from '../queries';
import type { MatchSportType, OpenMatchItem } from '../types';

export const MATCH_SPORT_LABELS: Record<MatchSportType, string> = {
  FOOTBALL5: 'Bóng đá 5 người',
  FOOTBALL7: 'Bóng đá 7 người',
  PICKLEBALL: 'Pickleball',
  BADMINTON: 'Cầu lông',
  TENNIS: 'Tennis',
};
/**
 * ~Giá/người ước tính: chủ đơn cũng chơi nên chia đều cho slotsNeeded + 1 người.
 * Người tham gia vẫn trả chủ đơn ngoài hệ thống theo giới hạn §3.11.
 */
function estimatePerPerson(item: OpenMatchItem): number {
  const heads = item.slotsNeeded + 1;
  return heads > 0 ? Math.round(item.subtotal / heads) : item.subtotal;
}

function MatchCard(options: {
  item: OpenMatchItem;
  joined: boolean;
  onJoin: (item: OpenMatchItem) => void;
  onLeave: (item: OpenMatchItem) => void;
  busy: boolean;
}): ReactElement {
  const { item, joined, onJoin, onLeave, busy } = options;
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary"
            >
              {hostInitial(item.hostName)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold">{item.courtName}</p>
              <p className="text-xs text-muted-foreground truncate">Chủ đơn: {item.hostName}</p>
            </div>
          </div>
          <Badge variant="secondary">{MATCH_SPORT_LABELS[item.sportType] ?? item.sportType}</Badge>
        </div>

        <div className="text-sm text-muted-foreground space-y-0.5">
          <p>
            {item.date} · {minutesToTime(item.startMinute)} – {minutesToTime(item.endMinute)}
          </p>
          <p>
            ~giá/người:{' '}
            <strong className="text-foreground">
              {estimatePerPerson(item).toLocaleString('vi-VN')}₫
            </strong>
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span
            data-testid="joined-count"
            className={cn('text-sm font-semibold', joined && 'text-primary')}
          >
            {formatJoinedCount(item.joinedCount, item.slotsNeeded)}
          </span>
          {joined ? (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => onLeave(item)}>
              Rời ghép
            </Button>
          ) : (
            <Button size="sm" disabled={busy} onClick={() => onJoin(item)}>
              Tham gia
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
/** Trang /matches — danh sách trận mở + filter loại sân/ngày. */
export function MatchesPage(): ReactElement {
  const [sportType, setSportType] = useState<string>('');
  const [date, setDate] = useState<string>('');
  // Đơn người dùng hiện tại đã tham gia (theo phiên; backend không trả cờ viewer).
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const matchesQuery = useOpenMatches({ sportType, date });
  const joinMutation = useJoinMatch();
  const leaveMutation = useLeaveMatch();
  const busy = joinMutation.isPending || leaveMutation.isPending;
  const items = matchesQuery.data?.items ?? [];

  const requireLogin = (): boolean => {
    if (user) return false;
    toast({ title: 'Yêu cầu đăng nhập', description: 'Đăng nhập để tham gia ghép trận.' });
    navigate('/login?next=' + encodeURIComponent(location.pathname + location.search));
    return true;
  };

  const handleJoin = async (item: OpenMatchItem) => {
    if (requireLogin()) return;
    try {
      await joinMutation.mutateAsync(item.bookingId);
      setJoinedIds((prev) => new Set(prev).add(item.bookingId));
      toast({ title: 'Đã tham gia ghép trận', description: 'Liên hệ chủ đơn để chốt thanh toán.' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Không thể tham gia',
        description: friendlyApiMessage(err),
      });
    }
  };

  const handleLeave = async (item: OpenMatchItem) => {
    if (requireLogin()) return;
    try {
      await leaveMutation.mutateAsync(item.bookingId);
      setJoinedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.bookingId);
        return next;
      });
      toast({ title: 'Bạn đã rời ghép trận.' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Không thể rời ghép',
        description: friendlyApiMessage(err),
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold">Ghép trận mở</h1>
        <p className="text-sm text-muted-foreground">
          Các đơn đã xác nhận đang tìm người chơi cùng — tham gia đủ thì khoá đơn.
        </p>
      </header>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48 space-y-1.5">
          <Label htmlFor="mt-sport">Loại sân</Label>
          <select
            id="mt-sport"
            value={sportType}
            onChange={(event) => setSportType(event.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Tất cả</option>
            {(Object.keys(MATCH_SPORT_LABELS) as MatchSportType[]).map((key) => (
              <option key={key} value={key}>
                {MATCH_SPORT_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="w-44 space-y-1.5">
          <Label htmlFor="mt-date">Ngày chơi</Label>
          <Input
            id="mt-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
      </div>

      {matchesQuery.isPending ? (
        <div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Đang tải trận mở"
        >
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : matchesQuery.isError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {friendlyApiMessage(matchesQuery.error)}
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center space-y-3">
          <Users className="mx-auto size-10 text-muted-foreground/40" aria-hidden />
          <p className="text-sm text-muted-foreground">Chưa có trận mở nào phù hợp bộ lọc.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <MatchCard
              key={item.bookingId}
              item={item}
              joined={joinedIds.has(item.bookingId)}
              onJoin={(it) => void handleJoin(it)}
              onLeave={(it) => void handleLeave(it)}
              busy={busy}
            />
          ))}
        </div>
      )}
    </div>
  );
}
