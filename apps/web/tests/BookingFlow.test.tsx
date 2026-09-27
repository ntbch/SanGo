import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BookingCalendarPage,
  CheckoutHoldPage,
  PaymentResultPage,
  MyBookingsPage,
} from '../src/features/booking/pages';
import { BookingStatus, SportType } from '../src/lib/constants';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockVenue = {
  id: 'v-booking-test',
  name: 'Cụm Sân Thể Thao Ba Đình',
  slug: 'san-ba-dinh',
  address: 'Số 10 Ba Đình',
  district: 'Ba Đình',
  city: 'Hà Nội',
  depositPercent: 30,
  courts: [
    {
      id: 'court-test-1',
      name: 'Sân Bóng Đá 5A',
      sportType: SportType.FOOTBALL5,
      slotMinutes: 60,
      defaultPricePerSlot: 300000,
    },
  ],
};

const now = new Date();
const dayOfWeek = now.getDay();
const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
const mondayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
const mondayStr = mondayDate.toISOString().slice(0, 10);

const mockSlots = {
  courtId: 'court-test-1',
  courtStatus: 'ACTIVE',
  slotMinutes: 60,
  from: mondayStr,
  days: 7,
  byDate: [
    {
      date: new Date().toISOString().slice(0, 10),
      slots: [
        { startMinute: 360, endMinute: 420, state: 'AVAILABLE' as const },
        { startMinute: 420, endMinute: 480, state: 'AVAILABLE' as const },
        { startMinute: 1020, endMinute: 1080, state: 'BOOKED' as const },
      ],
    },
  ],
};

const mockHold = {
  id: 'hold-123456',
  courtId: 'court-test-1',
  customerId: 'cust-1',
  date: new Date().toISOString().slice(0, 10),
  startMinute: 360,
  endMinute: 420,
  subtotal: 300000,
  discountAmount: 0,
  finalAmount: 300000,
  status: 'ACTIVE' as const,
  expiresAt: new Date(Date.now() + 600000).toISOString(),
  court: {
    id: 'court-test-1',
    name: 'Sân Bóng Đá 5A',
    sportType: SportType.FOOTBALL5,
    slotMinutes: 60,
    defaultPricePerSlot: 300000,
    venue: {
      id: 'v-booking-test',
      name: 'Cụm Sân Thể Thao Ba Đình',
      slug: 'san-ba-dinh',
      address: 'Số 10 Ba Đình',
      district: 'Ba Đình',
      city: 'Hà Nội',
      depositPercent: 30,
      images: [],
    },
  },
};

const mockTickets = {
  items: [
    {
      id: 'b-ticket-1',
      code: 'CH-20260828-0001',
      courtId: 'court-test-1',
      customerId: 'cust-1',
      date: new Date().toISOString(),
      startMinute: 360,
      endMinute: 420,
      status: BookingStatus.CONFIRMED,
      totalPrice: 300000,
      depositAmount: 90000,
      paidAmount: 90000,
      court: {
        name: 'Sân Bóng Đá 5A',
        sportType: SportType.FOOTBALL5,
        venue: {
          id: 'v-booking-test',
          name: 'Cụm Sân Thể Thao Ba Đình',
          slug: 'san-ba-dinh',
          address: 'Số 10 Ba Đình',
          district: 'Ba Đình',
          city: 'Hà Nội',
        },
      },
      createdAt: new Date().toISOString(),
    },
  ],
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1,
};

describe('Booking Core Flow', () => {
  it('renders booking calendar with week selector and selects slot', async () => {
    queryClient.setQueryData(['venue-detail', 'san-ba-dinh'], mockVenue);
    queryClient.setQueryData(['court-slots', 'court-test-1', mondayStr], mockSlots);

    window.history.pushState({}, '', '/venues/san-ba-dinh/book');

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/venues/:slug/book" element={<BookingCalendarPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>,
    );

    expect(screen.getAllByText(/Ma Trận Đặt Sân Thời Gian Thực/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Sân Bóng Đá 5A/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tuần:/i).length).toBeGreaterThan(0);

    // Slot 06:00 - 07:00
    const availableSlot = screen.getAllByText(/06:00 - 07:00/i)[0];
    expect(availableSlot).toBeDefined();
    fireEvent.click(availableSlot);
  });

  it('renders checkout hold page with timer and payment details', async () => {
    queryClient.setQueryData(['booking-hold', 'hold-123456'], mockHold);

    window.history.pushState({}, '', '/checkout/hold/hold-123456');

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/checkout/hold/:holdId" element={<CheckoutHoldPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>,
    );

    expect(screen.getAllByText(/Thời gian giữ chỗ đang đếm ngược/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Chi Tiết Đơn Đặt Sân/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Đặt cọc 30%/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Cổng VNPAY QR/i).length).toBeGreaterThan(0);
  });

  it('renders payment result receipt page', () => {
    render(
      <BrowserRouter>
        <PaymentResultPage />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Thanh Toán Đặt Sân Thành Công!/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Xem Vé Của Tôi/i })).toBeDefined();
  });

  it('renders my bookings page and ticket card with QR code check-in', () => {
    queryClient.setQueryData(['my-bookings', 'upcoming'], mockTickets);

    window.history.pushState({}, '', '/bookings');

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/bookings" element={<MyBookingsPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText(/Vé Đặt Sân Của Tôi/i)).toBeDefined();
    expect(screen.getByText(/CH-20260828-0001/i)).toBeDefined();

    // Check-in QR button
    const qrBtn = screen.getByRole('button', { name: /Mã QR Check-in/i });
    expect(qrBtn).toBeDefined();
    fireEvent.click(qrBtn);

    expect(screen.getByText(/Mã Check-in Vào Sân/i)).toBeDefined();
  });
});
