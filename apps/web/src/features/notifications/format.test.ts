/** Test định dạng thời gian tương đối của danh sách thông báo (P2-F1). */
import { describe, expect, it } from 'vitest';

import { formatRelativeTime } from './format';

const NOW = new Date('2026-08-25T10:00:00.000Z');

describe('formatRelativeTime', () => {
  it('dưới 1 phút -> "Vừa xong"', () => {
    expect(formatRelativeTime('2026-08-25T09:59:30.000Z', NOW)).toBe('Vừa xong');
  });

  it('vài phút -> "N phút trước"', () => {
    expect(formatRelativeTime('2026-08-25T09:55:00.000Z', NOW)).toBe('5 phút trước');
  });

  it('vài giờ -> "N giờ trước"', () => {
    expect(formatRelativeTime('2026-08-25T08:00:00.000Z', NOW)).toBe('2 giờ trước');
  });

  it('vài ngày -> "N ngày trước"', () => {
    expect(formatRelativeTime('2026-08-23T10:00:00.000Z', NOW)).toBe('2 ngày trước');
  });

  it('quá 7 ngày -> ngày tuyệt đối dd/mm/yyyy kiểu vi-VN', () => {
    expect(formatRelativeTime('2026-08-01T10:00:00.000Z', NOW)).toBe('01/08/2026');
  });

  it('timestamp sai -> chuỗi rỗng thay vì văng lỗi', () => {
    expect(formatRelativeTime('khong-phai-ngay', NOW)).toBe('');
  });
});
