# Đặc Tả: Nâng cấp Trợ lý AI — LLM Agent tool-use đa lượt (CourtHub GĐ2)

> Ngày: 2026-08-26 · Phân loại: Architectural · Thay thế pipeline NLU cứng bằng vòng lặp LLM tool-use, giữ nguyên guardrail chống bịa dữ liệu.

## 1. Tổng quan & mục tiêu

Hiện trạng: `/ai/chat` dùng `RuleBasedNluProvider` (regex từ khoá) để parse intent rồi chạy flow cứng. Chỉ hiểu được mẫu câu đã liệt kê, không nhớ ngữ cảnh, không xử lý được câu phức hợp ("sân cầu lông gần Gò Vấp dưới 60k tối nay còn giờ nào?").

Mục tiêu:
- Thay tầng điều phối bằng **LLM agent loop**: model tự quyết định gọi tool nào (`searchVenues`, `checkSlots`, `getSuggestedSlots`) trong tối đa 4 vòng, mọi số liệu vẫn 100% từ DB thật qua `AiToolsService`.
- Hội thoại **đa lượt**: client gửi kèm history; agent đọc ngữ cảnh "sân đó", "mai", "khung 7h ấy"...
- Provider-agnostic: env chọn `none|gemini|openai-compatible`; **không key → tự rơi về rule-based** (demo offline không chết).
- Response shape của `POST /ai/chat` giữ nguyên → widget ít phải đổi.

## 2. Kiến trúc

```
POST /ai/chat {message, history?}
        │
AiController ──► ChatOrchestrator (token factory)
                    │  LLM_PROVIDER != none && có key?
                    ├─ CÓ ─► AgentChatService ──► LlmClient (Gemini REST) ◄─loop──┐
                    │              │ tool_call                                      │
                    │              ▼                                                │
                    │        AiToolsService (searchVenues/checkSlots/getSuggestedSlots)
                    │              │ kết quả thật ─────────────────────────────────┘
                    └─ KHÔNG ► AiChatService (rule-based, giữ nguyên)
```

## 3. Hợp đồng kỹ thuật

### 3.1. Lớp LLM (`apps/api/src/ai/llm/`)

```ts
// llm-client.interface.ts (shape OpenAI-compatible để tái dùng cho Groq/DeepSeek sau)
interface LlmToolCall { id: string; name: string; args: Record<string, unknown> }
interface LlmMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string;
  toolCalls?: LlmToolCall[];   // khi role=assistant
  toolCallId?: string;         // khi role=tool
}
interface LlmToolDef { name: string; description: string; parameters: JsonSchemaObject }
interface LlmClient {
  generate(messages: LlmMessage[], tools: LlmToolDef[]): Promise<{ text: string | null; toolCalls: LlmToolCall[] }>;
}
```

- `gemini.client.ts`: gọi REST `generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`, map message↔contents/parts, functionCall↔toolCalls, timeout 12s bằng AbortController. Không thêm SDK mới.
- `llm-client.factory.ts`: đọc `LLM_PROVIDER` + key tương ứng; trả `undefined` khi `none`/thiếu key.

### 3.2. Agent orchestrator (`agent-chat.service.ts`)

- System prompt tiếng Việt gồm: vai trò trợ lý CourtHub, ngày hôm nay (`vnToday()`), guardrail:
  1. CHỈ được nêu số liệu sân/giá/giờ từ kết quả tool; hết dữ liệu thì nói thẳng là hết.
  2. TUYỆT ĐỐI không hứa giữ chỗ/thanh toán hộ — hướng dẫn user bấm chip giờ và đăng nhập.
  3. Trả lời ngắn gọn (≤120 từ), tiếng Việt thân thiện.
- Tool declarations khớp chữ ký `AiToolsService`: `searchVenues(sportType?, location?, query?)`, `checkSlots(courtId, date)`, `getSuggestedSlots(courtId, date?)`. `userId` do server tự gán từ JWT — LLM không được truyền.
- Loop ≤4 vòng: mỗi `toolCalls` → thực thi thật (try/catch, lỗi trả về cho model dưới dạng tool result JSON `{error}`), ghi `toolsUsed`, feed kết quả lại; text cuối → reply.
- Structured data: lưu kết quả tool gần nhất vào `data.{venues,slots,suggestions,courtId,dateHint}` như hiện tại để widget render card/chip.
- `intent` suy luận: có suggestions → `HOLD_REQUEST`; có venues/slots → `SEARCH_SLOTS`; else `FALLBACK`.
- LLM lỗi (quota/mạng/timeout): log warn và **delegate nguyên request sang AiChatService** (rule-based) — response vẫn hợp lệ.

### 3.3. Multi-turn history

- `AiChatSchema` thêm `history?: Array<{role:'user'|'assistant'; content:string}>` — tối đa 16 mục × 500 ký tự, optional (backward-compatible).
- Rule-based path bỏ qua history. Agent cắt 8 lượt gần nhất đưa vào messages.
- Widget: build history từ state `messages` (loại welcome/error/hold-card), gửi kèm mọi request; typing indicator sẵn có hiển thị lúc chờ.

## 4. Guardrail (kế thừa §3.12 đặc tả cũ — không thay đổi)

| Quy tắc | Cơ chế |
|---|---|
| Không bịa số liệu | Model chỉ được trích dẫn tool result; prompt cấm + data chỉ render từ `data.*` |
| Không tự giữ chỗ | `createHold` KHÔNG nằm trong tool declarations; chỉ còn `POST /ai/hold` bắt buộc JWT |
| Rate limit | Giữ `@Throttle` 20 tin/h trên `/ai/chat`; free tier Gemini 10 RPM nằm dưới ngưỡng này |
| Timeout | Client abort 15s (web) / 12s (server call); quá hạn → rule-based fallback |

## 5. Acceptance criteria

- **US-AI-01**: Cho key hợp lệ, hỏi "cho mình sân pickleball ở Gò Vấp tối nay" → response 200 có `reply` tiếng Việt, `toolsUsed` chứa `searchVenues` (+`checkSlots` nếu model tra giờ), `data.venues[0].minPrice` là số thật từ DB.
- **US-AI-02**: Tiếp "còn khung nào sáng mai không?" (có history) → agent hiểu "sân vừa tìm" mà không cần nhắc lại tên.
- **US-AI-03**: Bỏ key / `LLM_PROVIDER=none` → hành vi y hệt bản rule-based hiện tại, test cũ còn xanh.
- **US-AI-04**: Key sai/hết quota → response vẫn 200 trả bởi rule-based fallback (log warn phía server), không 500 cho user.
- **US-AI-05**: Agent không bao giờ gọi giữ chỗ: không tồn tại declaration `createHold`; test unit khẳng định danh sách tool chỉ có 3 tên.

## 6. Test plan

- API unit (`agent-chat.service.spec.ts`) với FakeLlmClient: (a) một vòng text thuần; (b) chuỗi searchVenues→checkSlots→text, assert toolsUsed + data + intent; (c) tool throw → error feedback, vẫn kết thúc; (d) LLM reject → fallback rule-based; (e) ≤4 vòng loop (fake trả tool call mãi → dừng ở vòng 4).
- Web: cập nhật `ai-chat-widget.test.tsx` nếu body request đổi (thêm history); mock fetch assert field.
- Regression: toàn bộ spec cũ (`rule-based-nlu.provider.spec.ts`, `ai-tools.service.spec.ts`) phải còn xanh.

## 7. Ngoài phạm vi đợt này

Streaming SSE, voice input, memory bền vững (DB), tool ghi (huỷ đơn, đánh giá), provider Groq/DeepSeek cụ thể (chỉ chuẩn bị shape OpenAI-compatible).
