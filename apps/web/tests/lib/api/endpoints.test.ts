import { describe, expect, it } from 'vitest';

import { endpoints } from '../../../src/lib/api/endpoints';

describe('endpoints — auth', () => {
  it('trả về đường dẫn tĩnh đúng contract', () => {
    expect(endpoints.auth.login()).toBe('/auth/login');
    expect(endpoints.auth.refresh()).toBe('/auth/refresh');
    expect(endpoints.auth.resetPassword()).toBe('/auth/reset-password');
    expect(endpoints.users.me()).toBe('/users/me');
    expect(endpoints.venues.mine({ page: 2 })).toBe('/venues/mine?page=2');
    expect(endpoints.venues.mine()).toBe('/venues/mine');
    expect(endpoints.venues.remove('v9')).toBe('/venues/v9');
    expect(endpoints.venues.removeCourt('c7')).toBe('/courts/c7');
  });
});

describe('endpoints — venues & slots', () => {
  it('list ghép bộ lọc, bỏ qua tham số undefined', () => {
    expect(
      endpoints.venues.list({ sportType: 'PICKLEBALL', q: 'sân', page: 2, maxPrice: undefined }),
    ).toBe('/venues?sportType=PICKLEBALL&q=s%C3%A2n&page=2');
    expect(endpoints.venues.list()).toBe('/venues');
  });

  it('detail/reviews encode slug và ghép paging', () => {
    expect(endpoints.venues.detail('san-bong-a-1')).toBe('/venues/san-bong-a-1');
    expect(endpoints.venues.reviews('a b/c', { page: 1, size: 10 })).toBe(
      '/venues/a%20b%2Fc/reviews?page=1&size=10',
    );
  });

  it('courtSlots mặc định days=7 nhưng cho ghi đè', () => {
    expect(endpoints.venues.courtSlots('c1', { from: '2026-08-24' })).toBe(
      '/courts/c1/slots?from=2026-08-24&days=7',
    );
    expect(endpoints.venues.courtSlots('c1', { from: '2026-08-24', days: 3 })).toBe(
      '/courts/c1/slots?from=2026-08-24&days=3',
    );
  });
});

describe('endpoints — bookings/payments/admin/owner', () => {
  it('đường dẫn có id được encode an toàn', () => {
    expect(endpoints.bookings.refundPreview('id/1')).toBe('/bookings/id%2F1/refund-preview');
    expect(endpoints.admin.reject('v1')).toBe('/admin/venues/v1/reject');
  });

  it('owner.bookings ghép đủ tham số, mock callback kèm txnRef', () => {
    expect(
      endpoints.owner.bookings({ venueId: 'v1', date: '2026-08-24', status: 'CONFIRMED' }),
    ).toBe('/owner/bookings?venueId=v1&date=2026-08-24&status=CONFIRMED');
    expect(endpoints.payments.mockCallback('CH-1')).toBe('/payments/mock/callback?txnRef=CH-1');
  });
});
