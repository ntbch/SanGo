import { describe, expect, it } from 'vitest';
import { validateContiguousSlots, getWeekDays } from '../../../src/features/booking/slot-utils';

describe('validateContiguousSlots', () => {
  it('1 slot luôn hợp lệ', () => {
    expect(
      validateContiguousSlots([{ date: '2026-08-28', startMinute: 360, endMinute: 420 }]).valid,
    ).toBe(true);
  });

  it('2 slot liền kề cùng ngày hợp lệ', () => {
    const slots = [
      { date: '2026-08-28', startMinute: 360, endMinute: 420 },
      { date: '2026-08-28', startMinute: 420, endMinute: 480 },
    ];
    expect(validateContiguousSlots(slots).valid).toBe(true);
  });

  it('2 slot ngắt quãng bị từ chối', () => {
    const slots = [
      { date: '2026-08-28', startMinute: 360, endMinute: 420 },
      { date: '2026-08-28', startMinute: 480, endMinute: 540 },
    ];
    const res = validateContiguousSlots(slots);
    expect(res.valid).toBe(false);
    expect(res.message).toContain('liền kề');
  });

  it('2 slot khác ngày bị từ chối', () => {
    const slots = [
      { date: '2026-08-28', startMinute: 360, endMinute: 420 },
      { date: '2026-08-29', startMinute: 420, endMinute: 480 },
    ];
    const res = validateContiguousSlots(slots);
    expect(res.valid).toBe(false);
    expect(res.message).toContain('cùng một ngày');
  });
});

describe('getWeekDays', () => {
  it('sinh đủ 7 ngày liên tiếp từ fromDate', () => {
    const days = getWeekDays('2026-08-24');
    expect(days).toHaveLength(7);
    expect(days[0].date).toBe('2026-08-24');
    expect(days[6].date).toBe('2026-08-30');
  });
});
