/** Định dạng khu admin — bổ trợ cho feed hoạt động thống kê nền tảng. */

/** ISO timestamp -> 'HH:mm dd-MM' hoặc 'HH:mm dd/MM' kiểu vi-VN. */
export function formatActivityTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
