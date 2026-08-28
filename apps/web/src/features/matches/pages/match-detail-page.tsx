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
import { useAuthStore } from '../../../lib/auth-store';
import { Card } from '../../../components/ui/card';
import { MatchDetailHero } from '../components/match-detail-hero';
import { MatchParticipantsList } from '../components/match-participants-list';
import { MatchCommentsSection } from '../components/match-comments-section';
import { MatchJoinRequestCard } from '../components/match-join-request-card';
import { MatchPendingRequestsCard } from '../components/match-pending-requests-card';

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
      <div className="w-full max-w-7xl mx-auto px-4 py-12 text-center space-y-3">
        <div className="h-8 w-48 bg-muted rounded mx-auto animate-pulse" />
        <p className="text-xs text-muted-foreground">Đang tải thông tin kèo thi đấu...</p>
      </div>
    );
  }

  const isHost = match.hostUser?.id === user?.id;

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-10 space-y-8 max-w-7xl mx-auto">
      <MatchDetailHero match={match} isHost={isHost} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Description, Line-up, Comments */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 border border-border/80 bg-card shadow-md space-y-3">
            <h3 className="text-base font-black text-foreground">Ghi Chú &amp; Thể Thức Thi Đấu</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {match.description || 'Trận đấu giao lưu phong trào. Vui lòng có mặt trước 15 phút để khởi động.'}
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
          <MatchJoinRequestCard
            joinMsg={joinMsg}
            preferredPosition={preferredPosition}
            onPreferredPositionChange={setPreferredPosition}
            joinNote={joinNote}
            onJoinNoteChange={setJoinNote}
            onSubmit={handleSendJoinRequest}
          />

          {isHost && (
            <MatchPendingRequestsCard
              requests={requests}
              onReviewRequest={handleReviewRequest}
            />
          )}
        </div>
      </div>
    </div>
  );
}
