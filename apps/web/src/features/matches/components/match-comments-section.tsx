import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Send, MessageSquare } from 'lucide-react';
import { MatchComment } from '../api/matches-api';

interface MatchCommentsSectionProps {
  comments: MatchComment[];
  commentContent: string;
  onCommentContentChange: (content: string) => void;
  isPostingComment: boolean;
  onPostComment: (e: React.FormEvent) => Promise<void>;
}

export function MatchCommentsSection({
  comments,
  commentContent,
  onCommentContentChange,
  isPostingComment,
  onPostComment,
}: MatchCommentsSectionProps): React.ReactElement {
  const commentsEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (comments.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments.length]);

  return (
    <Card className="p-6 border border-border/80 bg-card shadow-sm space-y-4 rounded-3xl">
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <h3 className="text-base font-black text-foreground">
          Giao Lưu &amp; Trao Đổi Trước Trận
        </h3>
        <span className="text-[11px] font-mono-num font-bold text-muted-foreground">
          {comments.length} tin nhắn
        </span>
      </div>

      {/* Comment List */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <div className="py-8 text-center space-y-2 flex flex-col items-center justify-center">
            <div className="h-10 w-10 rounded-2xl bg-secondary/80 text-muted-foreground flex items-center justify-center">
              <MessageSquare className="h-5 w-5 opacity-60" />
            </div>
            <p className="text-xs font-semibold text-foreground">Chưa có bình luận nào</p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Hãy gửi tin nhắn đầu tiên để kết nối và trao đổi thông tin thi đấu cùng các thành viên!
            </p>
          </div>
        ) : (
          comments.map((c) => {
            const authorName = c.user?.fullName || 'Cầu thủ';
            const initial = authorName.charAt(0).toUpperCase();

            return (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-1.5 transition-colors hover:bg-secondary/60"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-black text-[10px] flex items-center justify-center">
                      {initial}
                    </span>
                    <span className="font-bold text-foreground">{authorName}</span>
                  </div>
                  <span className="text-[10px] font-mono-num text-muted-foreground">
                    {new Date(c.createdAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pl-7 leading-relaxed">{c.content}</p>
              </div>
            );
          })
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Post Comment Input */}
      <form onSubmit={onPostComment} className="flex gap-2 pt-2 border-t border-border/40">
        <Input
          placeholder="Nhập tin nhắn trao đổi trước trận..."
          value={commentContent}
          onChange={(e) => onCommentContentChange(e.target.value)}
          className="h-10 text-xs rounded-xl"
        />
        <Button
          type="submit"
          disabled={isPostingComment || !commentContent.trim()}
          className="h-10 px-4 text-xs font-bold gap-1.5 rounded-xl cursor-pointer shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Gửi</span>
        </Button>
      </form>
    </Card>
  );
}
