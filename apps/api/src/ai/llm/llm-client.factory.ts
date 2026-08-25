import { GeminiLlmClient } from './gemini.client';
import type { LlmClient } from './llm-client.interface';

/**
 * Factory chọn LLM client theo env (spec §3.1):
 * - LLM_PROVIDER=none hoặc thiếu key -> undefined -> orchestrator rơi về rule-based.
 * - gemini -> GeminiLlmClient với GEMINI_API_KEY + LLM_MODEL (mặc định 2.5-flash).
 */
export function createLlmClient(): LlmClient | undefined {
  const provider = (process.env.LLM_PROVIDER ?? 'none').toLowerCase();
  if (provider === 'gemini') {
    const key = process.env.GEMINI_API_KEY;
    if (key === undefined || key === '') return undefined;
    return new GeminiLlmClient(key, process.env.LLM_MODEL || 'gemini-2.5-flash');
  }
  return undefined;
}
