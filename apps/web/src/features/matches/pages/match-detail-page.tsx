import React from 'react';
import { useParams } from 'react-router-dom';
import {
  getMatchDetailApi,
  createJoinRequestApi,
  listJoinRequestsApi,
  reviewJoinRequestApi,
  listMatchCommentsApi,
  createMatchCommentApi,
  type OpenMatch,
  type MatchParticipant,
  type MatchComment,
} from '../api/matches-api';
import { joinOpenMatchApi } from '../../booking/api/booking-api';
import { useAuthStore } from '../../../lib/auth-store';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Users, UserCheck, MapPin, Calendar } from 'lucide-react';
import { cn, formatVND } from '../../../lib/utils';
import { MatchDetailHero } from '../components/match-detail-hero';
import { MatchParticipantsList } from '../components/match-participants-list';
import { MatchCommentsSection } from '../components/match-comments-section';
import { MatchJoinRequestCard } from '../components/match-join-request-card';
import { MatchPendingRequestsCard } from '../components/match-pending-requests-card';
import { PageContainer } from '../../../components/layout/page-container';

export function MatchDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [match, setMatch] = React.useState<OpenMatch | null>(null);
  const [requests, setRequests] = React.useState<MatchParticipant[]>([]);
  const [comments, setComments] = React.useState<MatchComment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Form State: Join Request
  const [preferredPosition, setPreferredPosition] = React.useState('Tiền đạo');
  const [joinNote, setJoinNote] = React.useState('');
  const [joinMsg, setJoinMsg] = React.useState<string | null>(null);

  // P5a.3 O1: tham gia trực tiếp + UX 409 APPROVAL_REQUIRED
  const [isJoiningDirect, setIsJoiningDirect] = React.useState(false);
  const [directJoinMsg, setDirectJoinMsg] = React.useState<{ type: 'success' | 'warn' | 'error'; text: string } | null>(null);

  // Form State: Comment
  const [commentContent, setCommentContent] = React.useState('');
  const [isPostingComment, setIsPostingComment] = React.useState(false);

  const fetchMatchData = React.useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [matchData, reqData, cmtData] = await Promise.all([
        getMatchDetailApi(id),
        listJoinRequestsApi(id),
        listMatchCommentsApi(id),
      ]);
      setMatch(matchData);
      setRequests(Array.isArray(reqData) ? reqData : []);
      setComments(Array.isArray(cmtData) ? cmtData : []);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchMatchData();
  }, [fetchMatchData]);

  const handleSendJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await createJoinRequestApi(id, { preferredPosition, note: joinNote });
      setJoinMsg('Đã gửi yêu cầu tham gia tới chủ kèo!');
      setJoinNote('');
      setTimeout(() => {
        setJoinMsg(null);
        fetchMatchData();
      }, 1500);
    } catch {
      setJoinMsg('Gửi yêu cầu thất bại');
    }
  };

  // P5a.3 O1: join trực tiếp. 409 APPROVAL_REQUIRED -> hướng dẫn + CTA dẫn tới form join-request.
  const handleDirectJoin = async () => {
    if (!id) return;
    setIsJoiningDirect(true);
    setDirectJoinMsg(null);
    try {
      const res = await joinOpenMatchApi(id);
      setDirectJoinMsg({
        type: 'success',
        text: `Đã tham gia kèo thành công! (${res.joinedCount ?? '?'}/${res.slotsNeeded ?? '?'} slot)`,
      });
      fetchMatchData();
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code === 'APPROVAL_REQUIRED') {
        setDirectJoinMsg({
          type: 'warn',
          text: 'Kèo này cần chủ kèo duyệt. Gửi yêu cầu ở khung bên dưới.',
        });
        document.getElementById('join-request-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (code === 'MATCH_FULL') {
        setDirectJoinMsg({ type: 'error', text: 'Kèo đã đủ người tham gia.' });
      } else if (code === 'ALREADY_JOINED') {
        setDirectJoinMsg({ type: 'warn', text: 'Bạn đã tham gia kèo này rồi.' });
      } else if (code === 'JOIN_NOT_ALLOWED') {
        setDirectJoinMsg({ type: 'error', text: 'Kèo này hiện không mở ghép trận.' });
      } else {
        setDirectJoinMsg({ type: 'error', text: err?.message || 'Không thể tham gia kèo. Thử lại.' });
      }
    } finally {
      setIsJoiningDirect(false);
    }
  };

  const handleReviewRequest = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!id) return;
    await reviewJoinRequestApi(id, requestId, { status });
    fetchMatchData();
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentContent.trim()) return;
    setIsPostingComment(true);
    try {
      const newCmt = await createMatchCommentApi(id, { content: commentContent });
      setComments((prev) => [...prev, newCmt]);
      setCommentContent('');
    } finally {
      setIsPostingComment(false);
    }
  };

  if (isLoading || !match) {
    return (
      <PageContainer className="space-y-6 sm:space-y-8" aria-busy="true" aria-label="Đang tải thông tin kèo">
        {/* Calm Hero Skeleton */}
        <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card space-y-6">
          <div className="space-y-3">
            <div className="h-5 w-24 bg-muted rounded-md" />
            <div className="h-8 w-2/3 max-w-lg bg-muted rounded-lg" />
            <div className="h-4 w-1/3 max-w-sm bg-muted rounded" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/60">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 rounded-xl bg-secondary/50 border border-border/50 space-y-1.5">
                <div className="h-3 w-16 bg-muted rounded mx-auto" />
                <div className="h-5 w-20 bg-muted rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Calm 60/40 Columns Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 gap-6 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <div className="h-5 w-40 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <div className="h-5 w-32 bg-muted rounded" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-muted rounded-xl" />
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <div className="h-6 w-32 bg-muted rounded" />
              <div className="h-8 w-24 bg-muted rounded" />
              <div className="h-10 bg-muted rounded-xl" />
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  const isHost = match.hostUser?.id === user?.id;
  const total = match.totalSlots ?? 10;
  const filled = match.filledSlots ?? 0;
  const slotsLeft = Math.max(0, total - filled);
  const fillPercent = Math.min(100, Math.round((filled / total) * 100));
  const isFull = slotsLeft === 0;

  return (
    <PageContainer className="space-y-6 sm:space-y-8">
      <MatchDetailHero match={match} isHost={isHost} />

      {/* 60/40 Asymmetric Command Center Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 gap-6 items-start">
        {/* Left Column (60%): Match specs, venue address, participants, comments */}
        <div className="lg:col-span-7 space-y-6" data-testid="match-main-column">
          <Card className="p-6 border border-border bg-card rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h3 className="text-base font-black text-foreground">Thông Số &amp; Quy Định Kèo</h3>
              <span className="px-2.5 py-0.5 rounded-md bg-secondary text-foreground text-[10px] font-mono-num font-bold uppercase tracking-wider border border-border">
                {match.sportType || 'THỂ THAO'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-foreground block">{match.venueName || 'Cụm Sân Thể Thao'}</span>
                  <span className="text-muted-foreground">{match.venueAddress || 'Hà Nội'}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-mono-num font-bold text-foreground block">
                    {match.date ? new Date(match.date).toLocaleDateString('vi-VN') : 'Hôm nay'} ({match.startTime || '18:00'} - {match.endTime || '19:30'})
                  </span>
                  <span className="text-muted-foreground">Trình độ: {match.skillLevel || 'Giao lưu'}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 space-y-1.5">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Ghi Chú &amp; Thể Thức Thi Đấu
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {match.description || 'Trận đấu giao lưu phong trào. Có mặt trước 15 phút để khởi động.'}
              </p>
            </div>
          </Card>

          <MatchParticipantsList participants={match.participants} />

          <MatchCommentsSection
            comments={comments}
            commentContent={commentContent}
            onCommentContentChange={setCommentContent}
            isPostingComment={isPostingComment}
            onPostComment={handlePostComment}
          />
        </div>

        {/* Right Column (40%): Sticky Action Command Card, Join/Manage */}
        <div className="lg:col-span-5 sticky top-20 space-y-6" data-testid="match-action-sidebar">
          {/* Action Card with Slot Progress & Mono Fee */}
          <Card className="p-6 border border-border bg-card rounded-2xl space-y-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Chi phí mỗi người
                </span>
                <div className="font-mono-num font-black text-2xl text-primary mt-0.5 tabular-nums">
                  {formatVND(match.costPerPerson || 65000)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Trạng thái slot
                </span>
                <div className="mt-1">
                  {isFull ? (
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono-num font-bold bg-muted text-muted-foreground border border-border">
                      Đã đủ người
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono-num font-bold bg-secondary text-foreground border border-border">
                      Còn {slotsLeft} slot
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Slot Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-num">
                <span className="text-muted-foreground">Tiến độ tuyển slot</span>
                <span className="font-bold text-foreground">
                  {filled}/{total} ({fillPercent}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isFull ? 'bg-muted-foreground/60' : slotsLeft <= 2 ? 'bg-amber-500' : 'bg-primary',
                  )}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            </div>

            {/* Direct Join Action (if match doesn't require approval and user is not host) */}
            {!isHost && match.requiresApproval !== true && (
              <div className="pt-2 border-t border-border/60 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-4 w-4 text-primary shrink-0" />
                  <span>Kèo mở tự do, vào thẳng danh sách khi còn slot.</span>
                </div>
                {directJoinMsg && (
                  <div
                    className={cn(
                      'p-3.5 rounded-xl border text-xs font-bold',
                      directJoinMsg.type === 'success' &&
                        'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
                      directJoinMsg.type === 'warn' &&
                        'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
                      directJoinMsg.type === 'error' &&
                        'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
                    )}
                    role="alert"
                  >
                    <span>{directJoinMsg.text}</span>
                  </div>
                )}
                <Button
                  className="w-full font-bold active:scale-[0.98]"
                  onClick={handleDirectJoin}
                  disabled={isJoiningDirect || isFull}
                >
                  {isJoiningDirect ? 'Đang xử lý...' : isFull ? 'Kèo đã kín slot' : 'Tham gia ngay'}
                </Button>
              </div>
            )}

            {/* Notice if approval is required */}
            {!isHost && match.requiresApproval === true && (
              <div className="pt-2 border-t border-border/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <UserCheck className="h-4 w-4 shrink-0" />
                  <span>Kèo cần chủ kèo duyệt thành viên</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Điền vị trí sở trường và gửi yêu cầu xin slot ở khung bên dưới.
                </p>
              </div>
            )}

            {/* Host indicator */}
            {isHost && (
              <div className="pt-2 border-t border-border/60">
                <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Bạn là chủ kèo của trận đấu này
                </div>
              </div>
            )}
          </Card>

          {/* Registration Card */}
          {!isHost && (
            <div id="join-request-card" className="scroll-mt-24">
              <MatchJoinRequestCard
                joinMsg={joinMsg}
                preferredPosition={preferredPosition}
                onPreferredPositionChange={setPreferredPosition}
                joinNote={joinNote}
                onJoinNoteChange={setJoinNote}
                onSubmit={handleSendJoinRequest}
              />
            </div>
          )}

          {/* Host Pending Approval Management */}
          {isHost && (
            <MatchPendingRequestsCard
              requests={requests}
              onReviewRequest={handleReviewRequest}
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
