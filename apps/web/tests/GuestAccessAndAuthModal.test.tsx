import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from '../src/app/routes';
import { VenueDetailPage } from '../src/features/venues/pages';
import { TournamentsPage } from '../src/features/tournaments/pages';
import { useAuthStore } from '../src/lib/auth-store';
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
  openMinute: 360,
  closeMinute: 1380,
  depositPercent: 30,
  images: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80'],
  amenities: ['Bãi đỗ xe', 'Wifi'],
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
  ],
};

describe('Guest Access and Auth Modal Popups', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      status: 'unauthenticated',
    });
    queryClient.setQueryData(['venue-detail', 'san-ngoc-khanh'], mockVenue);
  });

  it('redirects guest to /login when attempting to access private wallet/booking routes', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/wallet']}>
          <AppRoutes />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // ProtectedRoute should redirect guest to LoginPage
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Đăng Nhập/i })).toBeDefined();
    }, { timeout: 10000 });
  });

  it('allows guest to view venue details and shows Auth Modal when clicking booking button', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/venues/san-ngoc-khanh']}>
          <Routes>
            <Route path="/venues/:slug" element={<VenueDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Xem Lịch & Đặt Sân Ngay/i })).toBeDefined();
    });

    const bookButton = screen.getByRole('button', { name: /Xem Lịch & Đặt Sân Ngay/i });
    fireEvent.click(bookButton);

    // Should open Auth Modal popup without navigating away
    await waitFor(() => {
      expect(screen.getByText(/Đăng Nhập Để Xem Lịch & Đặt Sân/i)).toBeDefined();
      expect(screen.getByText(/SanGo Sports ID/i)).toBeDefined();
    });
  });

  it('allows guest to view tournaments and shows Auth Modal when clicking create tournament', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/tournaments']}>
          <Routes>
            <Route path="/tournaments" element={<TournamentsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tạo Giải Đấu/i })).toBeDefined();
    });

    const createBtn = screen.getByRole('button', { name: /Tạo Giải Đấu/i });
    fireEvent.click(createBtn);

    // Should open Auth Modal popup
    await waitFor(() => {
      expect(screen.getByText(/Đăng Nhập Để Tạo Giải Đấu/i)).toBeDefined();
    });
  });
});
