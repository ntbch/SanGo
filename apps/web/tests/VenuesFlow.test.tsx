import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { VenueCard } from '../src/features/venues/components/venue-card';
import { VenueResultsView } from '../src/features/venues/components/venue-results-view';
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
  availableSports: [SportType.FOOTBALL5, SportType.BADMINTON],
  priceFrom: 250000,
  priceTo: 500000,
  avgRating: 4.8,
  reviewsCount: 24,
  distanceKm: 2.3,
  courtsCount: 4,
};

describe('Venues Flow Components & Redesigned Filters', () => {
  it('renders VenueCard with horizontal row layout and tabular numeric specs', () => {
    render(
      <BrowserRouter>
        <VenueCard venue={mockVenue} />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Sân Thể Thao Ngọc Khánh/i)).toBeDefined();
    expect(screen.getByText(/Ba Đình, Hà Nội/i)).toBeDefined();
    expect(screen.getByText(/4.8/i)).toBeDefined();

    // Check status dot and label
    expect(screen.getByText(/Đang mở cửa|Đã đóng cửa/i)).toBeDefined();

    // Check distance element has font-mono-num
    const distanceEl = screen.getByText(/2.3 km/i);
    expect(distanceEl).toBeDefined();
    expect(distanceEl.closest('.font-mono-num')).not.toBeNull();

    // Check price element has font-mono-num
    const priceEl = screen.getByText(/250.000/i);
    expect(priceEl).toBeDefined();
    expect(priceEl.closest('.font-mono-num')).not.toBeNull();

    // Check CTA link
    const ctaLink = screen.getByRole('link', { name: /Đặt sân/i });
    expect(ctaLink).toBeDefined();
    expect(ctaLink.getAttribute('href')).toBe('/venues/san-ngoc-khanh');

    // Check sports badges flat styling
    const badges = screen.getAllByText(/Bóng đá|Pickleball|Cầu lông/i);
    expect(badges.length).toBeGreaterThan(0);
    expect(badges[0].className).toContain('bg-secondary');
  });

  it('renders VenueResultsView empty state with standardized 3-line formula', () => {
    const onFilterChange = vi.fn();
    render(
      <VenueResultsView
        items={[]}
        isLoading={false}
        isError={false}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
        onFilterChange={onFilterChange}
        onRefetch={vi.fn()}
      />,
    );

    // Title & description
    expect(screen.getByText(/Không tìm thấy sân phù hợp/i)).toBeDefined();
    expect(screen.getByText(/Thử tìm kiếm với từ khóa khác hoặc nới lỏng các điều kiện lọc/i)).toBeDefined();

    // Action button
    const resetBtn = screen.getByRole('button', { name: /Đặt lại bộ lọc/i });
    expect(resetBtn).toBeDefined();
    fireEvent.click(resetBtn);
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ city: 'Hà Nội' }));
  });

  it('renders VenueResultsView loading state with skeleton cards', () => {
    const { container } = render(
      <VenueResultsView
        items={[]}
        isLoading={true}
        isError={false}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
        onFilterChange={vi.fn()}
        onRefetch={vi.fn()}
      />,
    );

    // Should render skeleton elements with animate-pulse
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders VenueResultsView error state with retry action', () => {
    const onRefetch = vi.fn();
    render(
      <VenueResultsView
        items={[]}
        isLoading={false}
        isError={true}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
        onFilterChange={vi.fn()}
        onRefetch={onRefetch}
      />,
    );

    expect(screen.getByText(/Không thể kết nối đến máy chủ cụm sân/i)).toBeDefined();
    const retryBtn = screen.getByRole('button', { name: /Thử lại/i });
    expect(retryBtn).toBeDefined();
    fireEvent.click(retryBtn);
    expect(onRefetch).toHaveBeenCalled();
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

  it('renders VenueTopSortBar with map toggle support and drawer trigger', () => {
    const onFilterChange = vi.fn();
    const onOpenMobileDrawer = vi.fn();
    const onToggleMap = vi.fn();

    const { rerender } = render(
      <BrowserRouter>
        <VenueTopSortBar
          filters={{ city: 'Hà Nội' }}
          onFilterChange={onFilterChange}
          onOpenMobileDrawer={onOpenMobileDrawer}
          totalCount={20}
          showMap={true}
          onToggleMap={onToggleMap}
        />
      </BrowserRouter>,
    );

    expect(screen.getByText(/20/i)).toBeDefined();

    // Map toggle button
    const mapToggleBtn = screen.getByRole('button', { name: /Ẩn bản đồ/i });
    expect(mapToggleBtn).toBeDefined();
    fireEvent.click(mapToggleBtn);
    expect(onToggleMap).toHaveBeenCalled();

    // Mobile filter drawer trigger
    const filterDrawerBtn = screen.getByRole('button', { name: /^Lọc/i });
    fireEvent.click(filterDrawerBtn);
    expect(onOpenMobileDrawer).toHaveBeenCalled();

    // When showMap is false
    rerender(
      <BrowserRouter>
        <VenueTopSortBar
          filters={{ city: 'Hà Nội' }}
          onFilterChange={onFilterChange}
          onOpenMobileDrawer={onOpenMobileDrawer}
          totalCount={20}
          showMap={false}
          onToggleMap={onToggleMap}
        />
      </BrowserRouter>,
    );
    expect(screen.getByRole('button', { name: /Xem bản đồ/i })).toBeDefined();
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
    const applyBtn = screen.getByRole('button', { name: /Áp dụng/i });
    fireEvent.click(applyBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('triggers onHover callbacks on VenueCard for bidirectional map sync', () => {
    const onHover = vi.fn();
    const { container } = render(
      <BrowserRouter>
        <VenueCard venue={mockVenue} onHover={onHover} />
      </BrowserRouter>,
    );

    const cardEl = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(cardEl);
    expect(onHover).toHaveBeenCalledWith('ven-1');

    fireEvent.mouseLeave(cardEl);
    expect(onHover).toHaveBeenCalledWith(null);
  });
});
