import React from 'react';
import {
  Bot,
  Send,
  RotateCcw,
  Compass,
  ChevronDown,
  User,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn, formatVND } from '../../lib/utils';
import { createAiHoldApi, sendAiChatApi, type AiChatMessage, type AiChatPayload, type AiChatResponse } from '../../features/ai/api/ai-api';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/auth-store';
import { ApiError } from '../../lib/api-client';
import { AuthModal } from '../auth/auth-modal';

type ChatMessage = AiChatMessage & { data?: AiChatResponse['data']; toolsUsed?: string[] };

const QUICK_PROMPTS = [
  'Tìm sân bóng đá 7 người tối nay ở Cầu Giấy',
  'Gợi ý sân Pickleball gần Ba Đình giá tốt',
  'Có sân cầu lông nào trống 18h ngày mai?',
  'Sân nào đang có ưu đãi giờ vàng hôm nay?',
];

export function AiChatWidget(): React.ReactElement {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [holding, setHolding] = React.useState(false);
  const [error, setError] = React.useState<{ message: string; request?: AiChatPayload } | null>(null);
  const requestPending = React.useRef(false);
  const holdPending = React.useRef(false);
  const isMountedRef = React.useRef(true);
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputMessage, setInputMessage] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Xin chào! Mình là **SanGo AI**: tìm sân, gợi ý giờ vàng, giữ chỗ 10 phút. Bạn cần tìm sân gì hôm nay?',
    },
  ]);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, isTyping]);

  const handleSendMessage = async (textToSend?: string, retryRequest?: AiChatPayload) => {
    const msg = (textToSend || inputMessage).trim();
    if ((!msg && !retryRequest) || requestPending.current || holdPending.current) return;
    const request = retryRequest ?? {
      message: msg,
      history: messages.slice(-6).map(({ role, content }) => ({
        role,
        // Keep full replies in the UI; bound only the optional model context.
        content: role === 'assistant' ? content.slice(0, 8000) : content,
      })),
    };
    if (!retryRequest) {
      setMessages((prev) => [...prev, { role: 'user', content: msg }]);
      setInputMessage('');
    }
    setError(null);
    requestPending.current = true;
    setIsTyping(true);
    try {
      const res = await sendAiChatApi(request);
      // Widget bị unmount khi điều hướng sang /login, /register, /forgot-password,
      // /reset-password (PublicLayout bỏ widget ở các route này) -> đừng setState sau unmount.
      if (!isMountedRef.current) return;
      setMessages((prev) => [...prev, {
        role: 'assistant', content: res.reply, data: res.data, toolsUsed: res.toolsUsed,
      }]);
    } catch (err) {
      setError({
        message: err instanceof ApiError && err.statusCode === 429
          ? 'Bạn đã đạt giới hạn tin nhắn AI. Vui lòng thử lại sau.'
          : err instanceof ApiError ? err.message : 'Kết nối gián đoạn. Vui lòng thử lại.',
        request,
      });
    } finally {
      requestPending.current = false;
      setIsTyping(false);
    }
  };

  const handleHold = async (courtId: string, date: string, startMinute: number) => {
    if (holdPending.current || requestPending.current) return;
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const targetUserId = user.id;
    holdPending.current = true;
    setHolding(true);
    setError(null);
    try {
      const hold = await createAiHoldApi({ courtId, date, slots: [startMinute] });
      if (!isMountedRef.current || useAuthStore.getState().user?.id !== targetUserId) return;
      setIsOpen(false);
      navigate(`/checkout/hold/${hold.id}`);
    } catch (err) {
      // KHÔNG chặn theo đổi user ở nhánh lỗi: khi token hết hạn và refresh cũng hỏng,
      // apiClient xoá session đồng bộ TRƯỚC khi ném 401, nên guard sẽ nuốt mất lỗi và
      // người dùng thấy spinner tắt mà không có gì cả. 401 thì mở lại modal đăng nhập.
      if (!isMountedRef.current) return;
      if (err instanceof ApiError && err.statusCode === 401) {
        setShowAuthModal(true);
        return;
      }
      setError({ message: err instanceof Error ? err.message : 'Không thể giữ chỗ. Vui lòng chọn lại giờ.' });
    } finally {
      if (isMountedRef.current) {
        holdPending.current = false;
        setHolding(false);
      }
    }
  };

  const handleResetChat = () => {
    if (requestPending.current || holdPending.current) return;
    setError(null);
    setInputMessage('');
    setMessages([{ role: 'assistant', content: 'Đã làm mới! Bạn cần tìm sân gì tiếp theo?' }]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50">
        {!isOpen ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Mở Trợ Lý AI Đặt Sân"
            className="group relative flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-primary/40"
          >
            <div className="relative flex items-center justify-center">
              <Bot className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>

            {/* Tooltip on hover (desktop only) */}
            <span className="hidden sm:block absolute right-full mr-3 whitespace-nowrap rounded-xl bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-md border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              Trợ lý AI 
            </span>
          </button>
        ) : (
          /* Chat Window Modal / Popover */
          <div className="w-[92vw] sm:w-[400px] h-[550px] max-h-[85vh] rounded-3xl bg-card border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Window Header */}
            <div className="px-5 py-4 bg-card border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xs">
                  <Bot className="h-5 w-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-foreground">SanGo AI Assistant</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-[9px] font-black text-primary border border-primary/20">
                      Gemini
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Tìm sân, chọn giờ rồi giữ chỗ 10 phút</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleResetChat}
                  disabled={isTyping || holding}
                  title="Làm mới hội thoại"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Thu nhỏ chat"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-start gap-2.5 animate-in fade-in duration-150',
                      isUser ? 'flex-row-reverse' : 'flex-row',
                    )}
                  >
                    {!isUser && (
                      <div className="h-7 w-7 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    {isUser && (
                      <div className="h-7 w-7 rounded-xl bg-secondary text-foreground flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                        <User className="h-3.5 w-3.5" />
                      </div>
                    )}

                    <div
                      className={cn(
                        'max-w-[82%] rounded-2xl p-3.5 leading-relaxed break-words shadow-xs',
                        isUser
                          ? 'bg-primary text-primary-foreground font-medium rounded-tr-xs'
                          : 'bg-secondary/70 border border-border/60 text-foreground rounded-tl-xs',
                      )}
                    >
                      <div className="space-y-1.5 whitespace-pre-line text-[11px] sm:text-xs">
                        {msg.content}
                      </div>
                      {msg.data?.venues?.map((venue) => (
                        <div key={venue.venueId} className="mt-3 border-t border-border pt-2">
                          <Link to={`/venues/${venue.venueId}`} onClick={() => setIsOpen(false)} className="font-semibold text-primary hover:underline">
                            {venue.name}
                          </Link>
                          <p>{venue.address}</p>
                          {venue.minPrice !== null && <p className="tabular-nums">Từ {formatVND(venue.minPrice)}/slot</p>}
                        </div>
                      ))}
                      {msg.data?.slots && (
                        <div className="mt-3 space-y-2">
                          <p className="font-semibold">{msg.data.slots.courtName} · {msg.data.slots.date}</p>
                          {msg.data.slots.available.length === 0 && <p>Không còn giờ trống. Hãy tìm ngày hoặc sân khác.</p>}
                          {msg.data.slots.available.map((slot) => (
                            <Button key={slot.startMinute} size="sm" variant="outline" className="h-11 w-full tabular-nums" disabled={holding || isTyping}
                              onClick={() => handleHold(msg.data!.slots!.courtId, msg.data!.slots!.date, slot.startMinute)}>
                              Giữ chỗ {slot.label}
                            </Button>
                          ))}
                        </div>
                      )}
                      {msg.data?.suggestions && msg.data.courtId && msg.data.dateHint && (
                        <div className="mt-3 space-y-2">
                          <p className="font-semibold">Giờ gợi ý · {msg.data.dateHint}</p>
                          <p>{msg.data.venues?.flatMap((venue) => venue.courts).find((court) => court.courtId === msg.data?.courtId)?.name ?? `Sân ${msg.data.courtId}`}</p>
                          {msg.data.suggestions.length === 0 && <p>Chưa có giờ phù hợp. Hãy tìm ngày hoặc sân khác.</p>}
                          {msg.data.suggestions.map((slot) => (
                            <div key={slot.startMinute}>
                              <Button size="sm" variant="outline" className="h-11 w-full tabular-nums" disabled={holding || isTyping}
                                onClick={() => handleHold(msg.data!.courtId!, msg.data!.dateHint!, slot.startMinute)}>
                                Giữ chỗ {slot.label}
                              </Button>
                              <p className="text-muted-foreground">{slot.reason}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {!!msg.toolsUsed?.length && <p className="mt-2 text-muted-foreground">Dữ liệu từ: {msg.toolsUsed.join(', ')}</p>}

                      {/* If AI message mentions venues, suggest venue discovery CTA */}
                      {!isUser && idx === messages.length - 1 && (
                        <div className="pt-2 mt-2 border-t border-border/50 flex flex-wrap items-center gap-1.5">
                          <Link
                            to="/venues"
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20"
                          >
                            <Compass className="h-3 w-3" />
                            <span>Mở danh sách sân</span>
                          </Link>
                          {holding && <span>Đang giữ chỗ...</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-start gap-2.5">
                  <div className="h-7 w-7 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl rounded-tl-xs bg-secondary/70 border border-border/60 p-3.5 text-xs text-muted-foreground flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                    <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[10px] pl-1 font-semibold">SanGo AI đang tìm kiếm...</span>
                  </div>
                </div>
              )}
              {error && (
                <div role="alert" className="space-y-2 text-destructive">
                  <p>{error.message}</p>
                  {error.request && <Button variant="outline" size="sm" disabled={isTyping || holding} onClick={() => handleSendMessage(undefined, error.request)}>Thử lại</Button>}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Carousel */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 border-t border-border/40 bg-secondary/20 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground block">
                  Câu hỏi gợi ý:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {QUICK_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(p)}
                      className="px-2.5 py-1 rounded-xl bg-card border border-border/70 text-[10px] font-semibold text-foreground hover:border-primary hover:text-primary transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Footer */}
            <div className="p-3 bg-card border-t border-border/60">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  placeholder="Hỏi AI tìm sân, gợi ý giờ vàng..."
                  value={inputMessage}
                  maxLength={500}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="h-9 text-xs bg-secondary/40 border-border/70 focus-visible:ring-primary"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!inputMessage.trim() || isTyping || holding}
                  className="h-9 px-3.5 font-bold shrink-0 shadow-xs cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)} title="Đăng nhập để giữ chỗ"
        subtitle="Đăng nhập xong, bấm lại khung giờ bạn muốn giữ." />
    </>
  );
}
