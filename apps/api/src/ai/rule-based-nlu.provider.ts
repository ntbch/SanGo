import { HANOI_DISTRICT_ALIASES, vnToday } from '@courthub/shared';
import { Injectable } from '@nestjs/common';
import type { SportTypeValue } from './dto/ai.dto';
import type { NluEntities, NluProvider, NluResult } from './nlu-provider.interface';

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

const HANOI_ALIASES_SORTED = Object.entries(HANOI_DISTRICT_ALIASES).sort(
  (a, b) => b[0].length - a[0].length,
);

const HCM_ALIASES_SORTED = Object.entries(HCM_LOCATIONS).sort(
  (a, b) => b[0].length - a[0].length,
);

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

    for (const [alias, standard] of HANOI_ALIASES_SORTED) {
      if (alias.length <= 4) {
        const regex = new RegExp(`(^|\\s)${alias}($|\\s|[.,!?])`, 'i');
        if (regex.test(lower)) {
          entities.location = standard.toLowerCase();
          break;
        }
      } else if (lower.includes(alias)) {
        entities.location = standard.toLowerCase();
        break;
      }
    }

    if (!entities.location) {
      for (const [alias, standard] of HCM_ALIASES_SORTED) {
        if (lower.includes(alias)) {
          entities.location = standard.toLowerCase();
          break;
        }
      }
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
