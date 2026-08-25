import { vnToday } from '@courthub/shared';

import type { OwnerBooking } from '../features/owner/types';

/** Mẩu dữ liệu tối thiểu để chọn "đơn sắp tới gần nhất". */
export interface UpcomingLike {
  /** YYYY-MM-DD — so sánh thứ tự từ điển là đủ. */
  date: string;
  startMinute: number;
}

/**
 * Chọn đơn sớm nhất (theo ngày, rồi tới giờ bắt đầu) trong danh sách đơn
 * upcoming của customer. Bỏ qua đơn có ngày TRONG QUÁ KHỨ: /bookings/me chỉ
 * lọc theo trạng thái nên vẫn có thể trả đơn CONFIRMED đã chơi xong.
 * Trả về undefined khi không còn đơn hợp lệ.
 */
export function pickNearestBooking<T extends UpcomingLike>(
  items: readonly T[],
  now: Date = new Date(),
): T | undefined {
  if (items.length === 0) return undefined;
  const today = todayIso(now);
  return [...items]
    .filter((item) => item.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startMinute - b.startMinute)[0];
}

export interface OwnerKpis {
  totalVenues: number;
  todayCount: number;
  /** Tổng tiền đã thu của đơn không huỷ TRONG KỲ hiện tại. */
  collectedRevenue: number;
  /** Phần trăm đơn huỷ/no-show trong kỳ, làm tròn số nguyên; null khi kỳ chưa có đơn. */
  cancelRatePercent: number | null;
}

export interface OwnerKpisOptions {
  /** Độ dài kỳ thống kê tính bằng ngày (mặc định 30 như trang Thống kê §3.10). */
  periodDays?: number;
  /** Mốc thời gian để unit test — mặc định hiện tại. */
  now?: Date;
}

/** Trạng thái được tính là "đã có doanh thu" (đã cọc/đã trả). */
const PAID_STATUSES: ReadonlySet<string> = new Set(['CONFIRMED', 'CHECKED_IN', 'COMPLETED']);

/**
 * "Hôm nay" nghiệp vụ của CourtHub — delegate sang vnToday() của
 * @courthub/shared (múi giờ Asia/Ho_Chi_Minh thay vì biên UTC).
 * RỦI RO UTC CẦN NHỚ khi nối API thật: backend phải thống nhất cùng mốc
 * "hôm nay" VN cho các filter date (QA t8: mất đơn hôm nay 00:00–06:59 ICT).
 * So sánh chuỗi YYYY-MM-DD an toàn miễn cả hai phía dùng cùng một mốc.
 */
export function todayIso(now: Date = new Date()): string {
  return vnToday(now);
}

/** ISO của hôm nay trừ `days` ngày — mốc đầu kỳ thống kê (bao gồm). */
export function isoDaysAgo(days: number, now: Date = new Date()): string {
  const shifted = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
  return todayIso(shifted);
}

/**
 * Gộp KPI owner client-side từ dữ liệu /venues/mine + /owner/bookings (mỗi
 * cụm sân một lần gọi, đúng contract venueId bắt buộc) — không thêm API mới.
 * Các chỉ số đơn/doanh thu/tỷ lệ huỷ chỉ tính trên kỳ `periodDays` ngày gần
 * nhất (mặc định 30), không cộng lifetime.
 */
export function aggregateOwnerKpis(
  totalVenues: number,
  bookings: readonly OwnerBooking[],
  options: OwnerKpisOptions = {},
): OwnerKpis {
  const { periodDays = 30, now = new Date() } = options;
  const today = todayIso(now);
  const from = isoDaysAgo(periodDays - 1, now); // cửa sổ đóng: [from, today]

  let todayCount = 0;
  let collectedRevenue = 0;
  let cancelled = 0;
  let inPeriod = 0;

  for (const booking of bookings) {
    if (booking.date < from || booking.date > today) continue; // ngoài kỳ hiện tại
    inPeriod += 1;
    if (booking.date === today) todayCount += 1;
    if (PAID_STATUSES.has(booking.status)) collectedRevenue += booking.amountPaid;
    if (booking.status === 'CANCELLED' || booking.status === 'NO_SHOW') cancelled += 1;
  }

  return {
    totalVenues,
    todayCount,
    collectedRevenue,
    cancelRatePercent: inPeriod > 0 ? Math.round((cancelled / inPeriod) * 100) : null,
  };
}

export interface VenueStatusCounts {
  PENDING: number;
  APPROVED: number;
  REJECTED: number;
}

/** Đếm nhanh số cụm sân theo trạng thái từ danh sách /admin/venues. */
export function countByVenueStatus(items: ReadonlyArray<{ status: string }>): VenueStatusCounts {
  const counts: VenueStatusCounts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  for (const item of items) {
    if (item.status === 'PENDING' || item.status === 'APPROVED' || item.status === 'REJECTED') {
      counts[item.status] += 1;
    }
  }
  return counts;
}
