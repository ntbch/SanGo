import { describe, expect, it } from 'vitest';

import {
  computeCancelRate,
  computeNoShowRate,
  formatPercent,
  safeRatio,
  shortDateLabel,
} from '../../../src/features/owner/analytics-utils';

describe('computeCancelRate', () => {
  it('tính tỷ lệ hủy = cancelled / tổng đơn', () => {
    expect(computeCancelRate(12, 100)).toBe(0.12);
    expect(computeCancelRate(1, 3)).toBe(0.3333); // làm tròn 4 chữ số
  });

  it('trả về 0 khi chưa có đơn nào (không NaN)', () => {
    expect(computeCancelRate(0, 0)).toBe(0);
  });
});

describe('computeNoShowRate', () => {
  it('tính tỷ lệ no-show riêng khỏi tỷ lệ hủy', () => {
    expect(computeNoShowRate(2, 50)).toBe(0.04);
    expect(computeNoShowRate(5, 0)).toBe(0);
  });
});

describe('safeRatio', () => {
  it('chia an toàn với mẫu số <= 0', () => {
    expect(safeRatio(7, 14)).toBe(0.5);
    expect(safeRatio(7, -1)).toBe(0);
  });
});

describe('formatPercent', () => {
  it('hiển thị phần trăm kiểu vi-VN với một chữ số thập phân', () => {
    expect(formatPercent(0.1234)).toBe('12,3%');
    expect(formatPercent(0.05)).toBe('5%');
    expect(formatPercent(0)).toBe('0%');
  });
});

describe('shortDateLabel', () => {
  it('rút gọn YYYY-MM-DD thành M/D cho trục x', () => {
    expect(shortDateLabel('2026-08-24')).toBe('24/8');
    expect(shortDateLabel('2026-01-05')).toBe('5/1');
    expect(shortDateLabel('khong-hop-le')).toBe('khong-hop-le');
  });
});
