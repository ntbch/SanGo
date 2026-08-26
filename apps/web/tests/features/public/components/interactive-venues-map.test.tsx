/** Test F5 Map nâng cao: Price Pins format và tương tác bản đồ */
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { formatPinPrice, InteractiveVenuesMap } from '../../../../src/features/public/components/interactive-venues-map';
import type { MapVenueItem } from '../../../../src/features/public/types';

describe('InteractiveVenuesMap (F5)', () => {
  it('formatPinPrice format đúng các khoảng giá rút gọn dạng k', () => {
    expect(formatPinPrice(120000, 200000)).toBe('120k - 200k');
    expect(formatPinPrice(150000, 150000)).toBe('150k');
    expect(formatPinPrice(150000, null)).toBe('150k');
    expect(formatPinPrice(null, null)).toBe('Xem giá');
  });

  it('render bản đồ và hiển thị các ghim sân', () => {
    const mockVenues: MapVenueItem[] = [
      {
        id: 'v-1',
        name: 'Sân Thể Thao Quần Ngựa',
        slug: 'san-the-thao-quan-ngua',
        address: '30 Văn Cao, Liễu Giai, Ba Đình, Hà Nội',
        lat: 21.0382,
        lng: 105.8176,
        images: [],
        amenities: [],
        depositPercent: 30,
        openMinute: 360,
        closeMinute: 1380,
        totalCourts: 3,
        priceFrom: 120000,
        priceTo: 200000,
        availableSports: ['BADMINTON', 'PICKLEBALL'],
        courts: [],
      },
    ];

    const onBoundsChange = vi.fn();

    render(
      <MemoryRouter>
        <InteractiveVenuesMap
          items={mockVenues}
          onBoundsChange={onBoundsChange}
          className="h-[500px]"
        />
      </MemoryRouter>,
    );

    // Leaflet container được mount
    expect(document.querySelector('.leaflet-container')).toBeTruthy();
  });
});
