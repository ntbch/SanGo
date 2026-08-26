import { describe, expect, it } from 'vitest';
import {
  APP_NAME,
  BookingStatus,
  PaymentStatus,
  SLOT_MINUTES,
  SPORT_TYPE_LABELS,
  SportType,
  VenueStatus,
} from '../src/index';

describe('@sango/shared enums (đặc tả §5)', () => {
  it('BookingStatus đủ 5 trạng thái theo đặc tả', () => {
    expect(Object.values(BookingStatus)).toEqual([
      'CONFIRMED',
      'CHECKED_IN',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
    ]);
  });

  it('VenueStatus theo vòng đời duyệt sân PENDING → APPROVED | REJECTED', () => {
    expect(VenueStatus.PENDING).toBe('PENDING');
    expect(Object.values(VenueStatus)).toHaveLength(3);
  });

  it('PaymentStatus đầy đủ', () => {
    expect(Object.values(PaymentStatus).sort()).toEqual(['FAILED', 'PAID', 'PENDING', 'REFUNDED']);
  });

  it('slot chỉ nhận 60 hoặc 90 phút', () => {
    expect([...SLOT_MINUTES]).toEqual([60, 90]);
  });

  it('nhãn loại sân khớp 1-1 với enum SportType', () => {
    expect(Object.keys(SPORT_TYPE_LABELS).sort()).toEqual(Object.values(SportType).sort());
  });

  it('APP_NAME là SanGo', () => {
    expect(APP_NAME).toBe('SanGo');
  });
});
