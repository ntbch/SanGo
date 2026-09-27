import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { CheckCircle2 } from 'lucide-react';

interface MatchJoinRequestCardProps {
  joinMsg: string | null;
  preferredPosition: string;
  onPreferredPositionChange: (pos: string) => void;
  joinNote: string;
  onJoinNoteChange: (note: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  /** Kèo đã kín slot — nhãn nút bám theo cờ này. */
  disabled?: boolean;
  /** Đang gửi yêu cầu — khoá nút chống bấm nhiều lần tạo nhiều yêu cầu. */
  isSubmitting?: boolean;
  allowedPositions?: string[];
}

export function MatchJoinRequestCard({
  joinMsg,
  preferredPosition,
  onPreferredPositionChange,
  joinNote,
  onJoinNoteChange,
  onSubmit,
  disabled = false,
  isSubmitting = false,
  allowedPositions,
}: MatchJoinRequestCardProps): React.ReactElement {
  return (
    <Card className="p-6 border border-border/80 bg-card shadow-md space-y-5">
      <div className="pb-3 border-b border-border/50">
        <h3 className="text-base font-black text-foreground">Đăng Ký Tham Gia Kèo</h3>
        <p className="text-xs text-muted-foreground">
          Gửi yêu cầu tới chủ kèo để nhận slot thi đấu.
        </p>
      </div>

      {joinMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{joinMsg}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground block">Vị Trí Sở Trường</label>
          <select
            value={preferredPosition}
            onChange={(e) => onPreferredPositionChange(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
          >
            {allowedPositions && allowedPositions.length > 0 ? (
              allowedPositions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))
            ) : (
              <>
                <option value="Tiền đạo">Tiền đạo / Tấn công</option>
                <option value="Tiền vệ">Tiền vệ / Phân phối bóng</option>
                <option value="Hậu vệ">Hậu vệ / Phòng ngự</option>
                <option value="Thủ môn">Thủ môn</option>
                <option value="Tự do">Tự do / Vị trí nào cũng được</option>
              </>
            )}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground block">Lời Nhắn Gửi Chủ Kèo</label>
          <Input
            placeholder="Ví dụ: Mình đá chân trái, có thể đến sớm..."
            value={joinNote}
            onChange={(e) => onJoinNoteChange(e.target.value)}
            className="h-10 text-xs"
          />
        </div>

        <Button type="submit" disabled={disabled || isSubmitting} className="w-full font-bold text-xs shadow-md cursor-pointer">
          {disabled ? 'Kèo đã kín slot' : isSubmitting ? 'Đang gửi...' : 'Gửi Yêu Cầu Xin Slot'}
        </Button>
      </form>
    </Card>
  );
}
