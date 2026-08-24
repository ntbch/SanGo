import type { SelectedSlot } from './types';

/** Kiểm tra các slot đã chọn có trên cùng 1 ngày và LIỀN KỀ liên tục không. */
export function validateContiguousSlots(slots: SelectedSlot[]): {
  valid: boolean;
  message?: string;
} {
  if (slots.length === 0) return { valid: false, message: 'Chưa chọn slot nào' };
  if (slots.length === 1) return { valid: true };

  // 1. Phải cùng 1 ngày
  const firstDate = slots[0].date;
  if (slots.some((s) => s.date !== firstDate)) {
    return { valid: false, message: 'Các slot phải thuộc cùng một ngày' };
  }

  // 2. Sắp xếp theo startMinute tăng dần
  const sorted = [...slots].sort((a, b) => a.startMinute - b.startMinute);

  // 3. Mỗi slot kế tiếp phải có startMinute == endMinute của slot trước
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].startMinute !== sorted[i - 1].endMinute) {
      return {
        valid: false,
        message: 'Các slot trong một đơn phải liền kề nhau liên tục không ngắt quãng.',
      };
    }
  }

  return { valid: true };
}

/** Lấy danh sách 7 ngày bắt đầu từ fromDate (YYYY-MM-DD). */
export function getWeekDays(
  fromDateStr: string,
): Array<{ date: string; label: string; shortDay: string; isToday: boolean }> {
  const result = [];
  const [y, m, d] = fromDateStr.split('-').map(Number);
  const baseDate = new Date(y, m - 1, d);
  const todayStr = new Date().toISOString().slice(0, 10);

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  for (let i = 0; i < 7; i++) {
    const curr = new Date(baseDate);
    curr.setDate(baseDate.getDate() + i);
    const dateStr =
      curr.getFullYear() +
      '-' +
      String(curr.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(curr.getDate()).padStart(2, '0');
    const dayIdx = curr.getDay();
    const label = `${dayNames[dayIdx]} ${String(curr.getDate()).padStart(2, '0')}/${String(curr.getMonth() + 1).padStart(2, '0')}`;
    result.push({
      date: dateStr,
      label,
      shortDay: dayNames[dayIdx],
      isToday: dateStr === todayStr,
    });
  }
  return result;
}
