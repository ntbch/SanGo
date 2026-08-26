import { DayType } from '@sango/shared';
import type { Court, PricingRule } from '@prisma/client';

/** Ngày lưu UTC-midnight theo quy ước đặc tả §5 -> dayType suy từ thứ của ngày VN. */
export function dayTypeForDate(date: Date): DayType {
  const dow = date.getUTCDay(); // 0=CN, 6=T7
  return dow === 0 || dow === 6 ? DayType.WEEKEND : DayType.WEEKDAY;
}

/**
 * Giá 1 slot: rule ghi đè áp dụng khi slot nằm TRỌN trong khung rule cùng loại ngày,
 * ngược lại dùng giá mặc định của sân con.
 */
export function priceForSlot(
  court: Pick<Court, 'defaultPricePerSlot'>,
  rules: Pick<PricingRule, 'dayType' | 'startMinute' | 'endMinute' | 'pricePerSlot'>[],
  date: Date,
  startMinute: number,
  endMinute: number,
): number {
  const dt = dayTypeForDate(date);
  const hit = rules.find(
    (r) => r.dayType === dt && startMinute >= r.startMinute && endMinute <= r.endMinute,
  );
  return hit ? hit.pricePerSlot : court.defaultPricePerSlot;
}

/** Làm tròn VND tới bội 1.000 đồng. */
export function roundVnd(amount: number): number {
  return Math.round(amount / 1000) * 1000;
}

/** Ghép date YYYY-MM-DD (UTC-midnight) + minute trong ngày -> DateTime tuyệt đối. */
export function slotDateTime(date: Date, minute: number): Date {
  return new Date(date.getTime() + minute * 60_000);
}
