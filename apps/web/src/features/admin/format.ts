/** Định dạng khu admin — bổ trợ cho feed hoạt động thống kê nền tảng. */

/** ISO timestamp -> 'dd/MM HH:mm' kiểu vi-VN; lỗi parse thì giữ nguyên chuỗi. */
export function formatActivityTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
