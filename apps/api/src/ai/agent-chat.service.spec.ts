import { NotFoundException } from '@nestjs/common';
import { AgentChatService, AGENT_TOOL_NAMES } from './agent-chat.service';
import type {
  LlmClient,
  LlmGenerateResult,
  LlmMessage,
  LlmToolDef,
} from './llm/llm-client.interface';

/** LlmClient giả: trả tuần tự script hoặc lỗi; nhớ lại mọi lượt generate. */
function fakeLlm(
  script: Array<Partial<LlmGenerateResult> | Error>,
): LlmClient & { calls: LlmMessage[][]; toolsSeen: LlmToolDef[][] } {
  const queue = [...script];
  const calls: LlmMessage[][] = [];
  const toolsSeen: LlmToolDef[][] = [];
  return {
    calls,
    toolsSeen,
    async generate(messages: LlmMessage[], tools: LlmToolDef[]) {
      calls.push(messages);
      toolsSeen.push(tools);
      const next = queue.length > 1 ? queue.shift() : queue[0];
      if (next instanceof Error) throw next;
      return { text: null, toolCalls: [], ...(next as Partial<LlmGenerateResult>) };
    },
  } as unknown as LlmClient & { calls: LlmMessage[][]; toolsSeen: LlmToolDef[][] };
}

/** Stub AiToolsService — chỉ cần 3 method agent được phép gọi. */
const toolsStub = {
  searchVenues: jest.fn().mockResolvedValue([
    {
      venueId: 'v1',
      name: 'Sân Pickleball Saigon',
      address: '12 Lê Văn Việt',
      minPrice: 50_000,
      courts: [
        {
          courtId: 'c1',
          name: 'Sân 1',
          sportType: 'PICKLEBALL',
          pricePerSlot: 50_000,
          slotMinutes: 90,
        },
      ],
    },
  ]),
  checkSlots: jest.fn().mockResolvedValue({
    courtId: 'c1',
    courtName: 'Sân 1',
    date: '2026-08-26',
    slotMinutes: 90,
    available: [{ label: '17:00–18:30', startMinute: 1020, endMinute: 1110 }],
  }),
  getSuggestedSlots: jest.fn().mockResolvedValue({
    courtId: 'c1',
    date: '2026-08-26',
    suggestions: [{ startMinute: 1020, label: '17:00–18:30', score: 5, reason: 'Giờ vàng' }],
  }),
};

const fallbackStub: { chat: jest.Mock } = {
  chat: jest.fn().mockResolvedValue({
    intent: 'FALLBACK',
    reply: 'rule-based-reply',
    toolsUsed: [],
    data: {},
  }),
};

function makeAgent(llm: LlmClient): AgentChatService {
  return new AgentChatService(llm, toolsStub as never, fallbackStub);
}

describe('AgentChatService (spec 2026-08-26 §3.2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('(a) model trả text thuần -> FALLBACK, không gọi tool', async () => {
    const llm = fakeLlm([{ text: 'Chào bạn! Mình giúp tìm sân nhé.' }]);
    const res = await makeAgent(llm).chat('xin chào');
    expect(res.intent).toBe('FALLBACK');
    expect(res.reply).toContain('Chào bạn');
    expect(res.toolsUsed).toEqual([]);
    expect(toolsStub.searchVenues).not.toHaveBeenCalled();
  });

  it('(b) searchVenues -> checkSlots -> text: đủ toolsUsed + data thật, intent SEARCH_SLOTS', async () => {
    const llm = fakeLlm([
      {
        toolCalls: [
          {
            id: 'call_0',
            name: 'searchVenues',
            args: { location: 'Gò Vấp', sportType: 'PICKLEBALL' },
          },
        ],
      },
      {
        toolCalls: [
          { id: 'call_1', name: 'checkSlots', args: { courtId: 'c1', date: '2026-08-26' } },
        ],
      },
      { text: 'Sân Pickleball Saigon còn giờ 17:00–18:30 nhé.' },
    ]);
    const res = await makeAgent(llm).chat('sân pickleball Gò Vấp tối nay');
    expect(res.toolsUsed).toEqual(['searchVenues', 'checkSlots']);
    expect(res.intent).toBe('SEARCH_SLOTS');
    expect(res.data.venues?.[0]?.name).toBe('Sân Pickleball Saigon');
    expect(res.data.slots?.available[0]?.label).toBe('17:00–18:30');
    // Kết quả tool thật được feed ngược vào messages cho lượt sau.
    const secondRoundMessages = llm.calls[1] ?? [];
    const toolMsg = secondRoundMessages.find((m) => m.role === 'tool');
    expect(toolMsg?.content ?? '').toContain('venueId');
    expect(toolsStub.checkSlots).toHaveBeenCalledWith('c1', '2026-08-26');
  });

  it('(c) tool ném lỗi -> error JSON feedback, agent vẫn chốt text bình thường', async () => {
    toolsStub.searchVenues.mockRejectedValueOnce(new NotFoundException('DB lỗi'));
    const llm = fakeLlm([
      { toolCalls: [{ id: 'call_0', name: 'searchVenues', args: {} }] },
      { text: 'Hệ thống đang bận, bạn thử lại nhé.' },
    ]);
    const res = await makeAgent(llm).chat('tìm sân');
    expect(res.reply).toContain('bận');
    expect(res.toolsUsed).toEqual(['searchVenues']);
  });

  it('(d) LLM lỗi mạng/quota -> delegate nguyên request sang rule-based fallback', async () => {
    const llm = fakeLlm([new Error('Gemini HTTP 429')]);
    const res = await makeAgent(llm).chat('cho sân cầu lông');
    expect(res).toEqual({ intent: 'FALLBACK', reply: 'rule-based-reply', toolsUsed: [], data: {} });
    expect(fallbackStub.chat).toHaveBeenCalledWith('cho sân cầu lông', undefined);
  });

  it('(e) model đòi gọi tool mãi -> dừng ở vòng 4 rồi ép chốt không tool', async () => {
    const llm = fakeLlm([]); // queue rỗng: mặc định trả tool call mỗi lượt...
    void llm;
    const scripted = fakeLlmWithAlwaysToolThenText();
    const res = await makeAgent(scripted.llm).chat('giúp mình');
    expect(scripted.llm.calls.length).toBeLessThanOrEqual(5); // 4 vòng + 1 ép chốt
    expect(scripted.llm.toolsSeen[scripted.llm.toolsSeen.length - 1]).toEqual([]);
    expect(res.reply.length).toBeGreaterThan(0);
  });

  it('(f) GUARDRAIL: chỉ expose đúng 3 tool đọc, không có createHold', () => {
    expect([...AGENT_TOOL_NAMES].sort()).toEqual([
      'checkSlots',
      'getSuggestedSlots',
      'searchVenues',
    ]);
    expect(AGENT_TOOL_NAMES).not.toContain('createHold');
  });

  it('(g) userId do server gán từ JWT, getSuggestedSlots nhận đúng user', async () => {
    const llm = fakeLlm([
      { toolCalls: [{ id: 'call_0', name: 'getSuggestedSlots', args: { courtId: 'c1' } }] },
      { text: 'Mình gợi ý khung 17:00 cho bạn.' },
    ]);
    const res = await makeAgent(llm).chat('gợi ý giờ đi', { user: { id: 'u9' }, history: [] });
    expect(toolsStub.getSuggestedSlots).toHaveBeenCalledWith('c1', {
      date: expect.any(String),
      userId: 'u9',
    });
    expect(res.intent).toBe('HOLD_REQUEST');
    expect(res.data.suggestions?.[0]?.label).toBe('17:00–18:30');
  });
});

/** Fake luôn trả toolCall, riêng lượt tools=[] thì trả text (ép chốt). */
function fakeLlmWithAlwaysToolThenText(): {
  llm: LlmClient & { calls: LlmMessage[][]; toolsSeen: LlmToolDef[][] };
} {
  let rounds = 0;
  const calls: LlmMessage[][] = [];
  const toolsSeen: LlmToolDef[][] = [];
  const llm = {
    calls,
    toolsSeen,
    async generate(messages: LlmMessage[], tools: LlmToolDef[]) {
      calls.push(messages);
      toolsSeen.push(tools);
      rounds += 1;
      if (tools.length === 0 || rounds > 10)
        return { text: 'Dựa trên dữ liệu hiện có...', toolCalls: [] };
      return {
        text: null,
        toolCalls: [{ id: 'call_x' + rounds, name: 'searchVenues', args: {} }],
      };
    },
  } as unknown as LlmClient & { calls: LlmMessage[][]; toolsSeen: LlmToolDef[][] };
  return { llm };
}
