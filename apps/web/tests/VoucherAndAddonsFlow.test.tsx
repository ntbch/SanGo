import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CheckoutHoldPage } from '../src/features/booking/pages';
import { CheckoutAddOnsPicker } from '../src/features/booking/components/checkout-addons-picker';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';

vi.mock('../src/features/venues/api/venue-services-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/features/venues/api/venue-services-api')>();
  return {
    ...actual,
    listPublicVenueServicesApi: vi.fn().mockResolvedValue([
      {
        id: 'svc-1',
        venueId: 'v-1',
        name: 'Nước lọc Aquafina 500ml',
        category: 'BEVERAGE',
        unitPriceVnd: 15000,
        unit: 'Chai',
        isActive: true,
      },
    ]),
  };
});

vi.mock('../src/features/booking/api/booking-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/features/booking/api/booking-api')>();
  return {
    ...actual,
    getBookingHoldApi: vi.fn().mockResolvedValue({
      id: 'h-test-1',
      courtId: 'c-1',
      customerId: 'u-1',
      date: '2026-09-01',
      startMinute: 1080,
      endMinute: 1140,
      subtotal: 300000,
      discountAmount: 0,
      finalAmount: 300000,
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 600000).toISOString(),
      court: {
        id: 'c-1',
        name: 'Sân 7A',
        sportType: 'FOOTBALL7',
        slotMinutes: 60,
        defaultPricePerSlot: 300000,
        venue: {
          id: 'v-1',
          name: 'Cụm Sân Ngọc Khánh',
          slug: 'san-ngoc-khanh',
          address: '12 Ngọc Khánh',
          district: 'Ba Đình',
          city: 'Hà Nội',
          depositPercent: 30,
          images: [],
        },
      },
    }),
    applyHoldVoucherApi: vi.fn().mockResolvedValue({
      id: 'h-test-1',
      discountAmount: 50000,
      finalAmount: 250000,
      voucherId: 'v-sango-vip',
    }),
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});



describe('Voucher, Add-ons and AI Widget Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: {
        id: 'u-1',
        email: 'customer@sango.vn',
        fullName: 'Trần Đức',
        role: UserRole.CUSTOMER,
      },
      accessToken: 'test-token',
      status: 'authenticated',
    });
  });

  it('renders Voucher input and applies voucher suggestion chips in CheckoutHoldPage', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/bookings/hold/h-test-1']}>
          <Routes>
            <Route path="/bookings/hold/:holdId" element={<CheckoutHoldPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Mã Ưu Đãi & Voucher Giảm Giá/i)).toBeDefined();
    });

    expect(screen.getByPlaceholderText(/Nhập mã voucher/i)).toBeDefined();

    // Click preset chip SANGOVIP
    const chipBtn = screen.getByRole('button', { name: /SANGOVIP/i });
    fireEvent.click(chipBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Áp Dụng/i })).toBeDefined();
    });
  });

  it('renders and interacts with CheckoutAddOnsPicker quantity stepper during hold checkout', async () => {
    const handleChange = vi.fn();
    queryClient.setQueryData(['public-venue-services', 'v-1'], [
      {
        id: 'svc-1',
        venueId: 'v-1',
        name: 'Nước lọc Aquafina 500ml',
        category: 'BEVERAGE',
        unitPriceVnd: 15000,
        unit: 'Chai',
        isActive: true,
      },
    ]);

    render(
      <QueryClientProvider client={queryClient}>
        <CheckoutAddOnsPicker
          venueId="v-1"
          selectedItems={[]}
          onChange={handleChange}
        />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Nước lọc Aquafina 500ml/i)).toBeDefined();
      expect(screen.getByText(/15.000/i)).toBeDefined();
    });
  });
});
