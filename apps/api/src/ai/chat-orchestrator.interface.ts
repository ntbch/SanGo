import type { AiChatResponse } from './ai-chat.service';

/** Một lượt hội thoại client gửi kèm (đa lượt, server stateless). */
export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** Ngữ cảnh mỗi request chat: user từ JWT tuỳ chọn + history do client giữ. */
export interface ChatContext {
  user?: { id: string };
  history?: ChatTurn[];
}

/**
 * Hợp đồng chung của tầng điều phối chat (spec 2026-08-26):
 * AgentChatService (LLM tool-use) và AiChatService (rule-based) cùng cài.
 */
export interface ChatOrchestrator {
  chat(message: string, ctx?: ChatContext): Promise<AiChatResponse>;
}
