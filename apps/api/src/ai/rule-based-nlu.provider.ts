import { Injectable } from '@nestjs/common';
import type { SportTypeValue } from './dto/ai.dto';
import type { NluEntities, NluProvider, NluResult } from './nlu-provider.interface';

/** Từ khóa -> sportType (thứ tự quan trọng: khớp dài trước ngắn). */
const SPORT_PATTERNS: Array<[RegExp, SportTypeValue]> = [
  [/pickle\s?ball|pickle/i, 'PICKLEBALL'],
  [
    /(bóng\s*đá|bong\s*da|football)[^.]*(sân\s*7|san\s*7|7\s*người|7\s*nguoi)|sân\s*7|san\s*7/i,
    'FOOTBALL7',
  ],
  [/(bóng\s*đá|bong\s*da|football)/i, 'FOOTBALL5'], // mặc định bóng đá = sân 5
  [/cầu\s*lông|cau\s*long|badminton/i, 'BADMINTON'],
  [/tennis/i, 'TENNIS'],
];

/** Quận/huyện phổ biến HN + HCM (viết thường không dấu để match dễ). */
const LOCATIONS = [
  // Hà Nội
  'cầu giấy',
  'hoàn kiếm',
  'hoan kiem',
  'ba đình',
  'ba dinh',
  'đống đa',
  'dong da',
  'hai bà trưng',
  'hai ba trung',
  'thanh xuân',
  'tây hồ',
  'tay ho',
  'long biên',
  'long bien',
  'nam từ liêm',
  'nam tu liem',
  'bắc từ liêm',
  'bac tu liem',
  'hà đông',
  'ha dong',
  // TP.HCM
  'quận 1',
  'quan 1',
  'quận 2',
  'quan 2',
  'quận 3',
  'quan 3',
  'quận 4',
  'quan 4',
  'quận 5',
  'quan 5',
  'quận 6',
  'quan 6',
  'quận 7',
  'quan 7',
  'quận 8',
  'quan 8',
  'quận 10',
  'quan 10',
  'quận 11',
  'quan 11',
  'quận 12',
  'quan 12',
  'gò vấp',
  'go vap',
  'bình thanh',
  'binh thanh',
  'tân bình',
  'tan binh',
  'phú nhuận',
  'phu nhuan',
  'thủ đức',
  'thu duc',
  'bình tân',
  'binh tan',
];

/** Ngày tương đối: hôm nay / mai / mốt (+ ngày kia). */
export function resolveRelativeDate(text: string, now: Date): string | undefined {
  const t = text.toLowerCase();
  const day = 86_400_000;
  if (/hôm\s*nay|hôm nay|hom nay|toi nay|tối nay|chieu nay|chiều nay|sáng nay/.test(t)) {
    return new Date(now.getTime()).toISOString().slice(0, 10);
  }
  if (/(ngày\s*)?mai(?!\w)|(ngay\s*)?mai(?!\w)/.test(t)) {
    return new Date(now.getTime() + day).toISOString().slice(0, 10);
  }
  if (/mốt|mot(?!\w)|ngày\s*kia|ngay\s*kia/.test(t)) {
    return new Date(now.getTime() + 2 * day).toISOString().slice(0, 10);
  }
  return undefined;
}

/** Intent: giữ chỗ/đặt > hỏi lịch/trống; còn lại fallback. */
function detectIntent(text: string): NluResult['intent'] {
  const t = text.toLowerCase();
  if (
    // Lưu ý: KHÔNG dùng \b sau từ có dấu tiếng Việt (không phải [A-Za-z0-9_]).
    /(gi[ữu][^.]{0,12}ch[ôỗo])|((đặt|dat)[^.]{0,10}(sân|san|giờ|gio))|(book\b)|(holds?\b)/.test(t)
  ) {
    return 'HOLD_REQUEST';
  }
  if (
    /(trống|trong\s*(không)?|còn\s*(sân|giờ|lịch)|con\s*(san|gio|lich)|xem\s*lịch|xem\s*lich|lịch\s*(trống|sân)|lich\s*(trong|san)|giờ\s*nào|gio\s*nao|khung\s*giờ|khung\s*gio|slot|tìm\s*sân|tim\s*san|cho\s*mình\s*sân|cho\s*minh\s*san|sân\s*(gần|gan))/.test(
      t,
    )
  ) {
    return 'SEARCH_SLOTS';
  }
  return 'FALLBACK';
}

/**
 * NLU dựa trên luật (mặc định §3.12) — không tốn phí API, không gọi mạng.
 * Sau này GeminiNluAdapter cài cùng interface NluProvider để thay thế.
 */
@Injectable()
export class RuleBasedNluProvider implements NluProvider {
  async parse(text: string): Promise<NluResult> {
    const entities: NluEntities = {};

    for (const [pattern, sport] of SPORT_PATTERNS) {
      if (pattern.test(text)) {
        entities.sportType = sport;
        break;
      }
    }

    const lowerNoAccentFolded = text.toLowerCase();
    for (const loc of LOCATIONS) {
      if (lowerNoAccentFolded.includes(loc)) {
        entities.location = loc;
        break;
      }
    }

    // "sân Saigon còn giờ nào?" -> query tên sân cụ thể (2-24 ký tự sau chữ sân).
    const venueHintMatch = text.match(
      /(?:sân|san)\s+([a-zà-ỹ0-9][a-zà-ỹ0-9\s]{1,23}?)(?=\s+(còn|co|giờ|gio|lịch|lich|không|ko|$)|$)/i,
    );
    if (venueHintMatch) {
      entities.query = venueHintMatch[1].trim();
    }

    entities.dateHint = resolveRelativeDate(text, new Date());

    return { intent: detectIntent(text), entities };
  }
}
