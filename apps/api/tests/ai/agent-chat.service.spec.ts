import { NotFoundException } from '@nestjs/common';
import { AgentChatService, AGENT_TOOL_NAMES } from '../../src/ai/agent-chat.service';
import type {
  LlmClient,
  LlmGenerateResult,
  LlmMessage,
  LlmToolDef,
} from '../../src/ai/llm/llm-client.interface';

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

/** courtId hợp lệ cho test — execTool chặn UUID sai (review B-L5). */
const COURT_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';

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
          { id: 'call_1', name: 'checkSlots', args: { courtId: COURT_ID, date: '2026-08-26' } },
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
    expect(toolsStub.checkSlots).toHaveBeenCalledWith(COURT_ID, '2026-08-26');
  });

  it('(c) tool ném lỗi -> error JSON feedback, agent vẫn chốt text bình thường', async () => {
    toolsStub.searchVenues.mockRejectedValueOnce(new NotFoundException('DB lỗi'));
    const llm = fakeLlm([
      { toolCalls: [{ id: 'call_0', name: 'searchVenues', args: {} }] },
      { text: 'Hệ thống đang bận, bạn thử lại nhé.' },
    ]);
    const res = await makeAgent(llm).chat('tìm sân');
    expect(res.reply).toContain('bận');
    // Chỉ ghi tool THÀNH CÔNG — call lỗi không được badge [tool ] ở UI.
    expect(res.toolsUsed).toEqual([]);
  });

  it('(d) LLM lỗi mạng/quota -> delegate nguyên request sang rule-based fallback', async () => {
    const llm = fakeLlm([new Error('Gemini HTTP 429')]);
    const res = await makeAgent(llm).chat('cho sân cầu lông');
    expect(res).toEqual({ intent: 'FALLBACK', reply: 'rule-based-reply', toolsUsed: [], data: {} });
    expect(fallbackStub.chat).toHaveBeenCalledWith('cho sân cầu lông', undefined);
  });

  it('(e) model đòi gọi tool mãi -> dừng ở vòng 4 rồi ép chốt không tool', async () => {
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
      { toolCalls: [{ id: 'call_0', name: 'getSuggestedSlots', args: { courtId: COURT_ID } }] },
      { text: 'Mình gợi ý khung 17:00 cho bạn.' },
    ]);
    const res = await makeAgent(llm).chat('gợi ý giờ đi', { user: { id: 'u9' }, history: [] });
    expect(toolsStub.getSuggestedSlots).toHaveBeenCalledWith(COURT_ID, {
      date: expect.any(String),
      userId: 'u9',
    });
    expect(res.intent).toBe('HOLD_REQUEST');
    expect(res.data.suggestions?.[0]?.label).toBe('17:00–18:30');
  });

  it('(h) US-AI-02: history vào messages dạng khối nhãn, chỉ giữ 8 lượt gần nhất', async () => {
    const llm = fakeLlm([{ text: 'ok' }]);
    const history = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: 'lượt-' + i,
    }));
    await makeAgent(llm).chat('câu hỏi hiện tại', { user: { id: 'u1' }, history });
    const firstCall = llm.calls[0] ?? [];
    expect(firstCall[0]?.role).toBe('system');
    // History gộp MỘT khối user có nhãn — client không thể giả mạo lượt assistant.
    const historyBlock = firstCall.find(
      (m) => m.role === 'user' && m.content?.includes('LỊCH SỬ HỘI THOẠI'),
    );
    expect(historyBlock).toBeDefined();
    expect(firstCall.filter((m) => m.role === 'assistant')).toEqual([]);
    expect(historyBlock?.content ?? '').toContain('Trợ lý: lượt-9'); // lượt cuối giữ lại
    expect(historyBlock?.content ?? '').not.toContain('lượt-0'); // cắt bớt lượt cũ
    expect(firstCall[firstCall.length - 1]?.content).toBe('câu hỏi hiện tại');
  });

  it('(i) ngân sách thời gian cạn -> fallback ngay, không gọi LLM', async () => {
    const llm = fakeLlm([{ text: 'không bao giờ được gọi' }]);
    const agent = new AgentChatService(llm, toolsStub as never, fallbackStub, 0);
    const res = await agent.chat('tìm sân');
    expect(res.reply).toBe('rule-based-reply');
    expect(llm.calls.length).toBe(0);
  });

  it('(j) tối đa 3 tool call mỗi vòng, phần thừa nhận lỗi bỏ qua', async () => {
    const fiveCalls = Array.from({ length: 5 }, (_, i) => ({
      id: 'call_' + i,
      name: 'searchVenues',
      args: {},
    }));
    const llm = fakeLlm([{ toolCalls: fiveCalls }, { text: 'xong' }]);
    const res = await makeAgent(llm).chat('quá nhiều tool');
    expect(toolsStub.searchVenues).toHaveBeenCalledTimes(3);
    const toolMsgs = (llm.calls[1] ?? []).filter((m) => m.role === 'tool');
    expect(toolMsgs.length).toBe(5); // 3 kết quả + 2 thông báo bỏ qua
    expect(toolMsgs[4]?.content ?? '').toContain('Bỏ qua');
    expect(res.reply).toBe('xong');
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
