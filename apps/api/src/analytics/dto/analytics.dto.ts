import { z } from 'zod';

export const OwnerAnalyticsQuerySchema = z.object({
  venueId: z.string().uuid('venueId phải là UUID'),
  days: z.coerce.number().int().min(1, 'days tối thiểu 1').max(90, 'days tối đa 90').default(30),
});
export type OwnerAnalyticsQueryDto = z.infer<typeof OwnerAnalyticsQuerySchema>;

/** Một điểm trong chuỗi theo NGÀY. */
export interface OwnerAnalyticsSeriesPoint {
  /** YYYY-MM-DD (UTC) */
  date: string;
  /** Số đơn MỌI trạng thái phát sinh trong ngày. */
  bookings: number;
  /** Doanh thu xác nhận trong ngày: chỉ depositAmount của đơn CONFIRMED/CHECKED_IN/COMPLETED. */
  revenue: number;
}

/** Xếp hạng sân con chạy nhất — sắp giảm dần theo bookings. */
export interface OwnerAnalyticsTopCourt {
  courtId: string;
  courtName: string;
  /** Tổng số đơn MỌI trạng thái trong khoảng. */
  bookings: number;
  /** Chỉ depositAmount của đơn CONFIRMED/CHECKED_IN/COMPLETED. */
  revenue: number;
}

export interface OwnerAnalyticsSummary {
  /**
   * Doanh thu xác nhận: TỔNG depositAmount các đơn CONFIRMED/CHECKED_IN/COMPLETED
   * trong khoảng. KHÔNG tính phần còn lại của đơn, KHÔNG tính đơn CANCELLED/NO_SHOW.
   */
  revenueConfirmed: number;
  /** Tổng số đơn MỌI trạng thái phát sinh trong khoảng. */
  totalBookings: number;
  cancelledCount: number;
  noShowCount: number;
  /** (cancelledCount + noShowCount) / totalBookings, làm tròn 4 chữ số; 0 nếu chưa có đơn. */
  cancelRate: number;
}

export interface OwnerAnalyticsResponse {
  meta: {
    venueId: string;
    venueName: string;
    days: number;
    /** Ngày đầu của khoảng, YYYY-MM-DD (UTC), tính cả trong chuỗi. */
    from: string;
    /** Ngày cuối của khoảng (= hôm nay UTC), YYYY-MM-DD. */
    to: string;
  };
  summary: OwnerAnalyticsSummary;
  /** Chuỗi theo ngày ĐỦ độ dài `days`, ngày không có đơn được zero-fill. */
  series: OwnerAnalyticsSeriesPoint[];
  /** Chỉ gồm sân có ít nhất 1 đơn; xếp hạng bookings giảm dần, hòa thì so revenue rồi tên. */
  topCourts: OwnerAnalyticsTopCourt[];
}
