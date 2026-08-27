/**
 * Trợ lý đặt sân AI — floating widget góc phải dưới (wireframe 08, §3.12).
 * Chat tiếng Việt -> tool-call DB thật; GUARDRAIL: không tự thanh toán,
 * giữ chỗ bắt buộc đăng nhập qua POST /ai/hold rồi chuyển checkout chuẩn.
 * Thiết kế z-index an toàn, tránh đè mobile bottom navigation.
 */
import { ArrowRight, BadgeCheck, Bot, Loader2, Send, X } from 'lucide-react';
import { useRef, useState, type ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { useToast } from '../../../components/ui/use-toast';
import { cn } from '../../../lib/utils';
import { ApiError } from '../../../lib/api/api-error';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { formatVnd, minutesToTime } from '../../public/format';

import { useAiChat, useCreateAiHold } from '../queries';
import type { AiChatHistoryItem, AiChatResponse, AiSlotsResult, AiVenueCard } from '../types';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  toolsUsed?: string[];
  venues?: AiVenueCard[];
  slots?: AiSlotsResult;
  /** Bubble kết quả hold: chứa holdId để nút [Tiếp tục thanh toán]. */
  holdId?: string;
  subtotal?: number;
  date?: string;
  timeRange?: string;
  /** Đánh dấu cần đăng nhập để tiếp tục giữ chỗ. */
  needLogin?: boolean;
  /** Bubble hệ thống (chào mừng/lỗi) — KHÔNG đưa vào history gửi server. */
  transient?: boolean;
}

let messageId = 0;
function nextId(): number {
  messageId += 1;
  return messageId;
}

const QUICK_REPLIES = ['Tìm sân pickleball ở Gò Vấp', 'Còn sân cầu lông tối nay không?'];

const RATE_LIMIT_TEXT = 'Bạn đã gửi nhiều tin quá, mình nghỉ chút nhé, thử lại sau.';
const BUSY_TEXT = 'Hệ thống gợi ý bận, thử lại sau.';

function ToolBadge(options: { tools: string[] }): ReactElement {
  if (options.tools.length === 0) return <></>;
  return (
    <div className="flex flex-wrap gap-1" aria-label="Tool đã dùng">
      {options.tools.map((tool) => (
        <span
          key={tool}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
        >
          <BadgeCheck className="mr-0.5 inline size-3 text-primary" aria-hidden />
          [tool: {tool}]
        </span>
      ))}
    </div>
  );
}

export function AiChatWidget(): ReactElement {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nextId(),
      role: 'assistant',
      text: 'Chào bạn! Mình giúp tìm sân và giữ chỗ nhé. Bạn muốn chơi môn gì, ở đâu, khi nào?',
      transient: true,
    },
  ]);
  const [input, setInput] = useState('');
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const chatMutation = useAiChat();
  const holdMutation = useCreateAiHold();
  const { toast } = useToast();
  const listRef = useRef<HTMLDivElement | null>(null);

  const append = (message: ChatMessage): void => {
    setMessages((prev) => [...prev, message]);
    requestAnimationFrame(() => {
      const list = listRef.current;
      if (list !== null && typeof list.scrollTo === 'function') {
        list.scrollTo({ top: list.scrollHeight });
      }
    });
  };

  /** Bắn tin nhắn của người dùng lên /ai/chat và hiển thị bubble AI kèm data. */
  const send = async (raw: string): Promise<void> => {
    const text = raw.trim().slice(0, 500);
    if (text === '' || chatMutation.isPending) return;
    setInput('');
    append({ id: nextId(), role: 'user', text });
    try {
      // Đa lượt: gửi kèm hội thoại gần nhất (bỏ bubble hold/cần đăng nhập) để agent hiểu "sân đó", "mai"...
      const history: AiChatHistoryItem[] = messages
        .filter((m) => m.transient !== true && m.holdId === undefined && m.needLogin !== true)
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.text }));
      const res: AiChatResponse = await chatMutation.mutateAsync({ message: text, history });
      append({
        id: nextId(),
        role: 'assistant',
        text: res.reply,
        toolsUsed: res.toolsUsed,
        venues: res.data.venues,
        slots: res.data.slots,
      });
    } catch (err) {
      const rateLimited =
        err instanceof ApiError && (err.statusCode === 429 || err.code === 'RATE_LIMITED');
      append({
        id: nextId(),
        role: 'assistant',
        text: rateLimited ? RATE_LIMIT_TEXT : BUSY_TEXT,
        transient: true,
      });
    }
  };

  /** CTA trên card venue: hỏi tiếp slot của sân đó (stateless chat). */
  const askSlots = (venueName: string): void => {
    void send(venueName + ' còn giờ nào tối nay?');
  };

  /** Chip giờ -> giữ chỗ ngay qua /ai/hold; guest thì gợi ý đăng nhập. */
  const holdSlot = async (
    slots: AiSlotsResult,
    startMinute: number,
    endMinute: number,
  ): Promise<void> => {
    if (!user) {
      append({
        id: nextId(),
        role: 'assistant',
        text: 'Bạn cần đăng nhập để giữ chỗ nhé.',
        needLogin: true,
      });
      return;
    }
    try {
      const hold = await holdMutation.mutateAsync({
        courtId: slots.courtId,
        date: slots.date,
        slots: [{ startMinute, endMinute }],
      });
      append({
        id: nextId(),
        role: 'assistant',
        text: 'Đã giữ chỗ 10 phút!',
        holdId: hold.holdId,
        subtotal: hold.subtotal,
        date: hold.date,
        timeRange: minutesToTime(hold.startMinute) + ' – ' + minutesToTime(hold.endMinute),
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : BUSY_TEXT;
      toast({ variant: 'destructive', title: 'Giữ chỗ không thành công', description: message });
    }
  };

  const renderAssistantExtras = (message: ChatMessage): ReactElement | null => {
    if (message.holdId !== undefined) {
      return (
        <div className="mt-2 rounded-lg border border-primary/40 bg-primary/5 p-2.5 text-sm space-y-1">
          <p>
            {message.date} · {message.timeRange} ·{' '}
            <strong>{formatVnd(message.subtotal ?? 0)}</strong>
          </p>
          <Button
            size="sm"
            className="w-full font-bold"
            data-testid="continue-checkout"
            onClick={() => navigate('/thanh-toan/checkout/' + message.holdId)}
          >
            Tiếp tục thanh toán
            <ArrowRight className="ml-1 inline size-4" aria-hidden />
          </Button>
        </div>
      );
    }

    if (message.venues !== undefined && message.venues.length > 0) {
      return (
        <div className="mt-2 space-y-2">
          {message.venues.slice(0, 3).map((venue) => (
            <div key={venue.venueId} className="rounded-lg border p-2.5 text-sm space-y-1">
              <p className="font-semibold">{venue.name}</p>
              <p className="text-xs text-muted-foreground">
                {venue.address}
                {venue.minPrice !== null ? ' · từ ' + formatVnd(venue.minPrice) : ''}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs font-bold"
                onClick={() => askSlots(venue.name)}
              >
                Xem slot tối nay
              </Button>
            </div>
          ))}
        </div>
      );
    }

    if (message.slots !== undefined && message.slots.available.length > 0) {
      return (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {message.slots.available.map((slot) => (
            <button
              key={slot.startMinute}
              type="button"
              data-testid="ai-slot-chip"
              onClick={() =>
                void holdSlot(message.slots as AiSlotsResult, slot.startMinute, slot.endMinute)
              }
              className="rounded-full border border-primary/50 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition"
            >
              {slot.label}
            </button>
          ))}
          <p className="w-full text-[11px] text-muted-foreground">
            Chạm một khung giờ để giữ chỗ ngay.
          </p>
        </div>
      );
    }

    if (message.needLogin === true) {
      return (
        <Button
          size="sm"
          variant="outline"
          className="mt-2 font-bold"
          onClick={() => navigate('/login?next=' + encodeURIComponent(location.pathname))}
        >
          Đăng nhập
        </Button>
      );
    }

    return null;
  };

  return (
    <>
      {/* Nút nổi góc phải dưới — z-50 an toàn trên desktop và mobile (bottom-20 né mobile bottom nav) */}
      <button
        type="button"
        data-testid="ai-chat-toggle"
        aria-label={open ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'}
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_25px_rgba(0,109,55,0.35)] transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        {open ? <X className="size-5" aria-hidden /> : <Bot className="size-5" aria-hidden />}
      </button>

      {open ? (
        <div
          data-testid="ai-chat-panel"
          className="fixed bottom-36 md:bottom-20 right-4 md:right-6 z-50 flex h-[520px] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-[0_20px_50px_rgba(15,23,42,0.25)] backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 border-b bg-card/90 px-3 py-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Bot className="size-4 text-primary" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold tracking-tight">Trợ lý SanGo AI</p>
              <p className="text-[10px] text-muted-foreground">Tư vấn tìm sân & giữ chỗ 24/7</p>
            </div>
            <button
              type="button"
              aria-label="Đóng chat"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto p-3"
            data-testid="ai-chat-messages"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn('flex gap-2', message.role === 'user' && 'justify-end')}
              >
                {message.role === 'assistant' ? (
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="size-3.5" aria-hidden />
                  </div>
                ) : null}
                <div
                  className={cn(
                    'max-w-[85%] space-y-1 rounded-xl px-3 py-2 text-sm leading-relaxed shadow-xs',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'bg-muted/70 text-foreground border border-border/40',
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  {message.role === 'assistant' ? (
                    <>
                      {message.toolsUsed !== undefined ? (
                        <ToolBadge tools={message.toolsUsed} />
                      ) : null}
                      {renderAssistantExtras(message)}
                    </>
                  ) : null}
                </div>
              </div>
            ))}
            {chatMutation.isPending ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground" data-testid="ai-typing">
                <Loader2 className="size-3 animate-spin text-primary" /> Đang tìm kiếm dữ liệu…
              </div>
            ) : null}
            {messages.length <= 1 && !chatMutation.isPending ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_REPLIES.map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => void send(quick)}
                    className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition"
                  >
                    {quick}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <form
            className="border-t bg-card p-2.5"
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
          >
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Nhập tin nhắn…"
                aria-label="Nhập tin nhắn cho trợ lý AI"
                data-testid="ai-chat-input"
                maxLength={500}
                className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                type="submit"
                size="sm"
                className="h-10 px-3 font-bold"
                disabled={chatMutation.isPending || input.trim() === ''}
              >
                {chatMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="size-4" aria-hidden />
                )}
              </Button>
            </div>
            <p className="pt-1.5 text-center text-[10px] text-muted-foreground">
              AI chỉ gợi ý — kiểm tra kỹ trước khi đặt
            </p>
          </form>
        </div>
      ) : null}
    </>
  );
}
