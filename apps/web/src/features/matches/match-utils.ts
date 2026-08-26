/**
 * Helper thuần cho Ghép trận mở (§3.11) — tách khỏi component để unit test.
 */
export { formatDate, formatDateTime, formatDateShort, formatTime, toInputDateFormat } from '../../lib/date-utils';

/** Giới hạn số người cần ghép trên mỗi đơn — khớp CreateHoldSchema backend. */
export const MIN_SLOTS_NEEDED = 1;
export const MAX_SLOTS_NEEDED = 10;

export interface OpenMatchValidation {
  valid: boolean;
  message?: string;
}

/**
 * Validate lựa chọn ghép trận trước khi gửi hold: khi bật công khai thì
 * slotsNeeded bắt buộc là số nguyên trong [1..10] (backend superRefine + zod).
 */
export function validateOpenMatchInput(
  isPublicMatch: boolean,
  slotsNeeded: number | null | undefined,
): OpenMatchValidation {
  if (!isPublicMatch) return { valid: true };
  if (slotsNeeded === null || slotsNeeded === undefined || !Number.isInteger(slotsNeeded)) {
    return { valid: false, message: 'Vui lòng chọn số người cần ghép.' };
  }
  if (slotsNeeded < MIN_SLOTS_NEEDED || slotsNeeded > MAX_SLOTS_NEEDED) {
    return {
      valid: false,
      message: 'Số người cần ghép phải từ 1 đến 10.',
    };
  }
  return { valid: true };
}

/**
 * '2/4 người' cho card trận mở; thiếu dữ liệu -> '—'. Dùng Intl vi-VN cho
 * phần số để nhất quán định dạng với formatVnd.
 */
export function formatJoinedCount(joinedCount: number, slotsNeeded: number): string {
  const fmt = new Intl.NumberFormat('vi-VN');
  const joined = Number.isFinite(joinedCount) ? Math.max(0, Math.trunc(joinedCount)) : 0;
  const needed = Number.isFinite(slotsNeeded) ? Math.max(0, Math.trunc(slotsNeeded)) : 0;
  if (needed === 0) return '—';
  return fmt.format(joined) + '/' + fmt.format(needed) + ' người';
}

/** Chữ cái đầu tên chủ đơn cho avatar tròn: 'Nguyễn Văn Bình' -> 'N'. */
export function hostInitial(hostName: string): string {
  const trimmed = hostName.trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : '?';
}
