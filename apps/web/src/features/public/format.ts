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
