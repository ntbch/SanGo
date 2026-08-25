import { HANOI_DISTRICT_ALIASES, vnToday } from '@courthub/shared';
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
  [/(bóng\s*đá|bong\s*da|football)/i, 'FOOTBALL5'],
  [/cầu\s*lông|cau\s*long|badminton/i, 'BADMINTON'],
  [/tennis/i, 'TENNIS'],
];

const HCM_LOCATIONS: Record<string, string> = {
  'quan 1': 'quận 1',
  'quận 1': 'quận 1',
  'quan 2': 'quận 2',
  'quận 2': 'quận 2',
  'quan 3': 'quận 3',
  'quận 3': 'quận 3',
  'quan 4': 'quận 4',
  'quận 4': 'quận 4',
  'quan 5': 'quận 5',
  'quận 5': 'quận 5',
  'quan 6': 'quận 6',
  'quận 6': 'quận 6',
  'quan 7': 'quận 7',
  'quận 7': 'quận 7',
  'quan 8': 'quận 8',
  'quận 8': 'quận 8',
  'quan 10': 'quận 10',
  'quận 10': 'quận 10',
  'quan 11': 'quận 11',
  'quận 11': 'quận 11',
  'quan 12': 'quận 12',
  'quận 12': 'quận 12',
  'go vap': 'gò vấp',
  'gò vấp': 'gò vấp',
  'binh thanh': 'bình thạnh',
  'bình thạnh': 'bình thạnh',
  'bình thanh': 'bình thạnh',
  'tan binh': 'tân bình',
  'tân bình': 'tân bình',
  'phu nhuan': 'phú nhuận',
  'phú nhuận': 'phú nhuận',
  'thu duc': 'thủ đức',
  'thủ đức': 'thủ đức',
  'binh tan': 'bình tân',
  'bình tân': 'bình tân',
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface LocationMatch {
  index: number;
  length: number;
  district: string;
}

/** Danh mục alias toàn bộ (Hà Nội + HCM) */
const ALL_LOCATION_ALIASES: Array<{ alias: string; standard: string }> = [
  ...Object.entries(HANOI_DISTRICT_ALIASES).map(([alias, standard]) => ({
    alias,
    standard: standard.toLowerCase(),
  })),
  ...Object.entries(HCM_LOCATIONS).map(([alias, standard]) => ({
    alias,
    standard: standard.toLowerCase(),
  })),
];

export function resolveRelativeDate(text: string, now: Date): string | undefined {
  const t = text.toLowerCase();
  const day = 86_400_000;
  if (/hôm\s*nay|hôm nay|hom nay|toi nay|tối nay|chieu nay|chiều nay|sáng nay/.test(t)) {
    return vnToday(new Date(now.getTime()));
  }
  if (/(ngày\s*)?mai(?!\w)|(ngay\s*)?mai(?!\w)/.test(t)) {
    return vnToday(new Date(now.getTime() + day));
  }
  if (/mốt|mot(?!\w)|ngày\s*kia|ngay\s*kia/.test(t)) {
    return vnToday(new Date(now.getTime() + 2 * day));
  }
  return undefined;
}

function detectIntent(text: string): NluResult['intent'] {
  const t = text.toLowerCase();
  if (
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

    const lower = text.toLowerCase();
    const matches: LocationMatch[] = [];

    for (const { alias, standard } of ALL_LOCATION_ALIASES) {
      // Khớp nguyên từ / ranh giới từ để tránh lỗi substring (vd: 'san trong nha dong nguoi')
      const regex = new RegExp(
        '(^|[^a-zà-ỹ0-9_])' + escapeRegex(alias) + '([^a-zà-ỹ0-9_]|$)',
        'gi',
      );
      let match: RegExpExecArray | null;
      while ((match = regex.exec(lower)) !== null) {
        const prefixLen = match[1].length;
        const matchIndex = match.index + prefixLen;
        matches.push({
          index: matchIndex,
          length: alias.length,
          district: standard,
        });
        // Tránh vòng lặp vô tận nếu match rỗng
        if (regex.lastIndex === match.index) {
          regex.lastIndex++;
        }
      }
    }

    if (matches.length > 0) {
      // EC-07: Ưu tiên xuất hiện SỚM NHẤT trong câu, cùng vị trí thì chọn alias DÀI NHẤT
      matches.sort((a, b) => {
        if (a.index !== b.index) {
          return a.index - b.index;
        }
        return b.length - a.length;
      });
      entities.location = matches[0].district;
    }

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
