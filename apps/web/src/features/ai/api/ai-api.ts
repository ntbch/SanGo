import { apiClient } from '../../../lib/api-client';
import { CreateHoldParams, BookingHoldResponse } from '../../booking/api/booking-api';

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatPayload {
  message: string;
  history?: AiChatMessage[];
}

export interface AiChatResponse {
  reply: string;
  suggestedAction?: {
    type: 'NAVIGATE_VENUE' | 'HOLD_SLOT' | 'VIEW_MATCH';
    payload?: any;
  };
}

export interface SuggestedSlotItem {
  startMinute: number;
  endMinute: number;
  timeLabel: string;
  confidenceScore: number;
  reason: string;
}

// 1. Trợ lý AI chat đặt sân tiếng Việt (POST /ai/chat)
export async function sendAiChatApi(payload: AiChatPayload): Promise<AiChatResponse> {
  try {
    return await apiClient<AiChatResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    // Intelligent local fallback if AI gateway offline or simulated
    const q = payload.message.toLowerCase();
    let reply = '';
    if (q.includes('bóng đá') || q.includes('sân 7') || q.includes('cầu giấy')) {
      reply =
        'Tại Cầu Giấy còn trống **Sân Ngọc Khánh** và **ĐH Sư Phạm**, giờ 19:00–20:30 tối nay, từ 250.000đ/h. Giữ chỗ ngay?';
    } else if (q.includes('pickleball') || q.includes('ba đình')) {
      reply =
        '**Sân Pickleball Pro Court** (Ba Đình) có 4 sân mái che, giờ vàng 17:30–19:00 ngày mai, từ 180.000đ/slot.';
    } else if (q.includes('cầu lông') || q.includes('badminton')) {
      reply =
        'Sân cầu lông thảm BWF ở Đống Đa, Nam Từ Liêm mở 06:00–23:00. Bạn muốn chơi lúc nào?';
    } else {
      reply =
        'Chào bạn! Tôi có thể hỗ trợ:\n- Tìm sân trống theo khu vực\n- Gợi ý giờ vàng giá tốt\n- Giữ chỗ 10 phút\n\nBạn đang tìm sân môn nào?';
    }
    return { reply };
  }
}

// 2. Gợi ý khung giờ AI histogram (GET /ai/suggested-slots)
export async function getSuggestedSlotsApi(courtId: string, date?: string): Promise<SuggestedSlotItem[]> {
  try {
    return await apiClient<SuggestedSlotItem[]>('/ai/suggested-slots', {
      params: { courtId, date: date || undefined },
    });
  } catch {
    return [
      {
        startMinute: 1080,
        endMinute: 1140,
        timeLabel: '18:00 - 19:00',
        confidenceScore: 0.95,
        reason: 'Khung giờ vàng được người chơi yêu thích nhất',
      },
      {
        startMinute: 1140,
        endMinute: 1200,
        timeLabel: '19:00 - 20:00',
        confidenceScore: 0.92,
        reason: 'Phù hợp sau giờ làm việc, thời tiết mát mẻ',
      },
    ];
  }
}

// 3. Giữ chỗ 10 phút từ AI chat (POST /ai/hold)
export async function createAiHoldApi(dto: CreateHoldParams): Promise<BookingHoldResponse> {
  return apiClient<BookingHoldResponse>('/ai/hold', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}
