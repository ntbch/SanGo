import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VenueDetailPage } from '../src/features/venues/pages';
import { SportType } from '../src/lib/constants';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockVenue = {
  id: 'v-test-1',
  name: 'Sân Thể Thao Cao Cấp Ngọc Khánh',
  slug: 'san-ngoc-khanh',
  address: 'Số 12 Ngọc Khánh',
  city: 'Hà Nội',
  district: 'Ba Đình',
  lat: 21.0283,
  lng: 105.8342,
  openMinute: 360,
  closeMinute: 1380,
  depositPercent: 30,
  images: [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=1200&q=80',
  ],
  amenities: ['Bãi đỗ ô tô', 'Wifi miễn phí', 'Căng tin'],
  priceFrom: 250000,
  priceTo: 500000,
  avgRating: 4.9,
  reviewsCount: 38,
  courts: [
    {
      id: 'c-1',
      name: 'Sân Bóng Đá 5A',
      sportType: SportType.FOOTBALL5,
      slotMinutes: 60,
      defaultPricePerSlot: 300000,
    },
    {
      id: 'c-2',
      name: 'Sân Pickleball 1',
      sportType: SportType.PICKLEBALL,
      slotMinutes: 60,
      defaultPricePerSlot: 150000,
    },
  ],
};

describe('Venue Detail Flow & Tabs', () => {
  it('renders venue detail components and switches tabs', async () => {
    // Seed query data in cache
    queryClient.setQueryData(['venue-detail', 'san-ngoc-khanh'], mockVenue);

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/venues/:slug" element={<VenueDetailPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>,
    );

    // Push initial history entry
    window.history.pushState({}, '', '/venues/san-ngoc-khanh');

    // Re-render to pick up route
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/venues/:slug" element={<VenueDetailPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>,
    );

    // Verify Title & Breadcrumb/Address
    expect(screen.getAllByText(/Sân Thể Thao Cao Cấp Ngọc Khánh/i).length).toBeGreaterThan(0);

    // Verify Courts List
    expect(screen.getByRole('heading', { name: /Danh Sách Sân Con/i })).toBeDefined();
    expect(screen.getByText(/Sân Bóng Đá 5A/i)).toBeDefined();
    expect(screen.getByText(/Sân Pickleball 1/i)).toBeDefined();

    // Verify Tabs Navigation
    const amenitiesTab = screen.getByRole('button', { name: /Tiện ích cụm sân/i });
    expect(amenitiesTab).toBeDefined();
    fireEvent.click(amenitiesTab);

    // Verify Sticky Booking Sidebar
    expect(screen.getByText(/Bảng Giá Thuê Sân/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Xem Lịch & Đặt Sân Ngay/i })).toBeDefined();
  });
});
