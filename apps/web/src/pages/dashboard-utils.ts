import type { OwnerBooking } from '../features/owner/types';

/** Mẩu dữ liệu tối thiểu để chọn "đơn sắp tới gần nhất". */
export interface UpcomingLike {
  /** YYYY-MM-DD — so sánh thứ tự từ điển là đủ. */
  date: string;
  startMinute: number;
}

/**
 * Chọn đơn sớm nhất (theo ngày, rồi tới giờ bắt đầu) trong danh sách đơn
 * upcoming của customer. Trả về undefined khi danh sách rỗng.
 */
export function pickNearestBooking<T extends UpcomingLike>(items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return [...items].sort(
    (a, b) => a.date.localeCompare(b.date) || a.startMinute - b.startMinute,
  )[0];
}

export interface OwnerKpis {
  totalVenues: number;
  todayCount: number;
  /** Tổng tiền đã thu của các đơn không bị huỷ (CONFIRMED/CHECKED_IN/COMPLETED). */
  collectedRevenue: number;
  /** Phần trăm đơn huỷ/no-show làm tròn về số nguyên; null khi chưa có đơn. */
  cancelRatePercent: number | null;
}

/** Trạng thái được tính là "đã có doanh thu" (đã cọc/đã trả). */
const PAID_STATUSES: ReadonlySet<string> = new Set(['CONFIRMED', 'CHECKED_IN', 'COMPLETED']);

/** Ngày hôm nay theo múi giờ local, định dạng YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  return (
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(now.getDate()).padStart(2, '0')
  );
}

/**
 * Gộp KPI owner client-side từ dữ liệu /venues/mine + /owner/bookings (mỗi
 * cụm sân một lần gọi, đúng contract venueId bắt buộc) — không thêm API mới.
 */
export function aggregateOwnerKpis(
  totalVenues: number,
  bookings: readonly OwnerBooking[],
): OwnerKpis {
  const today = todayIso();
  let todayCount = 0;
  let collectedRevenue = 0;
  let cancelled = 0;

  for (const booking of bookings) {
    if (booking.date === today) todayCount += 1;
    if (PAID_STATUSES.has(booking.status)) collectedRevenue += booking.amountPaid;
    if (booking.status === 'CANCELLED' || booking.status === 'NO_SHOW') cancelled += 1;
  }

  return {
    totalVenues,
    todayCount,
    collectedRevenue,
    cancelRatePercent: bookings.length > 0 ? Math.round((cancelled / bookings.length) * 100) : null,
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
