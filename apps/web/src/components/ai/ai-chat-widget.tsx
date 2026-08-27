import React from 'react';
import {
  Bot,
  Sparkles,
  Send,
  RotateCcw,
  Compass,
  ChevronDown,
  User,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { sendAiChatApi, type AiChatMessage } from '../../features/ai/api/ai-api';
import { Link } from 'react-router-dom';

const QUICK_PROMPTS = [
  'Tìm sân bóng đá 7 người tối nay ở Cầu Giấy',
  'Gợi ý sân Pickleball gần Ba Đình giá tốt',
  'Có sân cầu lông nào trống 18h ngày mai?',
  'Sân nào đang có ưu đãi giờ vàng hôm nay?',
];

export function AiChatWidget(): React.ReactElement {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputMessage, setInputMessage] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [messages, setMessages] = React.useState<AiChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Xin chào! Tôi là **SanGo AI Assistant** 🤖. Tôi có thể giúp bạn tìm kiếm sân thể thao trống theo vị trí, gợi ý giờ vàng và tự động tạo phiên giữ chỗ 10 phút. Bạn cần tìm sân gì hôm nay?',
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

  const handleSendMessage = async (textToSend?: string) => {
    const msg = (textToSend || inputMessage).trim();
    if (!msg || isTyping) return;

    const newHistory: AiChatMessage[] = [...messages, { role: 'user', content: msg }];
    setMessages(newHistory);
    setInputMessage('');
    setIsTyping(true);

    try {
      const res = await sendAiChatApi({
        message: msg,
        history: newHistory.slice(-6),
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Xin lỗi, hiện tôi đang gặp chút gián đoạn kết nối. Bạn vui lòng thử lại hoặc xem trực tiếp danh sách sân tại trang [Tìm Sân](/venues) nhé!',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          'Đã làm mới cuộc hội thoại! Bạn cần SanGo AI hỗ trợ tìm sân thể thao nào tiếp theo?',
      },
    ]);
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
            className="group relative flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-tr from-primary via-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer border-2 border-white/20"
          >
            <div className="absolute -inset-1 rounded-full bg-primary/30 blur-md group-hover:blur-lg transition-all animate-pulse" />
            <div className="relative flex items-center justify-center">
              <Bot className="h-6 w-6 sm:h-7 sm:w-7 transition-transform group-hover:rotate-12" />
              <Sparkles className="h-3 w-3 text-amber-300 absolute -top-1 -right-1 animate-bounce" />
            </div>

            {/* Tooltip on hover (desktop only) */}
            <span className="hidden sm:block absolute right-full mr-3 whitespace-nowrap rounded-xl bg-card/95 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-foreground shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              Trợ lý AI 
            </span>
          </button>
        ) : (
          /* Chat Window Modal / Popover */
          <div className="w-[92vw] sm:w-[400px] h-[550px] max-h-[85vh] rounded-3xl bg-card/98 backdrop-blur-xl border border-border/80 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Window Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-card via-secondary/60 to-primary/10 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 text-white shadow-xs">
                  <Bot className="h-5 w-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-foreground">SanGo AI Assistant</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-primary/15 text-[9px] font-black text-primary border border-primary/20">
                      GPT-4o
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Tự động tìm sân &amp; giữ chỗ 10 phút</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleResetChat}
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
                          <Link
                            to="/map"
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-foreground hover:underline bg-secondary px-2 py-0.5 rounded-lg border border-border"
                          >
                            <span>Xem trên bản đồ</span>
                          </Link>
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
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="h-9 text-xs bg-secondary/40 border-border/70 focus-visible:ring-primary"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!inputMessage.trim() || isTyping}
                  className="h-9 px-3.5 font-bold shrink-0 shadow-xs cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
