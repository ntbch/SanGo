import { formatDateTime } from '../../lib/date-utils';

/** Định dạng khu admin — bổ trợ cho feed hoạt động thống kê nền tảng. */

/** ISO timestamp -> 'HH:mm dd/MM/yyyy' kiểu vi-VN; lỗi parse thì giữ nguyên chuỗi. */
export function formatActivityTime(iso: string): string {
  return formatDateTime(iso);
}
