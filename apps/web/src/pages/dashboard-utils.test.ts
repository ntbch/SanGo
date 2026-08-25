import { describe, expect, it } from 'vitest';

import type { OwnerBooking } from '../features/owner/types';
import {
  aggregateOwnerKpis,
  countByVenueStatus,
  pickNearestBooking,
  todayIso,
} from './dashboard-utils';

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
  it('chọn đơn sớm nhất theo ngày rồi tới giờ bắt đầu', () => {
    const items = [
      { code: 'sau', date: '2026-08-28', startMinute: 600 },
      { code: 'truoc-cung-ngay', date: '2026-08-26', startMinute: 900 },
      { code: 'som-nhat', date: '2026-08-26', startMinute: 360 },
    ];

    expect(pickNearestBooking(items)?.code).toBe('som-nhat');
  });

  it('trả về undefined cho danh sách rỗng (empty state customer)', () => {
    expect(pickNearestBooking([])).toBeUndefined();
  });
});

describe('aggregateOwnerKpis', () => {
  it('đếm đơn hôm nay, doanh thu đã thu và tỷ lệ huỷ từ dữ liệu owner bookings', () => {
    const kpis = aggregateOwnerKpis(2, [
      booking({ id: '1', date: todayIso(), status: 'CONFIRMED', amountPaid: 36000 }),
      booking({ id: '2', date: todayIso(), status: 'CHECKED_IN', amountPaid: 90000 }),
      booking({ id: '3', date: '2026-01-01', status: 'COMPLETED', amountPaid: 400000 }),
      booking({ id: '4', date: todayIso(), status: 'PENDING_PAYMENT', amountPaid: 0 }),
      booking({ id: '5', date: '2026-02-02', status: 'CANCELLED', amountPaid: 0 }),
      booking({ id: '6', date: '2026-03-03', status: 'NO_SHOW', amountPaid: 0 }),
    ]);

    expect(kpis.totalVenues).toBe(2);
    // Đơn "hôm nay": chỉ tính theo ngày hiện tại.
    expect(kpis.todayCount).toBe(3);
    // Doanh thu chỉ cộng đơn CONFIRMED/CHECKED_IN/COMPLETED.
    expect(kpis.collectedRevenue).toBe(526000);
    // 2/6 đơn huỷ + no-show = 33%.
    expect(kpis.cancelRatePercent).toBe(33);
  });

  it('chưa có đơn → tỷ lệ huỷ là null thay vì chia cho 0', () => {
    const kpis = aggregateOwnerKpis(3, []);
    expect(kpis.totalVenues).toBe(3);
    expect(kpis.todayCount).toBe(0);
    expect(kpis.collectedRevenue).toBe(0);
    expect(kpis.cancelRatePercent).toBeNull();
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

describe('todayIso', () => {
  it('định dạng YYYY-MM-DD có pad-start tháng/ngày', () => {
    expect(todayIso(new Date(2026, 7, 5))).toBe('2026-08-05');
    expect(todayIso(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});
