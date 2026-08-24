/**
 * Lọc chip gợi ý AI theo trạng thái slot hiện tại (G2-FIX t11).
 * getSuggestedSlots không đối chiếu trạng thái — phía web phải gọi song song
 * GET /courts/:id/slots và loại chip có slot không còn AVAILABLE;
 * còn lại <=1 chip thì ẩn cả dải để tránh nhiễu.
 */
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '../../lib/api/client';
import { endpoints } from '../../lib/api/endpoints';

import { useAiSuggestedSlots } from './queries';
import type { AiSlotSuggestion } from './types';

interface CourtDaySlots {
  courtId: string;
  byDate: Array<{
    date: string;
    slots: Array<{ startMinute: number; endMinute: number; state: string }>;
  }>;
}

export interface FilteredSuggestionsResult {
  /** Chip đã lọc; rỗng khi đang tải, lỗi hoặc còn lại < 2 chip hợp lệ. */
  suggestions: AiSlotSuggestion[];
}

/** Ngưỡng tối thiểu để hiển thị dải gợi ý. */
const MIN_VISIBLE_CHIPS = 2;

export function useFilteredAiSuggestions(
  courtId: string | undefined,
  fallbackDate?: string,
): FilteredSuggestionsResult {
  const suggestionsQuery = useAiSuggestedSlots(courtId, fallbackDate);
  const date = suggestionsQuery.data !== undefined ? suggestionsQuery.data.date : fallbackDate;

  // Trạng thái slot của đúng ngày được gợi ý (days=1 cho nhẹ).
  const slotsQuery = useQuery<CourtDaySlots>({
    queryKey: ['ai', 'suggestion-slot-states', courtId, date ?? ''],
    queryFn: () =>
      apiFetch<CourtDaySlots>(
        endpoints.venues.courtSlots(courtId as string, { from: date as string, days: 1 }),
      ),
    enabled: courtId !== undefined && courtId !== '' && date !== undefined,
  });

  if (suggestionsQuery.data === undefined || slotsQuery.data === undefined) {
    return { suggestions: [] };
  }

  const day = slotsQuery.data.byDate.find((entry) => entry.date === date);
  const availableStarts = new Set(
    (day !== undefined ? day.slots : [])
      .filter((slot) => slot.state === 'AVAILABLE')
      .map((slot) => slot.startMinute),
  );
  const filtered = suggestionsQuery.data.suggestions.filter((suggestion) =>
    availableStarts.has(suggestion.startMinute),
  );

  return { suggestions: filtered.length >= MIN_VISIBLE_CHIPS ? filtered : [] };
}
