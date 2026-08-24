import { useMutation, useQuery } from '@tanstack/react-query';

import type { SuggestedSlotsResponse } from './types';

import { createAiHold, fetchAiSuggestedSlots, sendAiChat } from './api';

/** Mutation chat AI — component tự quản lý lịch sử hội thoại phía client. */
export function useAiChat() {
  return useMutation({ mutationFn: (message: string) => sendAiChat(message) });
}

/** Dải gợi ý giờ chơi AI-2 — chỉ bật khi có courtId đang xem. */
export function useAiSuggestedSlots(
  courtId: string | undefined,
  date?: string,
): ReturnType<typeof useQuery<SuggestedSlotsResponse>> {
  return useQuery({
    queryKey: ['ai', 'suggested-slots', courtId, date ?? ''],
    queryFn: () => fetchAiSuggestedSlots(courtId as string, date),
    enabled: courtId !== undefined && courtId !== '',
  });
}

/** Giữ chỗ từ chat — lỗi 401 để widget chuyển hướng đăng nhập. */
export function useCreateAiHold() {
  return useMutation({
    mutationFn: (payload: Parameters<typeof createAiHold>[0]) => createAiHold(payload),
  });
}
