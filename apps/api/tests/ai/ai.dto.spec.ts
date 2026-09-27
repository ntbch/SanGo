import { AiChatSchema } from '../../src/ai/dto/ai.dto';

describe('AI conversation limits', () => {
  it('accepts a long assistant reply on the next turn without relaxing user limits', () => {
    expect(AiChatSchema.safeParse({ message: 'Còn giờ khác không?', history: [
      { role: 'assistant', content: 'Thông tin sân. '.repeat(100) },
    ] }).success).toBe(true);
    expect(AiChatSchema.safeParse({ message: 'a'.repeat(501) }).success).toBe(false);
    expect(AiChatSchema.safeParse({ message: 'Tiếp', history: [
      { role: 'user', content: 'a'.repeat(501) },
    ] }).success).toBe(false);
  });

  it('retains finite history, role and nonempty content validation', () => {
    for (const history of [
      [{ role: 'assistant', content: 'a'.repeat(8001) }],
      [{ role: 'assistant', content: ' ' }],
      [{ role: 'system', content: 'x' }],
      Array.from({ length: 17 }, () => ({ role: 'user', content: 'x' })),
    ]) {
      expect(AiChatSchema.safeParse({ message: 'Tiếp', history }).success).toBe(false);
    }
  });

  it('rejects individually-valid turns whose combined context exceeds the total budget', () => {
    // 8 lượt assistant x 8000 ký tự = 64k, khối này được gửi lại ở MỌI lần gọi
    // llm.generate (tối đa 5 lần/request) trên endpoint public -> phải chặn TỔNG ở server.
    const manyLongReplies = Array.from({ length: 8 }, () => ({
      role: 'assistant' as const,
      content: 'a'.repeat(8000),
    }));
    expect(AiChatSchema.safeParse({ message: 'Tiếp', history: manyLongReplies }).success).toBe(false);

    // Ngay dưới trần vẫn phải qua.
    const withinBudget = Array.from({ length: 4 }, () => ({
      role: 'assistant' as const,
      content: 'a'.repeat(1500),
    }));
    expect(AiChatSchema.safeParse({ message: 'Tiếp', history: withinBudget }).success).toBe(true);
  });
});
