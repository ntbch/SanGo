/**
 * Kiểu dữ liệu Trợ lý AI (§3.12-13) — khớp apps/api/src/ai/dto/ai.dto.ts
 * và AiChatResponse trong ai-chat.service.ts.
 */

export type AiSportType = 'FOOTBALL5' | 'FOOTBALL7' | 'PICKLEBALL' | 'BADMINTON' | 'TENNIS';

/** Một lượt hội thoại gửi kèm /ai/chat để agent nhớ ngữ cảnh (tối đa 8 gần nhất). */
export interface AiChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

/** Card sân trả về cho bubble chat (wireframe 08). */
export interface AiVenueCard {
  venueId: string;
  name: string;
  address: string;
  image?: string;
  /** Giá thấp nhất các sân con khớp (VND); null nếu không có court. */
  minPrice: number | null;
  courts: Array<{
    courtId: string;
    name: string;
    sportType: AiSportType;
    pricePerSlot: number;
    slotMinutes: number;
  }>;
}

/** Khung giờ trống dạng chip UI. */
export interface AiAvailableSlot {
  label: string;
  startMinute: number;
  endMinute: number;
}

export interface AiSlotsResult {
  courtId: string;
  courtName: string;
  date: string;
  slotMinutes: number;
  available: AiAvailableSlot[];
}

/** Một gợi ý giờ chơi (AI-2 §3.13) — tối đa 4 item. */
export interface AiSlotSuggestion {
  /** Giờ bắt đầu đề xuất (phút trong ngày). */
  startMinute: number;
  label: string;
  score: number;
  reason: string;
}

export interface SuggestedSlotsResponse {
  courtId: string;
  date: string;
  suggestions: AiSlotSuggestion[];
}

/** Phản hồi POST /ai/chat. */
export interface AiChatResponse {
  intent: 'SEARCH_SLOTS' | 'HOLD_REQUEST' | 'FALLBACK';
  reply: string;
  /** Tên tool đã chạy — UI hiện '[tool: xxx ✓]' minh bạch chống ảo giác. */
  toolsUsed: string[];
  /** data là object phẳng theo intent (không bọc {type, payload}). */
  data: {
    venues?: AiVenueCard[];
    slots?: AiSlotsResult;
    suggestions?: AiSlotSuggestion[];
    dateHint?: string;
  };
}

/** Phản hồi POST /ai/hold — cùng shape createHold của bookings (§6.1). */
export interface AiHoldResponse {
  holdId: string;
  courtId: string;
  date: string;
  startMinute: number;
  endMinute: number;
  subtotal: number;
  expiresAt: string;
  depositPercent: number;
}
