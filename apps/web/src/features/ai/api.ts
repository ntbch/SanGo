import { ApiError } from '../../lib/api/api-error';
import { apiFetch } from '../../lib/api/client';
import { endpoints } from '../../lib/api/endpoints';
import type {
  AiChatHistoryItem,
  AiChatResponse,
  AiHoldResponse,
  SuggestedSlotsResponse,
} from './types';

/** §6.4: timeout 15s cho provider AI — quá hạn báo 'hệ thống gợi ý bận'. */
const AI_CHAT_TIMEOUT_MS = 15_000;

/** POST /ai/chat — kèm history để agent hiểu ngữ cảnh đa lượt (server stateless). */
export async function sendAiChat(
  message: string,
  history: AiChatHistoryItem[] = [],
): Promise<AiChatResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_CHAT_TIMEOUT_MS);
  try {
    return await apiFetch<AiChatResponse>(endpoints.ai.chat(), {
      method: 'POST',
      body: { message, history },
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(504, 'Provider AI quá hạn phản hồi', 'AI_TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** GET /ai/suggested-slots — gợi ý khung giờ cho dải 'Gợi ý cho bạn'. */
export function fetchAiSuggestedSlots(
  courtId: string,
  date?: string,
): Promise<SuggestedSlotsResponse> {
  return apiFetch<SuggestedSlotsResponse>(endpoints.ai.suggestedSlots({ courtId, date }));
}

/** POST /ai/hold — giữ chỗ từ chat; backend chặn Bearer bắt buộc (401 nếu khách). */
export function createAiHold(payload: {
  courtId: string;
  date: string;
  slots: Array<{ startMinute: number; endMinute: number }>;
}): Promise<AiHoldResponse> {
  return apiFetch<AiHoldResponse>(endpoints.ai.hold(), { method: 'POST', body: payload });
}
