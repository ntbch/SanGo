import { z } from 'zod';

/** Một lượt hội thoại client gửi kèm để agent nhớ ngữ cảnh (server stateless). */
export const ChatHistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1, 'Nội dung trống').max(500, 'Tin nhắn tối đa 500 ký tự'),
});

/** POST /ai/chat — public, tin nhắn tiếng Việt tự nhiên (+ history tuỳ chọn đa lượt). */
export const AiChatSchema = z.object({
  message: z.string().trim().min(1, 'Tin nhắn trống').max(500, 'Tin nhắn tối đa 500 ký tự'),
  history: z.array(ChatHistoryItemSchema).max(16, 'Hội thoại tối đa 16 lượt').optional(),
});
export type AiChatDto = z.infer<typeof AiChatSchema>;

/** GET /ai/suggested-slots?courtId=&date= */
export const SuggestedSlotsQuerySchema = z.object({
  courtId: z.string().uuid('courtId phải là UUID'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date phải là YYYY-MM-DD')
    .optional(),
});

/** POST /ai/hold — tái dùng nguyên schema giữ chỗ của bookings (§6.1). */
export { CreateHoldSchema } from '../../bookings/dto/booking.dto';
export type { CreateHoldDto } from '../../bookings/dto/booking.dto';

export type SportTypeValue = 'FOOTBALL5' | 'FOOTBALL7' | 'PICKLEBALL' | 'BADMINTON' | 'TENNIS';

/** Card sân trả về cho UI chat (wireframe 08: card venue). */
export interface AiVenueCard {
  venueId: string;
  name: string;
  address: string;
  /** Ảnh đầu tiên (nếu có) cho card UI. */
  image?: string;
  /** Giá thấp nhất các sân con khớp bộ lọc (VND); null nếu không có court nào. */
  minPrice: number | null;
  courts: Array<{
    courtId: string;
    name: string;
    sportType: SportTypeValue;
    pricePerSlot: number;
    slotMinutes: number;
  }>;
}

/** Khung giờ trống dạng label HH:mm cho chip UI. */
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

/** Một gợi ý giờ chơi (AI-2 §3.13). */
export interface AiSlotSuggestion {
  /** Giờ bắt đầu đề xuất (phút trong ngày). */
  startMinute: number;
  label: string;
  score: number;
  reason: string;
}
