import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { VenueCard } from '../src/features/venues/components/venue-card';
import { VenueFilterSidebar } from '../src/features/venues/components/venue-filter-sidebar';
import { VenueTopSortBar } from '../src/features/venues/components/venue-top-sort-bar';
import { VenueMobileFilterDrawer } from '../src/features/venues/components/venue-mobile-filter-drawer';
import { VenueItem } from '../src/features/venues/api/venues-api';
import { SportType } from '../src/lib/constants';

const mockVenue: VenueItem = {
  id: 'ven-1',
  name: 'Sân Thể Thao Ngọc Khánh',
  slug: 'san-ngoc-khanh',
  address: 'Số 10 Phạm Huy Thông',
  city: 'Hà Nội',
  district: 'Ba Đình',
  lat: 21.0283,
  lng: 105.8342,
  openMinute: 360, // 06:00
  closeMinute: 1410, // 23:30
  depositPercent: 30,
  images: ['https://example.com/court.jpg'],
  amenities: ['Đèn chiếu sáng đêm', 'Bãi đỗ xe ô tô'],
  priceFrom: 250000,
  priceTo: 500000,
  avgRating: 4.8,
  reviewsCount: 24,
  distanceKm: 2.3,
  courtsCount: 4,
};

describe('Venues Flow Components & Redesigned Filters', () => {
  it('renders VenueCard with all sports-tech specs', () => {
    render(
      <BrowserRouter>
        <VenueCard venue={mockVenue} />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Sân Thể Thao Ngọc Khánh/i)).toBeDefined();
    expect(screen.getByText(/Ba Đình, Hà Nội/i)).toBeDefined();
    expect(screen.getByText(/2.3 km/i)).toBeDefined();
    expect(screen.getByText(/4.8/i)).toBeDefined();
    expect(screen.getByText(/250.000/i)).toBeDefined();
    expect(screen.getByRole('link', { name: /Đặt sân/i })).toBeDefined();
  });

  it('renders VenueFilterSidebar and triggers filter changes', () => {
    const onFilterChange = vi.fn();
    render(
      <VenueFilterSidebar
        filters={{ city: 'Hà Nội', sportType: SportType.FOOTBALL5 }}
        onFilterChange={onFilterChange}
      />,
    );

    expect(screen.getByText(/Bộ Lọc Nâng Cao/i)).toBeDefined();
    const pickleballBtn = screen.getByRole('button', { name: /^Pickleball$/i });
    fireEvent.click(pickleballBtn);

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ sportType: SportType.PICKLEBALL }),
    );
  });

  it('renders VenueTopSortBar and opens mobile drawer', () => {
    const onFilterChange = vi.fn();
    const onOpenMobileDrawer = vi.fn();

    render(
      <BrowserRouter>
        <VenueTopSortBar
          filters={{ city: 'Hà Nội' }}
          onFilterChange={onFilterChange}
          onOpenMobileDrawer={onOpenMobileDrawer}
          totalCount={20}
        />
      </BrowserRouter>,
    );

    expect(screen.getByText(/20/i)).toBeDefined();
    const filterDrawerBtn = screen.getByRole('button', { name: /^Lọc/i });
    fireEvent.click(filterDrawerBtn);
    expect(onOpenMobileDrawer).toHaveBeenCalled();
  });

  it('renders VenueMobileFilterDrawer when open', () => {
    const onClose = vi.fn();
    const onFilterChange = vi.fn();

    render(
      <VenueMobileFilterDrawer
        isOpen={true}
        onClose={onClose}
        filters={{ city: 'Hà Nội' }}
        onFilterChange={onFilterChange}
        totalCount={12}
      />,
    );

    expect(screen.getByText(/Bộ Lọc Tìm Kiếm/i)).toBeDefined();
    const applyBtn = screen.getByRole('button', { name: /Áp dụng \(Xem 12 sân\)/i });
    fireEvent.click(applyBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
