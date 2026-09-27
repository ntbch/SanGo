import { apiClient } from '../../../lib/api-client';
import type { BookingHoldResponse } from '../../booking/api/booking-api';

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatPayload {
  message: string;
  history?: AiChatMessage[];
}

export interface AiSlotSuggestion {
  startMinute: number;
  label: string;
  score: number;
  reason: string;
}

export interface AiChatResponse {
  intent: 'SEARCH_SLOTS' | 'HOLD_REQUEST' | 'FALLBACK';
  reply: string;
  toolsUsed: string[];
  data: {
    venues?: Array<{
      venueId: string;
      name: string;
      address: string;
      image?: string;
      minPrice: number | null;
      courts: Array<{
        courtId: string;
        name: string;
        sportType: string;
        pricePerSlot: number;
        slotMinutes: number;
      }>;
    }>;
    slots?: {
      courtId: string;
      courtName: string;
      date: string;
      slotMinutes: number;
      available: Array<{ label: string; startMinute: number; endMinute: number }>;
    };
    suggestions?: AiSlotSuggestion[];
    courtId?: string;
    dateHint?: string;
  };
}

export async function sendAiChatApi(payload: AiChatPayload): Promise<AiChatResponse> {
  return apiClient<AiChatResponse>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Explicit user-selected starts only; the server validates availability and duration.
export async function createAiHoldApi(dto: {
  courtId: string;
  date: string;
  slots: number[];
}): Promise<Pick<BookingHoldResponse, 'id'>> {
  const hold = await apiClient<Pick<BookingHoldResponse, 'id'>>('/ai/hold', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (!hold.id) throw new Error('Server không trả về mã giữ chỗ');
  return hold;
}
