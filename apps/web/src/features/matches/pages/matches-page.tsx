/**
 * Trang Ghép trận mở /matches (§3.11) — public: xem danh sách, đăng nhập để tham gia.
 * Card kiểu Athletic Synergy: sân, ngày giờ (font-score), ~giá/người, avatar chủ đơn,
 * badge X/Y người cần, nút Tham gia bg-turf / Rời ghép outline.
 */
import { Clock, Users } from 'lucide-react';
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

/** Grid danh sách trận: dừng ở lg:grid-cols-3 vì card dày thông tin (giờ + giá + CTA). */
const MATCH_GRID = 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3';

function MatchCard(options: {
  item: OpenMatchItem;
  joined: boolean;
  onJoin: (item: OpenMatchItem) => void;
  onLeave: (item: OpenMatchItem) => void;
  busy: boolean;
}): ReactElement {
  const { item, joined, onJoin, onLeave, busy } = options;
  return (
    <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow duration-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground"
            >
              {hostInitial(item.hostName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-tight">{item.courtName}</p>
              <p className="truncate text-xs text-muted-foreground">Chủ đơn: {item.hostName}</p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="shrink-0 rounded-full px-2.5 py-1 font-score text-[10px] uppercase tracking-wide"
          >
            {MATCH_SPORT_LABELS[item.sportType] ?? item.sportType}
          </Badge>
        </div>

        {/* Ngày giờ chơi — dữ liệu kỹ thuật ghi font-score theo label-caps */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4 shrink-0" aria-hidden />
          <p className="min-w-0 truncate">
            {item.date} ·{' '}
            <span className="font-score text-xs font-semibold uppercase tracking-widest text-foreground">
              {minutesToTime(item.startMinute)} – {minutesToTime(item.endMinute)}
            </span>
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          ~giá/người:{' '}
          <strong className="text-base font-extrabold text-primary">
            {estimatePerPerson(item).toLocaleString('vi-VN')}
          </strong>
          <span className="text-xs font-medium">₫</span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-dashed border-border/60 pt-3">
          <span
            data-testid="joined-count"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-score text-xs font-semibold uppercase tracking-wide',
              joined ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground',
            )}
          >
            <Users className="size-3.5" aria-hidden />
            {formatJoinedCount(item.joinedCount, item.slotsNeeded)}
          </span>
          {joined ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg font-semibold"
              disabled={busy}
              onClick={() => onLeave(item)}
            >
              Rời ghép
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => onJoin(item)}
              className="rounded-lg bg-turf font-bold text-navy-deep shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow hover:bg-turf-bright hover:shadow-[0_12px_30px_rgba(15,23,42,0.1)]"
            >
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
    <div className="space-y-6 md:space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ghép trận mở</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Các đơn đã xác nhận đang tìm người chơi cùng — tham gia đủ thì khoá đơn.
        </p>
      </header>

      {/* Thanh filter dạng card A2: control cao h-12, các cụm cách nhau gap-3–gap-4 */}
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3 rounded-xl border border-border/60 bg-card p-4 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
        <div className="w-full space-y-1.5 sm:w-52">
          <Label htmlFor="mt-sport" className="text-sm font-semibold">
            Loại sân
          </Label>
          <select
            id="mt-sport"
            value={sportType}
            onChange={(event) => setSportType(event.target.value)}
            className="h-12 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Tất cả</option>
            {(Object.keys(MATCH_SPORT_LABELS) as MatchSportType[]).map((key) => (
              <option key={key} value={key}>
                {MATCH_SPORT_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full space-y-1.5 sm:w-44">
          <Label htmlFor="mt-date" className="text-sm font-semibold">
            Ngày chơi
          </Label>
          <Input
            id="mt-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-12 rounded-lg bg-background"
          />
        </div>
      </div>

      {matchesQuery.isPending ? (
        <div
          className={MATCH_GRID}
          aria-busy="true"
          aria-label="Đang tải trận mở"
        >
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : matchesQuery.isError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {friendlyApiMessage(matchesQuery.error)}
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed py-10 text-center">
          <Users className="mx-auto mb-2 size-8 text-muted-foreground/50" aria-hidden />
          <p className="text-sm text-muted-foreground">Chưa có trận mở nào phù hợp bộ lọc.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Thử chọn loại sân khác hoặc xoá bộ lọc ngày để xem thêm trận nhé.
          </p>
        </div>
      ) : (
        <div className={MATCH_GRID}>
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
