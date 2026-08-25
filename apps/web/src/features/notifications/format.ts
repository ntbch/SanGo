/**
 * Định dạng thời gian tương đối kiểu Việt Nam cho danh sách thông báo:
 * 'vừa xong', '5 phút trước', '2 giờ trước', '3 ngày trước',
 * quá 7 ngày thì rơi về ngày tuyệt đối dd/mm/yyyy.
 * Hàm thuần (pure) — nhận now để unit test deterministic.
 */

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffSeconds = Math.max(0, Math.floor((now.getTime() - then) / 1000));

  if (diffSeconds < MINUTE) return 'Vừa xong';
  if (diffSeconds < HOUR) {
    const minutes = Math.floor(diffSeconds / MINUTE);
    return minutes + ' phút trước';
  }
  if (diffSeconds < DAY) {
    const hours = Math.floor(diffSeconds / HOUR);
    return hours + ' giờ trước';
  }
  if (diffSeconds < 7 * DAY) {
    const days = Math.floor(diffSeconds / DAY);
    return days + ' ngày trước';
  }
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
