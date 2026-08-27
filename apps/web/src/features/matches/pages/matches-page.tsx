import {
  Clock,
  MessageSquare,
  Send,
  Star,
  Users,
} from 'lucide-react';
import { useState, useMemo, type ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Skeleton } from '../../../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { useToast } from '../../../components/ui/use-toast';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { formatVnd, minutesToTime, formatDate } from '../../public/format';
import { HANOI_DISTRICTS } from '@sango/shared';

import { hostInitial } from '../match-utils';
import { useJoinMatch, useLeaveMatch, useOpenMatches } from '../queries';
import type { OpenMatchItem } from '../types';

export const MATCH_SPORT_LABELS: Record<string, string> = {
  ALL: 'Tất cả môn',
  FOOTBALL5: 'Bóng đá',
  FOOTBALL7: 'Bóng đá',
  FOOTBALL: 'Bóng đá',
  PICKLEBALL: 'Pickleball',
  BADMINTON: 'Cầu lông',
  TENNIS: 'Tennis',
};

const SKILL_LEVELS = [
  { id: '', label: 'Tất cả cấp độ' },
  { id: 'FUN', label: 'Vui vẻ / Dưỡng sinh (DUPR 2.0-2.5 / NTRP 2.0)' },
  { id: 'CASUAL', label: 'Giao lưu vừa sức (DUPR 3.0-3.5 / NTRP 3.0-3.5)' },
  { id: 'COMPETITIVE', label: 'Cọ xát / Chiến thuật (DUPR 4.0-4.5 / NTRP 4.0)' },
  { id: 'SEMI_PRO', label: 'Bán chuyên / Nâng cao (DUPR 5.0+ / NTRP 4.5+)' },
];

interface CommentItem {
  id: string;
  userName: string;
  avatarLetter: string;
  content: string;
  createdAt: string;
}

function estimatePerPerson(item: OpenMatchItem): number {
  const heads = item.slotsNeeded + 1;
  return heads > 0 ? Math.round(item.subtotal / heads) : item.subtotal;
}

function MatchCard(options: {
  item: OpenMatchItem;
  joined: boolean;
  onJoin: (item: OpenMatchItem) => void;
  onLeave: (item: OpenMatchItem) => void;
  onOpenComments: (item: OpenMatchItem) => void;
  busy: boolean;
}): ReactElement {
  const { item, joined, onJoin, onLeave, onOpenComments, busy } = options;
  const isFull = item.joinedCount >= item.slotsNeeded;
  const perPerson = estimatePerPerson(item);
  const remaining = Math.max(0, item.slotsNeeded - item.joinedCount);

  return (
    <Card className="rounded-2xl border-border/70 bg-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
      <CardContent className="flex flex-col gap-4 p-5 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary text-base shadow-xs"
            >
              {hostInitial(item.hostName)}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-bold text-foreground">{item.hostName}</p>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.2 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  <Star className="size-2.5 fill-amber-400 text-amber-400" /> 96
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">Chủ kèo trận</p>
            </div>
          </div>

          <Badge
            variant={isFull ? 'secondary' : 'default'}
            className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          >
            {isFull ? 'Đã đủ người' : 'Đang tìm người'}
          </Badge>
        </div>

        <div className="space-y-1.5 rounded-xl bg-muted/40 p-3 text-xs">
          <div className="flex items-center justify-between font-semibold text-foreground">
            <span className="truncate">{item.courtName}</span>
            <Badge variant="outline" className="text-[10px] shrink-0 font-normal">
              {MATCH_SPORT_LABELS[item.sportType] ?? item.sportType}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
            <Clock className="size-3.5 shrink-0 text-primary" />
            <span>
              {formatDate(item.date)} ·{' '}
              <strong className="text-foreground">
                {minutesToTime(item.startMinute)} – {minutesToTime(item.endMinute)}
              </strong>
            </span>
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Slot tham gia:</span>
            <span data-testid="joined-count" className="font-score font-bold text-primary">
              {item.joinedCount}/{item.slotsNeeded} người
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {remaining > 0 ? `Còn trống ${remaining} vị trí` : 'Đã đủ số người tham gia'}
          </p>
        </div>

        <div className="flex items-baseline justify-between border-t border-border/60 pt-3">
          <span className="text-xs text-muted-foreground">Chi phí dự kiến:</span>
          <div>
            <span className="font-mono text-base font-extrabold tracking-tight text-primary">
              {formatVnd(perPerson)}
            </span>
            <span className="text-[11px] text-muted-foreground"> / người</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenComments(item)}
            className="h-8 rounded-xl text-xs text-muted-foreground hover:text-foreground gap-1 px-2.5"
          >
            <MessageSquare className="size-3.5" />
            <span>Bình luận</span>
          </Button>

          {joined ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10"
              disabled={busy}
              onClick={() => onLeave(item)}
            >
              Rời kèo
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={busy || isFull}
              onClick={() => onJoin(item)}
              className="h-8 rounded-xl text-xs font-bold px-4 shadow-xs"
            >
              {isFull ? 'Đã đủ người' : 'Tham gia'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MatchesPage(): ReactElement {
  const [sportType, setSportType] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [skillLevel, setSkillLevel] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  const [commentTarget, setCommentTarget] = useState<OpenMatchItem | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentItem[]>>({
    default: [
      {
        id: 'c1',
        userName: 'Trần Văn Minh',
        avatarLetter: 'M',
        content: 'Kèo này còn thiếu vị trí nào vậy chủ kèo?',
        createdAt: '15 phút trước',
      },
      {
        id: 'c2',
        userName: 'Nguyễn Hoàng',
        avatarLetter: 'H',
        content: 'Mình đá vị trí Tiền đạo cánh trái, vừa bấm tham gia nhé!',
        createdAt: '8 phút trước',
      },
    ],
  });
  const [draftComment, setDraftComment] = useState('');

  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const matchesQuery = useOpenMatches({
    ...(sportType === 'FOOTBALL' ? { sportGroup: 'FOOTBALL' } : { sportType }),
    date,
  });
  const joinMutation = useJoinMatch();
  const leaveMutation = useLeaveMatch();
  const busy = joinMutation.isPending || leaveMutation.isPending;
  const rawItems = matchesQuery.data?.items ?? [];

  const filteredItems = useMemo(() => {
    return rawItems.filter((item) => {
      if (timeRange === 'morning' && item.startMinute >= 720) return false;
      if (timeRange === 'afternoon' && (item.startMinute < 720 || item.startMinute >= 1020)) return false;
      if (timeRange === 'evening' && item.startMinute < 1020) return false;
      return true;
    });
  }, [rawItems, timeRange]);

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
      toast({
        title: 'Đã tham gia ghép trận!',
        description: 'Vui lòng đến sân đúng giờ và trao đổi tiền sân với chủ kèo.',
      });
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

  const handleAddComment = () => {
    if (!draftComment.trim() || !commentTarget) return;
    if (requireLogin()) return;

    const key = commentTarget.bookingId;
    const current = commentsMap[key] ?? commentsMap['default'] ?? [];
    const newComment: CommentItem = {
      id: String(Date.now()),
      userName: user?.fullName ?? 'Tôi',
      avatarLetter: (user?.fullName || 'T').charAt(0).toUpperCase(),
      content: draftComment.trim(),
      createdAt: 'Vừa xong',
    };
    setCommentsMap({
      ...commentsMap,
      [key]: [...current, newComment],
    });
    setDraftComment('');
  };

  const currentComments = useMemo(() => {
    if (!commentTarget) return [];
    return commentsMap[commentTarget.bookingId] ?? commentsMap['default'] ?? [];
  }, [commentTarget, commentsMap]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Ghép trận mở
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Các kèo đặt sân công khai đang tìm thêm đồng đội — giao lưu, cọ xát và chia sẻ chi phí sân bãi.
        </p>
      </header>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[140px]">
            <Label htmlFor="sport-type" className="text-xs font-bold text-muted-foreground mb-1 block">
              Loại sân
            </Label>
            <select
              id="sport-type"
              aria-label="Loại sân"
              value={sportType}
              onChange={(e) => setSportType(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
            >
              <option value="">Tất cả môn</option>
              <option value="FOOTBALL">Bóng đá</option>
              <optgroup label="Bóng đá chi tiết">
                <option value="FOOTBALL5">Bóng đá 5</option>
                <option value="FOOTBALL7">Bóng đá 7</option>
              </optgroup>
              <option value="BADMINTON">Cầu lông</option>
              <option value="PICKLEBALL">Pickleball</option>
              <option value="TENNIS">Tennis</option>
            </select>
          </div>

          <div className="flex-1 min-w-[140px]">
            <Label htmlFor="district-select" className="text-xs font-bold text-muted-foreground mb-1 block">
              Khu vực
            </Label>
            <select
              id="district-select"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
            >
              <option value="">Tất cả khu vực</option>
              {HANOI_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[140px]">
            <Label htmlFor="skill-level" className="text-xs font-bold text-muted-foreground mb-1 block">
              Cấp độ trận
            </Label>
            <select
              id="skill-level"
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
            >
              {SKILL_LEVELS.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[140px]">
            <Label htmlFor="time-range" className="text-xs font-bold text-muted-foreground mb-1 block">
              Khung giờ
            </Label>
            <select
              id="time-range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
            >
              <option value="">Tất cả khung giờ</option>
              <option value="morning">Sáng (Trước 12:00)</option>
              <option value="afternoon">Chiều (12:00 – 17:00)</option>
              <option value="evening">Tối (Sau 17:00)</option>
            </select>
          </div>

          <div className="flex-1 min-w-[140px]">
            <Label htmlFor="match-date" className="text-xs font-bold text-muted-foreground mb-1 block">
              Ngày đá
            </Label>
            <Input
              id="match-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 rounded-xl text-xs"
            />
          </div>
        </div>

        {/* Quick Sport Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          {[
            { id: '', label: 'Tất cả' },
            { id: 'FOOTBALL', label: '⚽ Bóng đá' },
            { id: 'PICKLEBALL', label: '🏓 Pickleball' },
            { id: 'BADMINTON', label: '🏸 Cầu lông' },
            { id: 'TENNIS', label: '🎾 Tennis' },
          ].map((sport) => (
            <button
              key={sport.id}
              type="button"
              onClick={() => setSportType(sport.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                sportType === sport.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {sport.label}
            </button>
          ))}
        </div>
      </div>

      {/* Matches Grid */}
      {matchesQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-border/70 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-11 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center bg-card/40">
          <Users className="mx-auto size-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-bold text-foreground">Không có kèo ghép trận nào phù hợp</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            Hãy thử thay đổi bộ lọc hoặc quay lại sau để tìm kiếm đồng đội cùng sở thích nhé!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <MatchCard
              key={item.bookingId}
              item={item}
              joined={joinedIds.has(item.bookingId)}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onOpenComments={(match) => setCommentTarget(match)}
              busy={busy}
            />
          ))}
        </div>
      )}

      {/* Dialog Bình Luận Kèo */}
      <Dialog open={commentTarget !== null} onOpenChange={(open) => !open && setCommentTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              Bình luận kèo · {commentTarget?.courtName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Trao đổi với chủ kèo và các thành viên tham gia trước giờ bóng lăn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {currentComments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 text-xs">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary text-xs">
                    {c.avatarLetter}
                  </span>
                  <div className="flex-1 rounded-2xl bg-muted/50 p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-foreground">{c.userName}</span>
                      <span className="text-[10px] text-muted-foreground">{c.createdAt}</span>
                    </div>
                    <p className="text-foreground/90">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border/60">
              <Input
                placeholder="Nhập nội dung trao đổi hoặc hỏi vị trí..."
                value={draftComment}
                onChange={(e) => setDraftComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                className="rounded-xl text-xs"
              />
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={!draftComment.trim()}
                className="rounded-xl font-bold h-9 px-3 gap-1 shadow-xs"
              >
                <Send className="size-3.5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
