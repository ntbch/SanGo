import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VenueDetailPage } from '../src/features/venues/pages';
import { SportType } from '../src/lib/constants';
import { formatLocalDateToYMD } from '../src/lib/utils';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const now = new Date();
const dayOfWeek = now.getDay();
const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
const mondayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
const mondayStr = formatLocalDateToYMD(mondayDate);
const todayDateStr = formatLocalDateToYMD(now);

const mockSlots = {
  courtId: 'c-1',
  courtStatus: 'ACTIVE',
  slotMinutes: 60,
  from: mondayStr,
  days: 7,
  byDate: [
    {
      date: todayDateStr,
      slots: [
        { startMinute: 360, endMinute: 420, state: 'AVAILABLE' as const },
        { startMinute: 420, endMinute: 480, state: 'AVAILABLE' as const },
        { startMinute: 1020, endMinute: 1080, state: 'BOOKED' as const },
      ],
    },
  ],
};

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
  const scrollIntoViewMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
    queryClient.setQueryData(['venue-detail', 'san-ngoc-khanh'], mockVenue);
    queryClient.setQueryData(['court-slots', 'c-1', mondayStr], mockSlots);
  });

  it('renders venue detail components and switches tabs', async () => {
    window.history.pushState({}, '', '/venues/san-ngoc-khanh');

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
    expect(screen.getAllByText(/Sân Bóng Đá 5A/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Sân Pickleball 1/i).length).toBeGreaterThan(0);

    // Verify Tabs Navigation
    const amenitiesTab = screen.getByRole('button', { name: /Tiện ích cụm sân/i });
    expect(amenitiesTab).toBeDefined();
    fireEvent.click(amenitiesTab);

    // Verify Sticky Booking Sidebar
    expect(screen.getByText(/Bảng Giá Thuê Sân/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Xem Lịch & Đặt Sân Ngay/i })).toBeDefined();
  });

  it('embeds unified interactive booking section (#booking) with slot selection', async () => {
    window.history.pushState({}, '', '/venues/san-ngoc-khanh');

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/venues/:slug" element={<VenueDetailPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>,
    );

    // Verify embedded booking matrix section
    expect(screen.getAllByText(/Ma Trận Đặt Sân Thời Gian Thực/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tuần:/i).length).toBeGreaterThan(0);

    // Verify slot in matrix is clickable
    const slot06 = screen.getAllByText(/06:00 - 07:00/i)[0];
    expect(slot06).toBeDefined();
    fireEvent.click(slot06);

    // Check that floating BookingSummaryBar appeared with slot details
    expect(screen.getAllByText(/Giữ Chỗ 10 Phút & Thanh Toán/i).length).toBeGreaterThan(0);
  });

  it('smoothly scrolls to #booking when clicking CTA in sticky sidebar', async () => {
    window.history.pushState({}, '', '/venues/san-ngoc-khanh');

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/venues/:slug" element={<VenueDetailPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>,
    );

    const ctaButton = screen.getByRole('button', { name: /Xem Lịch & Đặt Sân Ngay/i });
    fireEvent.click(ctaButton);

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('automatically scrolls to #booking when landing with hash', async () => {
    window.history.pushState({}, '', '/venues/san-ngoc-khanh#booking');

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/venues/:slug" element={<VenueDetailPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>,
    );

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
  });
});
