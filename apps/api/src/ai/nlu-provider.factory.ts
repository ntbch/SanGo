import { RuleBasedNluProvider } from './rule-based-nlu.provider';
import type { NluProvider } from './nlu-provider.interface';

/**
 * Factory chọn NLU provider (§3.12): mặc định rule-based miễn phí.
 *
 * TODO(GeminiAdapter): khi cài adapter thật, trả GeminiNluAdapter tại đây khi
 * process.env.GEMINI_API_KEY có giá trị; key chưa cấu hình -> dùng rule-based.
 * Adapter phải cài cùng interface NluProvider và giữ nguyên guardrail:
 * mọi số liệu slot vẫn phải đến từ tool-call DB thật.
 */
export function createNluProvider(): NluProvider {
  return new RuleBasedNluProvider();
}
