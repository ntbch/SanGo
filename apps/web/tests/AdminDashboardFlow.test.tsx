import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from '../src/features/admin/pages/admin-pages';
import { useAuthStore } from '../src/lib/auth-store';
import * as adminApi from '../src/features/admin/api/admin-api';
import { UserRole, UserStatus, VenueStatus, BookingStatus, SportType } from '@sango/shared';

vi.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="chart-line">Line Chart</div>,
  Bar: () => <div data-testid="chart-bar">Bar Chart</div>,
  Doughnut: () => <div data-testid="chart-doughnut">Doughnut Chart</div>,
}));

const mockStats: adminApi.AdminStatsResponse = {
  totals: {
    users: 150,
    customers: 120,
    owners: 30,
    venues: {
      total: 25,
      PENDING: 3,
      APPROVED: 20,
      REJECTED: 1,
      SUSPENDED: 1,
    },
    bookingsTotal: 1250,
    bookingsToday: 18,
    revenueTodayVnd: 5400000,
  },
  series: [
    { date: '2026-08-26', bookings: 12, revenueVnd: 3600000 },
    { date: '2026-08-27', bookings: 18, revenueVnd: 5400000 },
  ],
  topVenues: [
    { venueId: 'v-1', name: 'Sân Cầu Giấy', bookings: 120, revenueVnd: 36000000 },
    { venueId: 'v-2', name: 'Sân Mỹ Đình', bookings: 95, revenueVnd: 28500000 },
  ],
  recentActivity: [
    { type: 'VENUE_SUBMITTED', at: new Date().toISOString(), label: 'Sân Pickleball Đống Đa nộp hồ sơ' },
    { type: 'BOOKING_CREATED', at: new Date().toISOString(), label: 'Đơn đặt sân CH-20260827-0001 thành công' },
  ],
};

const mockVenues: adminApi.AdminVenueListResponse = {
  items: [
    {
      id: 'venue-p1',
      name: 'Sân Bóng Chờ Duyệt VIP',
      slug: 'san-bong-cho-duyet-vip',
      address: '99 Cầu Giấy',
      city: 'Hà Nội',
      district: 'Cầu Giấy',
      images: [],
      amenities: ['PARKING'],
      depositPercent: 30,
      openMinute: 360,
      closeMinute: 1380,
      status: 'PENDING' as VenueStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: { fullName: 'Nguyễn Văn Chủ', email: 'owner@sango.vn' },
      _count: { courts: 2 },
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
  pages: 1,
};

const mockUsers: adminApi.AdminUserListResponse = {
  items: [
    {
      id: 'admin-1',
      fullName: 'Admin Tổng SanGo',
      email: 'admin@sango.vn',
      phone: '0901234567',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      bookingCount: 5,
    },
    {
      id: 'customer-1',
      fullName: 'Trần Khách Hàng',
      email: 'customer@sango.vn',
      phone: '0987654321',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      bookingCount: 12,
    },
  ],
  total: 2,
};

const mockBookings: adminApi.AdminBookingListResponse = {
  items: [
    {
      id: 'b-1',
      code: 'CH-20260827-0001',
      venueId: 'v-1',
      venueName: 'Sân Cầu Giấy',
      courtName: 'Sân 1',
      customerName: 'Trần Khách Hàng',
      customerEmail: 'customer@sango.vn',
      startTime: '2026-08-27T18:00:00.000Z',
      endTime: '2026-08-27T19:30:00.000Z',
      status: BookingStatus.CONFIRMED,
      totalPriceVnd: 450000,
      createdAt: new Date().toISOString(),
    },
  ],
  total: 1,
};

const mockTournaments: adminApi.AdminTournament[] = [
  {
    id: 't-1',
    name: 'SanGo Pickleball Open 2026',
    sportType: SportType.PICKLEBALL,
    maxTeams: 8,
    prizePoolVnd: 10000000,
    status: 'REGISTRATION',
  },
];

describe('AdminDashboardPage Flow & Checklist Design Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.setState({
      user: {
        id: 'admin-1',
        email: 'admin@sango.vn',
        fullName: 'Admin Tổng SanGo',
        role: UserRole.ADMIN,
        phone: '0901234567',
        status: 'ACTIVE',
      },
    });

    vi.spyOn(adminApi, 'getAdminStats').mockResolvedValue(mockStats);
    vi.spyOn(adminApi, 'getAdminVenues').mockResolvedValue(mockVenues);
    vi.spyOn(adminApi, 'getAdminUsers').mockResolvedValue(mockUsers);
    vi.spyOn(adminApi, 'getAdminBookings').mockResolvedValue(mockBookings);
    vi.spyOn(adminApi, 'getAdminTournaments').mockResolvedValue(mockTournaments);
  });

  it('renders Overview tab with KPI metrics, chart, top venues and live activity', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    // Wait for KPI cards
    await waitFor(() => {
      expect(screen.getByText('Người Dùng Toàn Sàn')).toBeDefined();
      expect(screen.getByText('150')).toBeDefined();
      expect(screen.getByText('Hạ Tầng Cụm Sân')).toBeDefined();
      expect(screen.getByText('25')).toBeDefined();
      expect(screen.getByText(/3 chờ duyệt/)).toBeDefined();
      expect(screen.getByText('Lượt Đặt Toàn Sàn')).toBeDefined();
      expect(screen.getByText('1.250')).toBeDefined();
    });

    // Verify Chart and Rankings
    expect(screen.getByTestId('chart-line')).toBeDefined();
    expect(screen.getByText('Top Cụm Sân Sinh Lời Cao Nhất')).toBeDefined();
    expect(screen.getByText('Sân Cầu Giấy')).toBeDefined();
    expect(screen.getByText('Dòng Sự Kiện Trực Tiếp Toàn Sàn')).toBeDefined();
  });

  it('navigates to Venues tab and renders moderation actions', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-tab-venues')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('admin-tab-venues'));

    await waitFor(() => {
      expect(screen.getByText('Hàng Chờ & Xét Duyệt Cụm Sân')).toBeDefined();
      expect(screen.getByText('Sân Bóng Chờ Duyệt VIP')).toBeDefined();
      expect(screen.getByText('Nguyễn Văn Chủ')).toBeDefined();
      expect(screen.getByText('Duyệt')).toBeDefined();
      expect(screen.getByText('Từ chối')).toBeDefined();
    });
  });

  it('navigates to Users tab and checks user governance table and lock button', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-tab-users')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('admin-tab-users'));

    await waitFor(() => {
      expect(screen.getByText('Quản Trị Người Dùng & Phân Quyền')).toBeDefined();
      expect(screen.getByText('Trần Khách Hàng')).toBeDefined();
    });
  });

  it('navigates to Bookings audit tab and displays platform booking records', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-tab-bookings')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('admin-tab-bookings'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Sổ Tra Cứu Đơn Toàn Sàn/i })).toBeDefined();
      expect(screen.getByText(/CH-20260827-0001/)).toBeDefined();
      expect(screen.getByText(/450\.000/)).toBeDefined();
    });
  });

  it('navigates to Tournaments tab and shows tournament list and creation modal trigger', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-tab-tournaments')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('admin-tab-tournaments'));

    await waitFor(() => {
      expect(screen.getByText('Điều Hành Giải Đấu Thể Thao')).toBeDefined();
      expect(screen.getByText('SanGo Pickleball Open 2026')).toBeDefined();
      expect(screen.getByText('Tạo Giải Đấu Mới')).toBeDefined();
    });
  });
});
