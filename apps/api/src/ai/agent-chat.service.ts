import { vnToday } from '@courthub/shared';
import { Injectable, Logger } from '@nestjs/common';
import type { AiChatResponse } from './ai-chat.service';
import { AiToolsService } from './ai-tools.service';
import type { ChatContext, ChatOrchestrator } from './chat-orchestrator.interface';
import type { SportTypeValue } from './dto/ai.dto';
import type { LlmClient, LlmMessage, LlmToolCall, LlmToolDef } from './llm/llm-client.interface';

/** Danh sách tool agent được phép gọi — CHỈ đọc DB, không có createHold (guardrail). */
export const AGENT_TOOL_NAMES = ['searchVenues', 'checkSlots', 'getSuggestedSlots'] as const;

const MAX_TOOL_ROUNDS = 4;
const MAX_HISTORY_TURNS = 8;
const TOOL_RESULT_MAX_CHARS = 4_000;

const SPORT_TYPES: SportTypeValue[] = [
  'FOOTBALL5',
  'FOOTBALL7',
  'PICKLEBALL',
  'BADMINTON',
  'TENNIS',
];

const TOOL_DEFS: LlmToolDef[] = [
  {
    name: 'searchVenues',
    description:
      'Tìm sân thể thao đã duyệt theo môn, khu vực/quận hoặc từ khoá tên sân. Trả tối đa 6 sân kèm giá từng sân con.',
    parameters: {
      type: 'object',
      properties: {
        sportType: { type: 'string', enum: [...SPORT_TYPES], description: 'Loại sân' },
        location: { type: 'string', description: 'Khu vực/quận người dùng nhắc, vd "Gò Vấp"' },
        query: { type: 'string', description: 'Từ khoá tên sân cụ thể' },
      },
    },
  },
  {
    name: 'checkSlots',
    description:
      'Xem các khung giờ trống trong một ngày của một sân con. courtId lấy từ kết quả searchVenues.',
    parameters: {
      type: 'object',
      properties: {
        courtId: { type: 'string', description: 'UUID sân con' },
        date: { type: 'string', description: 'Ngày dạng YYYY-MM-DD, mặc định hôm nay' },
      },
      required: ['courtId'],
    },
  },
  {
    name: 'getSuggestedSlots',
    description:
      'Gợi ý tối đa 4 khung giờ phù hợp cho sân con dựa trên lịch sử người dùng (server tự nhận diện user) hoặc giờ vàng.',
    parameters: {
      type: 'object',
      properties: {
        courtId: { type: 'string', description: 'UUID sân con' },
        date: { type: 'string', description: 'Ngày dạng YYYY-MM-DD, mặc định hôm nay' },
      },
      required: ['courtId'],
    },
  },
];

function systemPrompt(today: string): string {
  return [
    'Bạn là trợ lý đặt sân thể thao của CourtHub, trả lời tiếng Việt thân thiện.',
    `Hôm nay là ${today}.`,
    'QUY TẮC BẮT BUỘC:',
    '1. Mọi số liệu về sân, giá, giờ trống CHỈ được lấy từ kết quả tool. Không bịa, không suy diễn số liệu không có trong kết quả.',
    '2. TUYỆT ĐỐI không tự giữ chỗ, không hứa đặt/thanh toán hộ. Khi người dùng muốn giữ chỗ, hướng dẫn họ bấm chọn khung giờ rồi đăng nhập để bấm "Giữ chỗ" (miễn phí trong 10 phút).',
    '3. Trả lời ngắn gọn (dưới 120 từ), nêu tên sân và giá bằng đồng VND khi có.',
    '4. Người dùng nói "sân đó", "khung ấy", "mai"... thì dựa vào lịch sử hội thoại để gọi tool cho đúng.',
  ].join('\n');
}

const EMPTY_FALLBACK_REPLY =
  'Mình chưa hiểu ý bạn. Bạn thử: "cho mình sân pickleball ở Gò Vấp tối nay" nhé!';

/**
 * Agent tool-use (spec 2026-08-26 §3.2): model tự quyết định gọi tool đọc DB thật,
 * tối đa MAX_TOOL_ROUNDS vòng; mọi lỗi LLM -> delegate nguyên request về rule-based.
 */
@Injectable()
export class AgentChatService implements ChatOrchestrator {
  private readonly logger = new Logger(AgentChatService.name);

  constructor(
    private readonly llm: LlmClient,
    private readonly tools: AiToolsService,
    private readonly fallback: ChatOrchestrator,
  ) {}

  async chat(message: string, ctx?: ChatContext): Promise<AiChatResponse> {
    const today = vnToday();
    const history = ctx?.history ?? [];
    const messages: LlmMessage[] = [
      { role: 'system', content: systemPrompt(today) },
      ...history
        .slice(-MAX_HISTORY_TURNS)
        .map((turn) => ({ role: turn.role, content: turn.content }) as LlmMessage),
      { role: 'user', content: message },
    ];
    const data: AiChatResponse['data'] = {};
    const toolsUsed: string[] = [];
    try {
      for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
        const result = await this.llm.generate(messages, TOOL_DEFS);
        if (result.toolCalls.length === 0) {
          return this.finalize(result.text, data, toolsUsed, today);
        }
        messages.push({
          role: 'assistant',
          content: result.text ?? '',
          toolCalls: result.toolCalls,
        });
        for (const call of result.toolCalls) {
          const payload = await this.execTool(call, ctx, data, toolsUsed);
          messages.push({
            role: 'tool',
            toolCallId: call.id,
            name: call.name,
            content: JSON.stringify(payload).slice(0, TOOL_RESULT_MAX_CHARS),
          });
        }
      }
      // Hết ngân sách vòng vẫn đòi gọi tool -> ép chốt bằng text, không tool.
      const forced = await this.llm.generate(
        [
          ...messages,
          { role: 'user', content: 'Hết lượt gọi tool. Dựa trên dữ liệu đã có, hãy trả lời ngay.' },
        ],
        [],
      );
      return this.finalize(forced.text ?? '', data, toolsUsed, today);
    } catch (err) {
      this.logger.warn(
        `Agent LLM thất bại, rơi về rule-based: ${err instanceof Error ? err.message : String(err)}`,
      );
      return this.fallback.chat(message, ctx);
    }
  }

  /** Thực thi 1 tool call THẬT qua AiToolsService; lỗi trả về model dưới dạng {error}. */
  private async execTool(
    call: LlmToolCall,
    ctx: ChatContext | undefined,
    data: AiChatResponse['data'],
    toolsUsed: string[],
  ): Promise<unknown> {
    toolsUsed.push(call.name);
    try {
      switch (call.name) {
        case 'searchVenues': {
          const sportType = call.args.sportType;
          const venues = await this.tools.searchVenues({
            ...(typeof sportType === 'string' && (SPORT_TYPES as string[]).includes(sportType)
              ? { sportType: sportType as SportTypeValue }
              : {}),
            ...(typeof call.args.location === 'string' ? { location: call.args.location } : {}),
            ...(typeof call.args.query === 'string' ? { query: call.args.query } : {}),
          });
          data.venues = venues;
          return venues;
        }
        case 'checkSlots': {
          const courtId = typeof call.args.courtId === 'string' ? call.args.courtId : '';
          if (courtId === '') return { error: 'courtId bắt buộc' };
          const date = this.safeDate(call.args.date);
          const slots = await this.tools.checkSlots(courtId, date);
          data.slots = slots;
          data.courtId = courtId;
          return slots;
        }
        case 'getSuggestedSlots': {
          const courtId = typeof call.args.courtId === 'string' ? call.args.courtId : '';
          if (courtId === '') return { error: 'courtId bắt buộc' };
          const suggested = await this.tools.getSuggestedSlots(courtId, {
            date: this.safeDate(call.args.date),
            userId: ctx?.user?.id,
          });
          data.suggestions = suggested.suggestions;
          data.courtId = courtId;
          return suggested;
        }
        default:
          return { error: `tool không tồn tại: ${call.name}` };
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }

  private safeDate(raw: unknown): string {
    return typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : vnToday();
  }

  /** Chốt response: suy luận intent + gắn dateHint theo shape cũ của /ai/chat. */
  private finalize(
    text: string | null,
    data: AiChatResponse['data'],
    toolsUsed: string[],
    today: string,
  ): AiChatResponse {
    const reply = text !== null && text.trim() !== '' ? text.trim() : EMPTY_FALLBACK_REPLY;
    const intent: AiChatResponse['intent'] =
      data.suggestions !== undefined
        ? 'HOLD_REQUEST'
        : data.venues !== undefined || data.slots !== undefined
          ? 'SEARCH_SLOTS'
          : 'FALLBACK';
    return { intent, reply, toolsUsed, data: { ...data, dateHint: today } };
  }
}
