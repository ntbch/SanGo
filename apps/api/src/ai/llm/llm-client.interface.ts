/**
 * Hợp đồng LLM provider-agnostic cho Agent (spec 2026-08-26 §3.1).
 * Shape OpenAI-compatible để sau này thêm Groq/DeepSeek chỉ bằng 1 client mới.
 */

/** JSON Schema object tối thiểu cho tham số tool (function declaration). */
export interface JsonSchemaObject {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
}

/** Một lời gọi tool model yêu cầu trong lượt hiện tại. */
export interface LlmToolCall {
  /** Id tự sinh phía client (gemini không có id gốc). */
  id: string;
  name: string;
  args: Record<string, unknown>;
}

/** Tin nhắn hội thoại chuẩn hoá giữa app <-> LLM. */
export interface LlmMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string;
  /** Kết quả tool khi role='tool'. */
  toolCalls?: LlmToolCall[];
  /** Bắt buộc khi role='tool': id của toolCall đang trả kết quả. */
  toolCallId?: string;
  /** Bắt buộc khi role='tool': tên tool đã chạy. */
  name?: string;
}

/** Khai báo tool expose cho model. */
export interface LlmToolDef {
  name: string;
  description: string;
  parameters: JsonSchemaObject;
}

export interface LlmGenerateResult {
  /** Text trả lời cuối; null nếu lượt này chỉ có tool call. */
  text: string | null;
  toolCalls: LlmToolCall[];
}

export interface LlmClient {
  generate(messages: LlmMessage[], tools: LlmToolDef[]): Promise<LlmGenerateResult>;
}
