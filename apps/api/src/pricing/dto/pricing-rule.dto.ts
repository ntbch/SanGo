import { z } from 'zod';
import { DayType } from '@courthub/shared';

const ruleShape = z
  .object({
    dayType: z.nativeEnum(DayType),
    startMinute: z.number().int().min(0).max(1440),
    endMinute: z.number().int().min(0).max(1440),
    pricePerSlot: z.number().int().min(1000).max(100_000_000),
  })
  .refine((r) => r.startMinute < r.endMinute, {
    message: 'startMinute phải nhỏ hơn endMinute',
    path: ['endMinute'],
  });

/** REPLACE-ALL: mảng rules thay thế toàn bộ rules hiện có của court. */
export const ReplaceRulesSchema = z.object({ rules: z.array(ruleShape).max(50) }).refine(
  (body) => {
    // Cùng dayType không được chồng lấn khung giờ (tránh mơ hồ khi tính giá).
    const byDay = new Map<string, { startMinute: number; endMinute: number }[]>();
    for (const r of body.rules) {
      const arr = byDay.get(r.dayType) ?? [];
      arr.push(r);
      byDay.set(r.dayType, arr);
    }
    for (const windows of byDay.values()) {
      windows.sort((a, b) => a.startMinute - b.startMinute);
      for (let i = 1; i < windows.length; i++) {
        if (windows[i].startMinute < windows[i - 1].endMinute) return false;
      }
    }
    return true;
  },
  { message: 'Các rule cùng loại ngày không được chồng lấn khung giờ', path: ['rules'] },
);
export type ReplaceRulesDto = z.infer<typeof ReplaceRulesSchema>;
