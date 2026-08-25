import { vnToday } from '@courthub/shared';
import { Inject, Injectable } from '@nestjs/common';
import { AiToolsService } from './ai-tools.service';
import type { NluProvider } from './nlu-provider.interface';
import type { ChatContext, ChatOrchestrator } from './chat-orchestrator.interface';
import type { AiVenueCard } from './dto/ai.dto';

export interface AiChatResponse {
  intent: 'SEARCH_SLOTS' | 'HOLD_REQUEST' | 'FALLBACK';
  /** Câu trả lời hiển thị trong bubble AI — chỉ dùng số liệu từ tool thật. */
  reply: string;
  /** Tên các tool đã chạy để UI hiện "[tool: xxx ✓]" (minh bạch anti-hallucination). */
  toolsUsed: string[];
  data: {
    venues?: Awaited<ReturnType<AiToolsService['searchVenues']>>;
    slots?: Awaited<ReturnType<AiToolsService['checkSlots']>>;
    suggestions?: Awaited<ReturnType<AiToolsService['getSuggestedSlots']>>['suggestions'];
    courtId?: string;
    dateHint?: string;
  };
}

/** Chọn venue khớp hint tên sân (nếu có), ưu tiên venue có court khớp sportType. */
function pickVenue(venues: AiVenueCard[], hint?: string): AiVenueCard | undefined {
  if (venues.length === 0) return undefined;
  if (hint) {
    const h = hint.toLowerCase();
    const matched = venues.find((v) => v.name.toLowerCase().includes(h));
    if (matched) return matched;
  }
  return venues[0];
}

/**
 * Điều phối chat AI-1 (§3.12): parse NLU -> gọi tool nội bộ đọc DB thật -> dựng reply.
 * GUARDRAIL: KHÔNG bao giờ tự tạo hold/thanh toán trong chat — muốn giữ chỗ người
 * dùng phải bấm chip giờ rồi gọi POST /ai/hold bằng JWT của mình.
 */
@Injectable()
export class AiChatService implements ChatOrchestrator {
  constructor(
    @Inject('NluProvider') private readonly nlu: NluProvider,
    private readonly tools: AiToolsService,
  ) {}

  async chat(message: string, ctx?: ChatContext): Promise<AiChatResponse> {
    const user = ctx?.user;
    const parsed = await this.nlu.parse(message);
    const today = vnToday();
    const dateHint = parsed.entities.dateHint ?? today;

    if (parsed.intent === 'SEARCH_SLOTS') {
      const venues = await this.tools.searchVenues(parsed.entities);
      const toolsUsed = ['searchVenues'];
      let slots: AiChatResponse['data']['slots'];
      const venue = pickVenue(venues, parsed.venueHint ?? parsed.entities.query);
      const court = venue?.courts[0];
      if (court) {
        slots = await this.tools.checkSlots(court.courtId, dateHint);
        toolsUsed.push('checkSlots');
      }
      return {
        intent: 'SEARCH_SLOTS',
        reply: this.buildSearchReply(venues, slots),
        toolsUsed,
        data: { venues, slots, dateHint },
      };
    }

    if (parsed.intent === 'HOLD_REQUEST') {
      // Đề xuất giờ (AI-2) thay vì giữ hộ — giữ chỗ bắt buộc JWT qua POST /ai/hold.
      const venues = await this.tools.searchVenues(parsed.entities);
      const toolsUsed = ['searchVenues'];
      let suggestions: AiChatResponse['data']['suggestions'];
      let courtId: string | undefined;
      const venue = venues[0];
      const court = venue?.courts[0];
      if (court) {
        const suggested = await this.tools.getSuggestedSlots(court.courtId, {
          date: dateHint,
          userId: user?.id,
        });
        suggestions = suggested.suggestions;
        courtId = court.courtId;
        toolsUsed.push('getSuggestedSlots');
      }
      return {
        intent: 'HOLD_REQUEST',
        reply:
          'Mình không thể giữ chỗ trực tiếp. Bạn chọn một khung giờ gợi ý bên dưới' +
          ', đăng nhập rồi bấm "Giữ chỗ" nhé (giữ chỗ miễn phí trong 10 phút).',
        toolsUsed,
        data: { venues, suggestions, courtId, dateHint },
      };
    }

    // FALLBACK: chào hỏi + hướng dẫn ngắn.
    return {
      intent: 'FALLBACK',
      reply: [
        'Chào bạn! Mình giúp tìm sân và xem lịch trống 🏸',
        'Bạn thử: "cho mình sân pickleball gần Gò Vấp tối nay" hoặc "sân X còn giờ nào ngày mai?".',
        'Khi thấy giờ ưng ý, đăng nhập và bấm "Giữ chỗ" — mình không tự đặt giúp bạn.',
      ].join('\n'),
      toolsUsed: [],
      data: {},
    };
  }

  private buildSearchReply(
    venues: Awaited<ReturnType<AiToolsService['searchVenues']>>,
    slots: AiChatResponse['data']['slots'],
  ): string {
    if (venues.length === 0) {
      return 'Mình chưa tìm được sân phù hợp. Bạn thử nới khu vực hoặc đổi loại sân nhé!';
    }
    const lines = ['Mình tìm được ' + venues.length + ' sân:'];
    for (const v of venues.slice(0, 3)) {
      lines.push(
        '• ' +
          v.name +
          (v.minPrice !== null ? ' · từ ' + v.minPrice.toLocaleString('vi-VN') + '₫' : ''),
      );
    }
    if (slots && slots.available.length > 0) {
      lines.push(
        slots.courtName +
          ' ngày ' +
          slots.date +
          ' còn ' +
          slots.available.length +
          ' khung trống, ví dụ ' +
          slots.available
            .slice(0, 3)
            .map((s) => s.label)
            .join(', '),
      );
    } else if (slots) {
      lines.push(slots.courtName + ' ngày ' + slots.date + ' hiện hết giờ trống.');
    }
    return lines.join('\n');
  }
}
