import { GeminiLlmClient } from './gemini.client';
import { createLlmClient } from './llm-client.factory';
import type { LlmMessage, LlmToolDef } from './llm-client.interface';

const TOOLS: LlmToolDef[] = [
  {
    name: 'searchVenues',
    description: 'Tìm sân',
    parameters: { type: 'object', properties: { location: { type: 'string' } } },
  },
];

function okResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), { status: 200 });
}

describe('GeminiLlmClient', () => {
  afterEach(() => jest.restoreAllMocks());

  it('map message -> contents và parse functionCall thành toolCalls', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      okResponse({
        candidates: [
          {
            content: {
              parts: [
                { text: 'Để mình tìm sân nhé' },
                { functionCall: { name: 'searchVenues', args: { location: 'Gò Vấp' } } },
              ],
            },
          },
        ],
      }),
    );
    const client = new GeminiLlmClient('test-key', 'gemini-2.5-flash');
    const messages: LlmMessage[] = [
      { role: 'system', content: 'Bạn là trợ lý CourtHub.' },
      { role: 'user', content: 'Tìm sân Gò Vấp' },
      {
        role: 'assistant',
        content: 'ok',
        toolCalls: [{ id: 'call_0', name: 'searchVenues', args: {} }],
      },
      { role: 'tool', toolCallId: 'call_0', name: 'searchVenues', content: '{"venues":[]}' },
    ];
    const result = await client.generate(messages, TOOLS);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('models/gemini-2.5-flash:generateContent');
    const headers = init.headers as Record<string, string>;
    expect(headers['x-goog-api-key']).toBe('test-key');
    const body = JSON.parse(init.body as string);
    expect(body.systemInstruction.parts[0].text).toContain('CourtHub');
    expect(body.tools[0].functionDeclarations[0].name).toBe('searchVenues');
    // user -> role user; assistant có toolCall -> role model + functionCall part; tool -> functionResponse part.
    expect(body.contents[0]).toEqual({ role: 'user', parts: [{ text: 'Tìm sân Gò Vấp' }] });
    const modelTurn = body.contents.find((c: { role: string }) => c.role === 'model');
    expect(modelTurn.parts.some((p: { functionCall?: unknown }) => p.functionCall)).toBe(true);
    const toolTurn = body.contents.find((c: { parts: { functionResponse?: unknown }[] }) =>
      c.parts.some((p) => p.functionResponse),
    );
    expect(toolTurn.parts[0].functionResponse.name).toBe('searchVenues');
    expect(toolTurn.parts[0].functionResponse.response.result).toContain('venues');

    expect(result.text).toBe('Để mình tìm sân nhé');
    expect(result.toolCalls).toEqual([
      { id: 'call_0', name: 'searchVenues', args: { location: 'Gò Vấp' } },
    ]);
  });

  it('HTTP lỗi (429 hết quota) -> reject kèm status', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ error: 'quota' }), { status: 429 }));
    const client = new GeminiLlmClient('test-key');
    await expect(client.generate([{ role: 'user', content: 'hi' }], [])).rejects.toThrow(/429/);
  });

  it('candidates rỗng (safety block) -> reject để agent rơi rule-based', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse({}));
    const client = new GeminiLlmClient('test-key');
    await expect(client.generate([{ role: 'user', content: 'hi' }], [])).rejects.toThrow(
      /rỗng|safety/,
    );
  });
});

describe('createLlmClient factory', () => {
  const OLD = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD };
  });
  afterAll(() => {
    process.env = OLD;
  });

  it('LLM_PROVIDER=none -> undefined (rule-based giữ nguyên)', () => {
    process.env.LLM_PROVIDER = 'none';
    process.env.GEMINI_API_KEY = 'key';
    expect(createLlmClient()).toBeUndefined();
  });

  it('provider gemini thiếu key -> undefined; đủ key -> client', () => {
    delete process.env.LLM_PROVIDER;
    delete process.env.GEMINI_API_KEY;
    expect(createLlmClient()).toBeUndefined();
    process.env.LLM_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'abc';
    expect(createLlmClient()).toBeDefined();
  });
});
