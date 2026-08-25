/** Test VenueCard: badge khoảng cách (AC-03.3) và fallback Google Maps EC-06. */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import type { VenueListItem } from '../types';
import { VenueCard } from './venue-card';

function makeVenue(overrides: Partial<VenueListItem> = {}): VenueListItem {
  return {
    id: 'v-test',
    name: 'Sân Thử Nghiệm',
    slug: 'san-thu-nghiem',
    address: '12 Nguyễn Văn Bảo, Gò Vấp, TP.HCM',
    lat: 21.0285,
    lng: 105.8542,
    images: [],
    amenities: [],
    depositPercent: 30,
    openMinute: 360,
    closeMinute: 1320,
    courts: [
      {
        id: 'c-1',
        name: 'Sân 1',
        sportType: 'PICKLEBALL',
        slotMinutes: 60,
        defaultPricePerSlot: 120000,
      },
    ],
    ...overrides,
  };
}

function renderCard(venue: VenueListItem) {
  return render(
    <MemoryRouter>
      <VenueCard venue={venue} />
    </MemoryRouter>,
  );
}

describe('VenueCard', () => {
  it('badge khoảng cách dùng formatDistance: <1 km -> mét', () => {
    renderCard(makeVenue({ distanceKm: 0.652 }));
    expect(screen.getByText('📍 Cách bạn 652 m')).toBeTruthy();
  });

  it('badge khoảng cách >=1 km hiển thị 1 chữ số thập phân', () => {
    renderCard(makeVenue({ distanceKm: 2.44 }));
    expect(screen.getByText('📍 Cách bạn 2.4 km')).toBeTruthy();
  });

  it('EC-06: không có khoảng cách -> ẩn badge', () => {
    renderCard(makeVenue({ distanceKm: undefined }));
    expect(screen.queryByText(/📍 Cách bạn/)).toBeNull();
  });

  it('EC-06: tọa độ 0/0 -> link Maps fallback sang tìm kiếm theo địa chỉ', () => {
    renderCard(makeVenue({ lat: 0, lng: 0 }));
    const mapsLink = screen.getByRole('link', { name: /chỉ đường đến/i });
    const href = mapsLink.getAttribute('href');
    expect(href).toBe(
      'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent('12 Nguyễn Văn Bảo, Gò Vấp, TP.HCM'),
    );
  });

  it('tọa độ hợp lệ -> giữ URL Directions chuẩn (AC-04.2)', () => {
    renderCard(makeVenue());
    const mapsLink = screen.getByRole('link', { name: /chỉ đường đến/i });
    expect(mapsLink.getAttribute('href')).toContain(
      'https://www.google.com/maps/dir/?api=1&destination=21.0285,105.8542&travelmode=driving',
    );
  });
});
