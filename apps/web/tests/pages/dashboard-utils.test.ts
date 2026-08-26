import { describe, expect, it } from 'vitest';

import { vnToday } from '@sango/shared';

import type { OwnerAnalyticsResponse, OwnerBooking } from '../../src/features/owner/types';
import {
  aggregateOwnerKpis,
  countByVenueStatus,
  estimateRevenueToday,
  isoDaysAgo,
  mergeAnalyticsSeries,
  pickNearestBooking,
  todayIso,
} from '../../src/pages/dashboard-utils';

/** Mốc cố định giữa ngày để test không phụ thuộc giờ chạy CI. */
const NOW = new Date(2026, 7, 25, 10, 0, 0); // 2026-08-25 10:00 local

function booking(patch: Partial<OwnerBooking>): OwnerBooking {
  return {
    id: 'b',
    code: 'CH-1',
    courtName: 'Sân 1',
    customerName: 'Khách',
    date: '2026-08-25',
    startMinute: 360,
    endMinute: 420,
    status: 'CONFIRMED',
    amountPaid: 100000,
    ...patch,
  };
}

describe('pickNearestBooking', () => {
  it('chọn đơn sớm nhất trong tương lai theo ngày rồi tới giờ bắt đầu', () => {
    const items = [
      { code: 'sau', date: '2026-08-28', startMinute: 600 },
      { code: 'truoc-cung-ngay', date: '2026-08-26', startMinute: 900 },
      { code: 'som-nhat', date: '2026-08-26', startMinute: 360 },
      { code: 'stale-da-choi', date: '2026-08-20', startMinute: 360 }, // quá khứ → loại
    ];

    expect(pickNearestBooking(items, NOW)?.code).toBe('som-nhat');
  });

  it('chỉ có đơn quá khứ (CONFIRMED đã chơi) → undefined thay vì trả đơn stale', () => {
    const items = [
      { code: 'stale-1', date: '2026-08-24', startMinute: 360 },
      { code: 'stale-2', date: '2026-08-23', startMinute: 60 },
    ];

    expect(pickNearestBooking(items, NOW)).toBeUndefined();
  });

  it('trả về undefined cho danh sách rỗng (empty state customer)', () => {
    expect(pickNearestBooking([], NOW)).toBeUndefined();
  });
});

describe('aggregateOwnerKpis — kỳ 30 ngày', () => {
  it('đếm đơn hôm nay, doanh thu và tỷ lệ huỷ CHỈ trong kỳ hiện tại', () => {
    const kpis = aggregateOwnerKpis(
      2,
      [
        booking({ id: '1', date: '2026-08-25', status: 'CONFIRMED', amountPaid: 36000 }),
        booking({ id: '2', date: '2026-08-25', status: 'CHECKED_IN', amountPaid: 90000 }),
        booking({ id: '3', date: '2026-08-10', status: 'COMPLETED', amountPaid: 400000 }),
        booking({ id: '4', date: '2026-08-25', status: 'PENDING_PAYMENT', amountPaid: 0 }),
        booking({ id: '5', date: '2026-08-01', status: 'CANCELLED', amountPaid: 0 }),
        // Ngoài kỳ 30 ngày (trước 2026-07-27): không tính vào bất kỳ KPI nào.
        booking({ id: '6', date: '2026-06-15', status: 'COMPLETED', amountPaid: 999000 }),
        booking({ id: '7', date: '2026-05-05', status: 'NO_SHOW', amountPaid: 0 }),
        // Tương lai (dữ liệu bẩn): cũng loại.
        booking({ id: '8', date: '2026-09-30', status: 'CONFIRMED', amountPaid: 500000 }),
      ],
      { now: NOW },
    );

    expect(kpis.totalVenues).toBe(2);
    expect(kpis.todayCount).toBe(3); // đơn #1,#2,#4
    expect(kpis.collectedRevenue).toBe(526000); // #1+#2+#3, không gồm #6/#8
    expect(kpis.cancelRatePercent).toBe(20); // 1/5 đơn trong kỳ bị huỷ
  });

  it('kỳ chưa có đơn nào → tỷ lệ huỷ là null thay vì chia cho 0', () => {
    const kpis = aggregateOwnerKpis(
      3,
      [booking({ date: '2026-01-01' })], // ngoài kỳ
      { now: NOW },
    );
    expect(kpis.totalVenues).toBe(3);
    expect(kpis.todayCount).toBe(0);
    expect(kpis.collectedRevenue).toBe(0);
    expect(kpis.cancelRatePercent).toBeNull();
  });

  it('periodDays tuỳ chỉnh (vd 7 ngày) thu hẹp cửa sổ thống kê', () => {
    const kpis = aggregateOwnerKpis(
      1,
      [
        booking({ date: '2026-08-25', amountPaid: 100000 }),
        booking({ date: '2026-08-12', amountPaid: 200000 }), // ngoài 7 ngày (từ 2026-08-19)
        booking({ date: '2026-08-22', amountPaid: 300000 }),
      ],
      { periodDays: 7, now: NOW },
    );
    expect(kpis.collectedRevenue).toBe(400000);
  });
});

describe('todayIso / isoDaysAgo', () => {
  it('delegate sang vnToday của @sango/shared (múi giờ VN, không phải UTC)', () => {
    expect(todayIso(NOW)).toBe(vnToday(NOW));
    expect(todayIso(new Date(2026, 7, 5, 10, 0))).toBe('2026-08-05');
  });

  it('isoDaysAgo lùi N ngày với pad-start đúng chuẩn YYYY-MM-DD', () => {
    expect(isoDaysAgo(29, NOW)).toBe('2026-07-27'); // đầu kỳ mặc định 30 ngày
    expect(isoDaysAgo(0, NOW)).toBe('2026-08-25');
    expect(isoDaysAgo(30, new Date(2026, 0, 15, 9, 0))).toBe('2025-12-16'); // tràn năm/tháng
  });
});

describe('countByVenueStatus', () => {
  it('đếm nhanh số cụm sân theo từng trạng thái', () => {
    const counts = countByVenueStatus([
      { status: 'PENDING' },
      { status: 'PENDING' },
      { status: 'APPROVED' },
      { status: 'REJECTED' },
    ]);

    expect(counts).toEqual({ PENDING: 2, APPROVED: 1, REJECTED: 1 });
  });

  it('bỏ qua trạng thái lạ thay vì crash', () => {
    expect(countByVenueStatus([{ status: 'UNKNOWN' }])).toEqual({
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    });
  });
});
/* --------------------- Bổ sung t5: tổng quan chỉ-xem --------------------- */

describe('estimateRevenueToday', () => {
  it('cộng amountPaid của đơn HÔM NAY chưa bị huỷ/no-show (ước tính)', () => {
    const total = estimateRevenueToday(
      [
        booking({ id: '1', date: '2026-08-25', status: 'CONFIRMED', amountPaid: 36000 }),
        booking({ id: '2', date: '2026-08-25', status: 'CHECKED_IN', amountPaid: 90000 }),
        // Chờ thanh toán vẫn tính vào ước tính (amountPaid hiện tại = 0).
        booking({ id: '3', date: '2026-08-25', status: 'PENDING_PAYMENT', amountPaid: 0 }),
        // Huỷ/no-show thì loại khỏi ước tính.
        booking({ id: '4', date: '2026-08-25', status: 'CANCELLED', amountPaid: 50000 }),
        booking({ id: '5', date: '2026-08-25', status: 'NO_SHOW', amountPaid: 70000 }),
        // Khác ngày thì loại.
        booking({ id: '6', date: '2026-08-24', status: 'COMPLETED', amountPaid: 400000 }),
      ],
      NOW,
    );

    expect(total).toBe(126000);
  });

  it('không có đơn hợp lệ -> 0 thay vì NaN', () => {
    expect(estimateRevenueToday([], NOW)).toBe(0);
  });
});

describe('mergeAnalyticsSeries - cộng dồn xu hướng nhiều cụm sân', () => {
  /** Dựng response tối thiểu chỉ với series (đủ contract của hàm gộp). */
  const resp = (
    series: OwnerAnalyticsResponse['series'],
  ): Pick<OwnerAnalyticsResponse, 'series'> => ({ series });

  it('cộng dồn bookings/revenue theo ngày rồi sắp tăng dần theo date', () => {
    const merged = mergeAnalyticsSeries([
      resp([
        { date: '2026-08-24', bookings: 1, revenue: 100 },
        { date: '2026-08-25', bookings: 2, revenue: 200 },
      ]),
      resp([
        { date: '2026-08-25', bookings: 3, revenue: 300 },
        { date: '2026-08-26', bookings: 4, revenue: 400 },
      ]),
    ]);

    expect(merged).toEqual([
      { date: '2026-08-24', bookings: 1, revenue: 100 },
      { date: '2026-08-25', bookings: 5, revenue: 500 },
      { date: '2026-08-26', bookings: 4, revenue: 400 },
    ]);
  });

  it('bỏ qua response lỗi (undefined) thay vì làm đổ biểu đồ', () => {
    expect(
      mergeAnalyticsSeries([undefined, resp([{ date: '2026-08-25', bookings: 1, revenue: 1 }])]),
    ).toEqual([{ date: '2026-08-25', bookings: 1, revenue: 1 }]);
    expect(mergeAnalyticsSeries([resp([]), undefined])).toEqual([]);
  });
});
