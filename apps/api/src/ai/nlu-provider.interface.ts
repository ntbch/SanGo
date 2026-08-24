import type { SportTypeValue } from './dto/ai.dto';

/** Thực thể trích được từ câu tiếng Việt của người dùng. */
export interface NluEntities {
  sportType?: SportTypeValue;
  /** Khu vực/quận người dùng nhắc (vd "Gò Vấp", "Cầu Giấy"). */
  location?: string;
  /** Từ khóa tên sân cụ thể (vd "Saigon" từ "sân Saigon"). */
  query?: string;
  /** Ngày suy ra từ hôm nay/mai/mốt, định dạng YYYY-MM-DD. */
  dateHint?: string;
}

export type NluIntent =
  | 'SEARCH_SLOTS' // xem lịch / hỏi sân trống -> searchVenues + checkSlots
  | 'HOLD_REQUEST' // muốn giữ chỗ / đặt sân -> đề xuất slots card, KHÔNG tự hold
  | 'FALLBACK'; // chào hỏi / không hiểu -> hướng dẫn sử dụng

export interface NluResult {
  intent: NluIntent;
  entities: NluEntities;
  /** Tên sân cụ thể người dùng nhắc tới khi hỏi tiếp (vd "sân Saigon còn giờ nào?"). */
  venueHint?: string;
}

/**
 * Abstraction NLU (đặc tả §3.12): mặc định RuleBasedNluProvider,
 * sau này thay GeminiNluAdapter mà không đổi tầng chat/tools.
 */
export interface NluProvider {
  parse(text: string): Promise<NluResult>;
}
