import { formatDate } from '../../lib/date-utils';

export { formatDate, formatDateTime, formatDateShort, formatTime, toInputDateFormat } from '../../lib/date-utils';

/** Định dạng số nguyên VND kiểu Việt Nam, vd 120000 -> '120.000₫'. */
export function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value) + '₫';
}

/** Phút trong ngày -> 'HH:mm' (24h), vd 360 -> '06:00'. */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

/**
 * Ngày đánh giá theo định dạng Việt Nam (dd/MM/yyyy).
 * ISO timestamp (backend) -> 'dd/MM/yyyy'; chuỗi đã định dạng sẵn -> giữ nguyên.
 */
export function formatReviewDate(value: string): string {
  return formatDate(value);
}
