/**
 * Helper thuần cho dashboard thống kê chủ sân (§3.10).
 * Tách khỏi component để unit test độc lập với Chart.js/DOM.
 */

/** Làm tròn 4 chữ số thập phân — cùng quy ước với backend analytics. */
function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

/** Tỷ lệ part/total; total <= 0 -> 0 (chưa có đơn thì tỷ lệ là 0, không phải NaN). */
export function safeRatio(part: number, total: number): number {
  return total > 0 ? part / total : 0;
}

/**
 * Tỷ lệ hủy hiển thị trên thẻ KPI: chỉ đếm đơn CANCELLED trên tổng số đơn.
 * Khác backend một chút: summary.cancelRate gộp cả NO_SHOW — UI tách hai thẻ
 * riêng nên tính lại từ count để mỗi thẻ một ngữ nghĩa rõ ràng.
 */
export function computeCancelRate(cancelledCount: number, totalBookings: number): number {
  return round4(safeRatio(cancelledCount, totalBookings));
}

/** Tỷ lệ no-show: số đơn NO_SHOW trên tổng số đơn. */
export function computeNoShowRate(noShowCount: number, totalBookings: number): number {
  return round4(safeRatio(noShowCount, totalBookings));
}

/**
 * 0.1234 -> '12,3%' (dấu phẩy thập phân kiểu vi-VN, không phụ thuộc ICU).
 * Giá trị âm không xảy ra trong nghiệp vụ thống kê.
 */
export function formatPercent(fraction: number): string {
  const rounded = Math.round(fraction * 1000) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return text.replace('.', ',') + '%';
}

/** '2026-08-24' -> '24/8' — nhãn ngắn cho trục x của biểu đồ. */
export function shortDateLabel(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3 || parts.some((part) => part === '' || Number.isNaN(Number(part)))) {
    return isoDate;
  }
  return String(Number(parts[2])) + '/' + String(Number(parts[1]));
}
