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
 * Ngày đánh giá theo định dạng Việt Nam (dd/mm/yyyy).
 * ISO timestamp (backend) -> 'dd/mm/yyyy'; chuỗi đã định dạng sẵn -> giữ nguyên.
 */
export function formatReviewDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  }
  return value;
}
