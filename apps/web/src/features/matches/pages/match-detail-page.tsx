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
import { Users, UserCheck } from 'lucide-react';
import { cn } from '../../../lib/utils';
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
        setDirectJoinMsg({ type: 'error', text: err?.message || 'Không thể tham gia kèo. thử lại.' });
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
      <PageContainer className="py-16 text-center space-y-3">
        <div className="h-8 w-48 bg-muted rounded mx-auto animate-pulse" />
        <p className="text-xs text-muted-foreground">Đang tải thông tin kèo thi đấu...</p>
      </PageContainer>
    );
  }

  const isHost = match.hostUser?.id === user?.id;

  return (
    <PageContainer>
      <MatchDetailHero match={match} isHost={isHost} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Description, Line-up, Comments */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 border border-border/80 bg-card shadow-sm space-y-3 rounded-3xl">
            <h3 className="text-base font-black text-foreground">Ghi Chú &amp; Thể Thức Thi Đấu</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {match.description || 'Trận đấu giao lưu phong trào. có mặt trước 15 phút để khởi động.'}
            </p>
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

        {/* Right Column: Registration / Host Manage Requests */}
        <div className="lg:col-span-4 space-y-6">
          {/* P5a.3 O1: kèo DIRECT (requiresApproval null/false) — tham gia trực tiếp. */}
          {!isHost && match.requiresApproval !== true && (
            <Card className="p-6 border border-border/80 bg-card shadow-md space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Tham Gia Trực Tiếp
                </h3>
                <p className="text-xs text-muted-foreground">
                  Kèo này không cần duyệt. Còn slot là vào được ngay.
                </p>
              </div>
              {directJoinMsg && (
                <div
                  className={cn(
                    'p-3.5 rounded-2xl border text-xs font-bold flex items-start gap-2',
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
              <Button className="w-full font-bold" onClick={handleDirectJoin} disabled={isJoiningDirect}>
                {isJoiningDirect ? 'Đang xử lý...' : 'Tham gia ngay'}
              </Button>
            </Card>
          )}

          {/* P5a.3 O1: kèo requiresApproval=true — không có join trực tiếp, dẫn sang join-request. */}
          {!isHost && match.requiresApproval === true && (
            <Card className="p-6 border border-amber-500/30 bg-amber-500/5 shadow-md space-y-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Kèo này duyệt thành viên trước
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Chủ kèo cần duyệt yêu cầu của bạn trước khi vào kèo. Gửi yêu cầu tham gia ở khung
                &quot;Đăng Ký Tham Gia Kèo&quot; bên dưới.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full font-bold"
                onClick={() =>
                  document.getElementById('join-request-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
              >
                Gửi yêu cầu tham gia
              </Button>
            </Card>
          )}

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
