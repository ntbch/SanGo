import type {
  LlmClient,
  LlmGenerateResult,
  LlmMessage,
  LlmToolCall,
  LlmToolDef,
} from './llm-client.interface';

/**
 * Gemini adapter qua REST generateContent (spec 2026-08-26 §3.1) — không thêm SDK.
 * Map hội thoại OpenAI-compatible <-> contents/parts của Gemini.
 */
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 12_000;

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}
interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export class GeminiLlmClient implements LlmClient {
  constructor(
    private readonly apiKey: string,
    private readonly model = 'gemini-2.5-flash',
  ) {}

  async generate(messages: LlmMessage[], tools: LlmToolDef[]): Promise<LlmGenerateResult> {
    const systemParts: GeminiPart[] = messages
      .filter((m) => m.role === 'system')
      .map((m) => ({ text: m.content ?? '' }));
    const contents: GeminiContent[] = [];
    for (const message of messages) {
      if (message.role === 'user') {
        contents.push({ role: 'user', parts: [{ text: message.content ?? '' }] });
      } else if (message.role === 'assistant') {
        const parts: GeminiPart[] = [];
        if (message.content !== undefined && message.content !== '') parts.push({ text: message.content });
        for (const call of message.toolCalls ?? []) {
          parts.push({ functionCall: { name: call.name, args: call.args } });
        }
        if (parts.length === 0) parts.push({ text: '' });
        contents.push({ role: 'model', parts });
      } else if (message.role === 'tool') {
        // Kết quả tool -> functionResponse (REST convention: role user + part functionResponse).
        contents.push({
          role: 'user',
          parts: [
            {
              functionResponse: {
                name: message.name ?? message.toolCallId ?? 'tool',
                response: { result: message.content ?? '{}' },
              },
            },
          ],
        });
      }
    }

    const body: Record<string, unknown> = { contents };
    if (systemParts.length > 0) body.systemInstruction = { parts: systemParts };
    if (tools.length > 0) {
      body.tools = [
        {
          functionDeclarations: tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        },
      ];
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(`${GEMINI_ENDPOINT}/${this.model}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Gemini HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`);
      }
      const json = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
      };
      const parts = json.candidates?.[0]?.content?.parts ?? [];
      let text = '';
      const toolCalls: LlmToolCall[] = [];
      for (const part of parts) {
        if (typeof part.text === 'string') text += part.text;
        else if (part.functionCall !== undefined) {
          toolCalls.push({
            id: 'call_' + toolCalls.length,
            name: part.functionCall.name,
            args: part.functionCall.args ?? {},
          });
        }
      }
      return { text: toolCalls.length > 0 && text === '' ? null : text, toolCalls };
    } finally {
      clearTimeout(timer);
    }
  }
}
