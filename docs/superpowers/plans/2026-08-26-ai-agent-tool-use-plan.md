# AI Agent Tool-use Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay pipeline NLU cứng của `/ai/chat` bằng vòng lặp LLM tool-use đa lượt, giữ nguyên guardrail và rơi về rule-based khi chưa cấu hình key.

**Architecture:** Token `ChatOrchestrator` chọn giữa `AgentChatService` (LLM loop qua `LlmClient`) và `AiChatService` (rule-based, giữ nguyên). LLM chỉ được gọi 3 tool đọc DB thật từ `AiToolsService`; response shape `/ai/chat` không đổi.

**Tech Stack:** NestJS 10 · ts-jest · global fetch (Node 22) · Gemini REST `generateContent` (không thêm SDK) · React 18 + vitest.

**Spec:** `docs/superpowers/specs/2026-08-26-ai-agent-tool-use-spec.md`

## Global Constraints

- Không thêm dependency mới nào vào `apps/api` hay `apps/web`.
- Guardrail: `createHold` KHÔNG nằm trong tool declarations; mọi số liệu reply phải đến từ tool result.
- `POST /ai/chat` response shape giữ nguyên (`intent`, `reply`, `toolsUsed`, `data`).
- Không xoá/sửa hành vi rule-based hiện có; test cũ phải còn xanh.
- Env mới: `LLM_PROVIDER=none|gemini`, `LLM_MODEL` (mặc định `gemini-2.5-flash`); key dùng lại `GEMINI_API_KEY`.
- Agent loop tối đa 4 vòng tool; history gửi lên tối đa 16 turn × 500 ký tự, server chỉ dùng 8 gần nhất.

---

### Task 1: Lớp LLM — contract + Gemini client + factory

**Files:**
- Create: `apps/api/src/ai/llm/llm-client.interface.ts`
- Create: `apps/api/src/ai/llm/gemini.client.ts`
- Create: `apps/api/src/ai/llm/gemini.client.spec.ts`
- Create: `apps/api/src/ai/llm/llm-client.factory.ts`
- Modify: `apps/api/.env.example:31-32`

**Interfaces (Produces):**
- `LlmClient.generate(messages: LlmMessage[], tools: LlmToolDef[]): Promise<LlmGenerateResult>` với `{ text: string | null; toolCalls: LlmToolCall[] }`.
- `createLlmClient(): LlmClient | undefined` — `undefined` khi `LLM_PROVIDER=none` hoặc thiếu key.

- [ ] **Step 1: Write failing test** `gemini.client.spec.ts`

Mock `global.fetch` bằng `jest.spyOn`. Ba case: (a) map đúng request body (systemInstruction, contents role user/model, functionResponse) và parse `functionCall` thành `toolCalls`; (b) HTTP 429 → reject; (c) factory `none`→undefined, `gemini`+key→instance, `gemini` thiếu key→undefined.

- [ ] **Step 2: Run** `pnpm --filter @courthub/api test -- gemini.client` → FAIL (module chưa tồn tại).

- [ ] **Step 3: Implement 3 file interface/client/factory** theo spec §3.1. Mapping: `system`→`systemInstruction`; `assistant.toolCalls`→parts `functionCall{name,args}`; `tool`→role `user` + part `functionResponse{name,response:{result:<json string>}}`; response parts `text` nối chuỗi, `functionCall`→`{id:'call_'+i,name,args}`. Header `x-goog-api-key`, timeout 12s AbortController, URL `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`.

- [ ] **Step 4: Run test** → PASS. Cập nhật `.env.example`: thêm `LLM_PROVIDER=none`, `LLM_MODEL=gemini-2.5-flash`, sửa comment GEMINI_API_KEY.

- [ ] **Step 5: Commit** `feat(ai): llm client contract + gemini adapter`

### Task 2: AgentChatService (vòng lặp tool-use)

**Files:**
- Create: `apps/api/src/ai/chat-orchestrator.interface.ts`
- Create: `apps/api/src/ai/agent-chat.service.ts`
- Test: `apps/api/src/ai/agent-chat.service.spec.ts`

**Interfaces:**
- Consumes: `LlmClient` (Task 1), `AiToolsService.searchVenues/checkSlots/getSuggestedSlots` (hiện có).
- Produces: `interface ChatTurn { role:'user'|'assistant'; content:string }`, `interface ChatContext { user?:{id:string}; history?:ChatTurn[] }`, `interface ChatOrchestrator { chat(message:string, ctx?:ChatContext):Promise<AiChatResponse> }`; `AgentChatService implements ChatOrchestrator`; export `AGENT_TOOL_NAMES = ['searchVenues','checkSlots','getSuggestedSlots']`.

- [ ] **Step 1: Failing test** với FakeLlmClient (queue script) + stub tools: (a) text thuần không tool → intent FALLBACK; (b) searchVenues→checkSlots→text → toolsUsed đúng thứ tự, data.venues/slots đầy đủ, intent SEARCH_SLOTS; (c) tool throw NotFoundException → error JSON feedback, model chốt text bình thường; (d) llm.generate reject → delegate sang fallback orchestrator (sentinel reply); (e) fake luôn trả tool call → dừng ở 4 vòng rồi ép chốt; (f) `AGENT_TOOL_NAMES` đúng 3 tên, không có `createHold` (US-AI-05).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** theo spec §3.2: system prompt tiếng Việt + guardrail, loop ≤4 vòng, capture data, suy luận intent (suggestions→HOLD_REQUEST; venues/slots→SEARCH_SLOTS; else FALLBACK), userId server gán, catch → `fallback.chat(message, ctx)`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(ai): tool-use agent orchestrator with rule-based fallback`

### Task 3: DTO history + wiring module/controller + refactor AiChatService

**Files:**
- Modify: `apps/api/src/ai/dto/ai.dto.ts` (thêm `ChatHistoryItemSchema`, mở rộng `AiChatSchema`)
- Modify: `apps/api/src/ai/ai-chat.service.ts` (đổi chữ ký `chat(message, ctx?: ChatContext)`)
- Modify: `apps/api/src/ai/ai.module.ts` (provider `LlmClient`, `ChatOrchestrator`)
- Modify: `apps/api/src/ai/ai.controller.ts` (inject orchestrator, truyền history)
- Test: chạy lại toàn bộ jest api

- [ ] **Step 1:** Sửa DTO + controller ApiBody schema (thêm `history`).
- [ ] **Step 2:** Sửa `AiChatService.chat` nhận `ctx?: ChatContext`, thay `user?.id` → `ctx?.user?.id`, bỏ qua history.
- [ ] **Step 3:** Module: `{ provide:'LlmClient', useFactory: createLlmClient }` + factory `ChatOrchestrator` inject `['LlmClient', AiChatService]` → có client thì `new AgentChatService(client, tools, ruleBased)` else `ruleBased`. Controller: `@Inject('ChatOrchestrator')`.
- [ ] **Step 4:** `pnpm --filter @courthub/api test && pnpm --filter @courthub/api typecheck` → PASS.
- [ ] **Step 5: Commit** `feat(ai): multi-turn history + orchestrator wiring`

### Task 4: Web — gửi history kèm tin nhắn

**Files:**
- Modify: `apps/web/src/features/ai/types.ts` (thêm `AiChatHistoryItem`)
- Modify: `apps/web/src/features/ai/api.ts` (`sendAiChat(message, history)`)
- Modify: `apps/web/src/features/ai/queries.ts` (mutationFn nhận `{message, history}`)
- Modify: `apps/web/src/features/ai/components/ai-chat-widget.tsx` (hàm `send` dựng history từ `messages`, bỏ welcome/bubble hold/needLogin, slice 8)
- Test: `pnpm --filter @courthub/web test` (widget test đi qua mock-server, body thêm field không phá assertion cũ)

- [ ] Commit: `feat(web): send conversation history to ai chat`

### Task 5: Regression + tài liệu

- [ ] `pnpm -r test` + `pnpm -r typecheck` xanh toàn bộ monorepo.
- [ ] README mục Giai đoạn 2: mô tả agent tool-use + cách bật (`LLM_PROVIDER=gemini` + `GEMINI_API_KEY`), fallback rule-based.
- [ ] Commit: `docs: ai agent upgrade notes`
