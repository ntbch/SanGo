import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OwnerDashboardPage } from '../src/features/dashboard/pages/owner-dashboard-page';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';
import * as ownerApi from '../src/features/dashboard/api/owner-api';

vi.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="chart-line">Line Chart</div>,
  Bar: () => <div data-testid="chart-bar">Bar Chart</div>,
  Doughnut: () => <div data-testid="chart-doughnut">Doughnut Chart</div>,
}));

const mockVenues: ownerApi.OwnerVenueListResponse = {
  items: [
    {
      id: 'venue-1',
      name: 'Sân Bóng SanGo Cầu Giấy',
      slug: 'san-bong-sango-cau-giay',
      address: '123 Cầu Giấy',
      city: 'Hà Nội',
      district: 'Cầu Giấy',
      images: [],
      amenities: ['PARKING', 'LIGHTING'],
      depositPercent: 30,
      openMinute: 360,
      closeMinute: 1380,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { courts: 3 },
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
  pages: 1,
};

const mockCourts: ownerApi.Court[] = [
  {
    id: 'court-1',
    venueId: 'venue-1',
    name: 'Sân Số 1 (VIP)',
    sportType: 'FOOTBALL5',
    slotMinutes: 60,
    defaultPricePerSlot: 300000,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'court-2',
    venueId: 'venue-1',
    name: 'Sân Số 2',
    sportType: 'FOOTBALL7',
    slotMinutes: 90,
    defaultPricePerSlot: 500000,
    status: 'MAINTENANCE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockAnalytics: ownerApi.OwnerAnalyticsResponse = {
  periodDays: 30,
  revenueConfirmed: 18500000,
  totalBookings: 45,
  cancelledCount: 2,
  noShowCount: 1,
  // computeCancelRate trả FRACTION 0..1 (analytics.service.ts) — 6.6 là phần trăm,
  // nhân 100 ở component sẽ ra "660.0%".
  cancelRate: 0.066,
  series: [
    { date: '2026-08-20', bookings: 3, revenueVnd: 900000 },
    { date: '2026-08-21', bookings: 4, revenueVnd: 1200000 },
    { date: '2026-08-22', bookings: 5, revenueVnd: 1500000 },
  ],
  topCourts: [
    {
      courtId: 'court-1',
      courtName: 'Sân Số 1 (VIP)',
      bookings: 28,
      revenueVnd: 11200000,
    },
  ],
};

const mockBookings: ownerApi.OwnerBookingsResponse = {
  items: [
    {
      id: 'bk-1',
      code: 'CH-20260828-0001',
      customerId: 'cust-1',
      courtId: 'court-1',
      date: '2026-08-28',
      startMinute: 1020,
      endMinute: 1080,
      subtotal: 300000,
      depositAmount: 90000,
      status: 'CONFIRMED',
      court: {
        id: 'court-1',
        name: 'Sân Số 1 (VIP)',
        sportType: 'FOOTBALL5',
      },
      customer: {
        id: 'cust-1',
        fullName: 'Nguyễn Văn Cầu Thủ',
        phone: '0901234567',
        email: 'cauthu@sango.vn',
      },
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
  pages: 1,
};

const mockServices: ownerApi.VenueService[] = [
  {
    id: 'srv-1',
    venueId: 'venue-1',
    name: 'Nước Pocari Sweat 500ml',
    price: 15000,
    type: 'BEVERAGE',
    isAvailable: true,
  },
  {
    id: 'srv-2',
    venueId: 'venue-1',
    name: 'Thuê Áo Bib Thi Đấu (Bộ 10 áo)',
    price: 50000,
    type: 'EQUIPMENT',
    isAvailable: true,
  },
];

const mockVouchers: ownerApi.OwnerVoucher[] = [
  {
    id: 'vch-1',
    code: 'SANGO30SANG',
    percentOff: 30,
    dayOfWeek: 1,
    validFromMinute: 480,
    validToMinute: 960,
    usageLimit: 50,
    perUserLimit: 1,
    usedCount: 12,
    active: true,
    expiresAt: null,
    createdAt: new Date().toISOString(),
  },
];

describe('Owner Dashboard Full Integration Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: {
        id: 'owner-1',
        email: 'owner@sango.vn',
        fullName: 'Chủ Sân Trần Đức',
        role: UserRole.OWNER,
      },
      accessToken: 'test-owner-token',
      status: 'authenticated',
    });

    vi.spyOn(ownerApi, 'getOwnerVenuesApi').mockResolvedValue(mockVenues);
    vi.spyOn(ownerApi, 'getVenueCourtsApi').mockResolvedValue(mockCourts);
    vi.spyOn(ownerApi, 'getOwnerAnalyticsApi').mockResolvedValue(mockAnalytics);
    vi.spyOn(ownerApi, 'getOwnerBookingsApi').mockResolvedValue(mockBookings);
    vi.spyOn(ownerApi, 'getVenueServicesApi').mockResolvedValue(mockServices);
    vi.spyOn(ownerApi, 'getOwnerVouchersApi').mockResolvedValue(mockVouchers);
    vi.spyOn(ownerApi, 'getCourtPricingRulesApi').mockResolvedValue([]);
  });

  it('renders Owner Dashboard Overview tab by default with KPIs and Today schedule', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/owner']}>
        <Routes>
          <Route path="/dashboard/owner" element={<OwnerDashboardPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Verify Brand and Selected Venue
    expect(screen.getAllByText(/SanGo/i).length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.getAllByText(/Sân Bóng SanGo Cầu Giấy/i).length).toBeGreaterThan(0);
    });

    // Verify Executive Overview elements
    expect(screen.getByText(/Trung Tâm Điều Hành/i)).toBeDefined();
    expect(screen.getByText(/Doanh Thu \(30 Ngày\)/i)).toBeDefined();
    expect(screen.getByText(/Lịch Đá Hôm Nay/i)).toBeDefined();
    expect(screen.getByText(/Quy Mô Sân Bãi/i)).toBeDefined();
    expect(screen.getByText(/Check-in Nhanh Tại Bàn Làm Việc/i)).toBeDefined();
    expect(screen.getByText(/Lối Tắt Vận Hành Sân/i)).toBeDefined();

    // Verify Bookings list on overview
    await waitFor(() => {
      expect(screen.getByText(/CH-20260828-0001/i)).toBeDefined();
      expect(screen.getByText(/Nguyễn Văn Cầu Thủ/i)).toBeDefined();
    });
  });

  it('navigates to Schedule Timeline Grid tab and opens Walk-in modal', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/owner']}>
        <Routes>
          <Route path="/dashboard/owner" element={<OwnerDashboardPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Sân Bóng SanGo Cầu Giấy/i).length).toBeGreaterThan(0);
    });

    // Switch to Schedule tab
    const scheduleTabBtn = screen.getByTestId('owner-tab-schedule');
    fireEvent.click(scheduleTabBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Ma Trận Lịch Sân/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Lịch Hoạt Động Cụm Sân/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Tạo Đơn Quầy/i })).toBeDefined();
    });

    // Open Walk-in Modal
    const walkInBtn = screen.getByRole('button', { name: /Tạo Đơn Quầy/i });
    fireEvent.click(walkInBtn);

    await waitFor(() => {
      expect(screen.getByText(/Tạo Đơn Đặt Sân Tại Quầy \(Walk-in\)/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/Ví dụ: Anh Hoàng/i)).toBeDefined();
    });
  });

  it('submits a walk-in whose range is aligned to the selected court slot grid', async () => {
    // Regression: modal từng gửi cứng 90 phút, còn server chỉ nhận ca khớp
    // lưới của sân — trên sân 60 phút mọi lần gửi đều bị SLOTS_MISALIGNED.
    const createWalkIn = vi
      .spyOn(ownerApi, 'createWalkInBookingApi')
      .mockResolvedValue({ code: 'CH-20350101-0001', subtotal: 300000 } as never);
    render(
      <MemoryRouter initialEntries={['/dashboard/owner']}>
        <Routes>
          <Route path="/dashboard/owner" element={<OwnerDashboardPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getAllByText(/Sân Bóng SanGo Cầu Giấy/i).length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getByTestId('owner-tab-schedule'));
    fireEvent.click(await screen.findByRole('button', { name: /Tạo Đơn Quầy/i }));

    fireEvent.change(await screen.findByPlaceholderText(/Ví dụ: Anh Hoàng/i), {
      target: { value: 'Khách tại quầy' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Xác Nhận Đặt Quầy/i }));

    await waitFor(() => expect(createWalkIn).toHaveBeenCalledTimes(1));
    const payload = createWalkIn.mock.calls[0][0];
    const venue = mockVenues.items[0];
    const court = mockCourts.find((c) => c.id === payload.courtId)!;
    expect(court.slotMinutes).toBe(60);
    // Đúng predicate của server (createWalkIn trong bookings.service.ts).
    expect(payload.startMinute).toBeGreaterThanOrEqual(venue.openMinute);
    expect(payload.endMinute).toBeLessThanOrEqual(venue.closeMinute);
    expect(payload.endMinute).toBeGreaterThan(payload.startMinute);
    expect((payload.startMinute - venue.openMinute) % court.slotMinutes).toBe(0);
    expect((payload.endMinute - payload.startMinute) % court.slotMinutes).toBe(0);
    expect(payload.guestName).toBe('Khách tại quầy');
  });

  it('navigates to Check-in quầy tab', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/owner']}>
        <Routes>
          <Route path="/dashboard/owner" element={<OwnerDashboardPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Sân Bóng SanGo Cầu Giấy/i).length).toBeGreaterThan(0);
    });

    // Switch to Check-in tab
    const checkinTabBtn = screen.getByTestId('owner-tab-checkin');
    fireEvent.click(checkinTabBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Quầy Check-in 1-Click/i).length).toBeGreaterThan(0);
      expect(screen.getByPlaceholderText(/Nhập mã đơn vé/i)).toBeDefined();
    });
  });

  it('navigates to Analytics tab and displays KPI cards and revenue series', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/owner']}>
        <Routes>
          <Route path="/dashboard/owner" element={<OwnerDashboardPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Sân Bóng SanGo Cầu Giấy/i).length).toBeGreaterThan(0);
    });

    // Switch to Analytics tab
    const analyticsTabBtn = screen.getByTestId('owner-tab-analytics');
    fireEvent.click(analyticsTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Báo Cáo Hiệu Suất & Doanh Thu/i)).toBeDefined();
      expect(screen.getByText(/Doanh Thu Xác Nhận/i)).toBeDefined();
      expect(screen.getByText(/18.500.000/i)).toBeDefined();
      expect(screen.getByText(/45 đơn/i)).toBeDefined();
      // Chốt đơn vị: (0.066 * 100).toFixed(1) = "6.6%".
      expect(screen.getByText('6.6%')).toBeDefined();
    });
  });

  it('navigates to Courts Management tab and displays court list with maintenance status', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/owner']}>
        <Routes>
          <Route path="/dashboard/owner" element={<OwnerDashboardPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Sân Bóng SanGo Cầu Giấy/i).length).toBeGreaterThan(0);
    });

    // Switch to Venues/Courts tab
    const courtsTabBtn = screen.getByTestId('owner-tab-venues');
    fireEvent.click(courtsTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Danh Sách Sân Con/i)).toBeDefined();
      expect(screen.getByText(/Sân Số 1/i)).toBeDefined();
      expect(screen.getByText(/Sân Số 2/i)).toBeDefined();
      expect(screen.getAllByText(/Hoạt động/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Bảo trì/i).length).toBeGreaterThan(0);
    });

    // Check "Thêm Sân Con" modal button
    const addCourtBtn = screen.getByRole('button', { name: /Thêm Sân Con/i });
    fireEvent.click(addCourtBtn);
    expect(screen.getByRole('heading', { name: /Thêm Sân Con Mới/i })).toBeDefined();
  });

  it('navigates to Pricing Rules tab and verifies DayType switching', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/owner']}>
        <Routes>
          <Route path="/dashboard/owner" element={<OwnerDashboardPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Sân Bóng SanGo Cầu Giấy/i).length).toBeGreaterThan(0);
    });

    // Switch to Pricing tab
    const pricingTabBtn = screen.getByTestId('owner-tab-pricing');
    fireEvent.click(pricingTabBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Cấu Hình Bảng Giá Giờ Vàng/i).length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /Ngày Thường \(T2 - T6\)/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Cuối Tuần \(T7 - CN\)/i })).toBeDefined();
      expect(screen.getAllByRole('button', { name: /Thêm Khung Giờ/i }).length).toBeGreaterThan(0);
    });
  });

  it('navigates to Services tab and displays beverages and equipment', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/owner']}>
        <Routes>
          <Route path="/dashboard/owner" element={<OwnerDashboardPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Sân Bóng SanGo Cầu Giấy/i).length).toBeGreaterThan(0);
    });

    // Switch to Services tab
    const servicesTabBtn = screen.getByTestId('owner-tab-services');
    fireEvent.click(servicesTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Menu Dịch Vụ & Tiện Ích Sân/i)).toBeDefined();
      expect(screen.getByText(/Nước Pocari Sweat 500ml/i)).toBeDefined();
      expect(screen.getByText(/Thuê Áo Bib Thi Đấu/i)).toBeDefined();
    });
  });

  it('navigates to Vouchers tab and displays discount codes with off-peak rules', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/owner']}>
        <Routes>
          <Route path="/dashboard/owner" element={<OwnerDashboardPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Sân Bóng SanGo Cầu Giấy/i).length).toBeGreaterThan(0);
    });

    // Switch to Vouchers tab
    const vouchersTabBtn = screen.getByTestId('owner-tab-vouchers');
    fireEvent.click(vouchersTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Chương Trình Voucher Kích Cầu Giờ Thấp Điểm/i)).toBeDefined();
      expect(screen.getByText(/SANGO30SANG/i)).toBeDefined();
      expect(screen.getByText(/Giảm 30% giá slot/i)).toBeDefined();
    });
  });
});
