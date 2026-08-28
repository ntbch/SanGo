import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Send } from 'lucide-react';
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
  return (
    <Card className="p-6 border border-border/80 bg-card shadow-md space-y-4">
      <h3 className="text-base font-black text-foreground pb-2 border-b border-border/50">
        Giao Lưu &amp; Bình Luận Trước Trận
      </h3>

      {/* Comment List */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {comments.map((c) => (
          <div key={c.id} className="p-3 rounded-2xl bg-secondary/40 border border-border/60 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">{c.user?.fullName || 'Cầu thủ'}</span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(c.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{c.content}</p>
          </div>
        ))}
      </div>

      {/* Post Comment Input */}
      <form onSubmit={onPostComment} className="flex gap-2 pt-2">
        <Input
          placeholder="Nhập tin nhắn giao lưu..."
          value={commentContent}
          onChange={(e) => onCommentContentChange(e.target.value)}
          className="h-10 text-xs"
        />
        <Button
          type="submit"
          disabled={isPostingComment || !commentContent.trim()}
          className="h-10 text-xs font-bold gap-1.5 cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Gửi</span>
        </Button>
      </form>
    </Card>
  );
}
