import { UserRole, vnToday } from '@courthub/shared';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as BookingQueriesModule from '../features/booking/queries';
import type { CustomerBooking, PaginatedCustomerBookings } from '../features/booking/types';
import type * as AdminQueriesModule from '../features/admin/queries';
import type * as OwnerApiModule from '../features/owner/api';
import type { OwnerBooking } from '../features/owner/types';
import { resetMockSession } from '../lib/api/mock-server';
import { useAuthStore } from '../lib/auth/auth-store';
import { type AuthUser } from '../lib/api/types';
import { renderApp } from '../test/test-utils';
import { DashboardPage } from './dashboard-page';

vi.stubEnv('VITE_USE_MOCK', 'true');

/** Stub dữ liệu đơn upcoming của customer: items = success, error = failure. */
interface CustomerBookingsStub {
  items?: PaginatedCustomerBookings;
  error?: Error;
}

/** Trạng thái override dùng chung cho các test — reset trong beforeEach. */
const mocks = vi.hoisted(() => ({
  customerBookings: undefined as undefined | CustomerBookingsStub,
  /** Fixture /owner/bookings theo venueId — null nghĩa là đi qua mock thật. */
  ownerBookingsByVenue: null as null | Record<string, unknown>,
  ownerFetchError: null as Error | null,
  adminVenuesError: null as Error | null,
}));

vi.mock('../features/booking/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof BookingQueriesModule>();
  return {
    ...actual,
    useMyBookings: ((query: Parameters<typeof actual.useMyBookings>[0]) => {
      const stub = mocks.customerBookings;
      if (stub !== undefined) {
        const result = {
          data: stub.error ? undefined : stub.items,
          error: stub.error ?? null,
          isPending: false,
          isError: stub.error !== undefined,
        };
        return result as unknown as ReturnType<typeof actual.useMyBookings>;
      }
      return actual.useMyBookings(query);
    }) as typeof actual.useMyBookings,
  };
});

vi.mock('../features/owner/api', async (importOriginal) => {
  const actual = await importOriginal<typeof OwnerApiModule>();
  return {
    ...actual,
    fetchOwnerBookings: (async (filters?: { venueId?: string }) => {
      if (mocks.ownerFetchError !== null) throw mocks.ownerFetchError;
      const fixture = mocks.ownerBookingsByVenue?.[filters?.venueId ?? ''];
      return (fixture ?? { items: [], total: 0, page: 1, limit: 50, pages: 1 }) as Awaited<
        ReturnType<typeof actual.fetchOwnerBookings>
      >;
    }) as typeof actual.fetchOwnerBookings,
  };
});

vi.mock('../features/admin/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof AdminQueriesModule>();
  return {
    ...actual,
    useAdminVenues: ((filters: Parameters<typeof actual.useAdminVenues>[0]) => {
      if (mocks.adminVenuesError !== null) {
        const result = {
          data: undefined,
          error: mocks.adminVenuesError,
          isPending: false,
          isError: true,
        };
        return result as unknown as ReturnType<typeof actual.useAdminVenues>;
      }
      return actual.useAdminVenues(filters);
    }) as typeof actual.useAdminVenues,
  };
});

/* --------------------- fixture helpers (clock-proof) --------------------- */

/** YYYY-MM-DD hôm nay theo mốc VN (cùng nguồn với dashboard-utils.todayIso). */
function todayIso(): string {
  return vnToday();
}

/** +days ngày kể từ một ngày ISO YYYY-MM-DD (thuần lịch, không lệch múi giờ). */
function shiftIso(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const shifted = new Date(year, month - 1, day + days);
  return (
    shifted.getFullYear() +
    '-' +
    String(shifted.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(shifted.getDate()).padStart(2, '0')
  );
}

let bookingSeq = 0;

function customerBooking(overrides: Partial<CustomerBooking>): CustomerBooking {
  bookingSeq += 1;
  return {
    id: 'cb-test-' + bookingSeq,
    code: 'CH-TEST-' + String(bookingSeq).padStart(4, '0'),
    venueId: 'v-1',
    venueName: 'Sân Pickleball Saigon',
    courtName: 'Sân 1',
    sportType: 'PICKLEBALL',
    date: shiftIso(todayIso(), 3),
    startMinute: 1080,
    endMinute: 1200,
    status: 'CONFIRMED',
    amountPaid: 72000,
    totalPrice: 240000,
    paymentType: 'DEPOSIT',
    depositPercent: 30,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function ownerBooking(overrides: Partial<OwnerBooking>): OwnerBooking {
  bookingSeq += 1;
  return {
    id: 'ob-' + bookingSeq,
    code: 'CH-OB-' + String(bookingSeq).padStart(4, '0'),
    courtName: 'Sân 1',
    customerName: 'Khách ' + bookingSeq,
    date: todayIso(),
    startMinute: 360,
    endMinute: 420,
    status: 'CONFIRMED',
    amountPaid: 36000,
    ...overrides,
  };
}

function ownerPage(items: OwnerBooking[]): {
  items: OwnerBooking[];
  total: number;
  page: number;
  limit: number;
  pages: number;
} {
  return { items, total: items.length, page: 1, limit: 50, pages: 1 };
}

function seedOwnerFixtures(): void {
  // Khớp /venues/mine thật: u-owner có v-1, v-2, v-3.
  mocks.ownerBookingsByVenue = {
    'v-1': ownerPage([
      ownerBooking({ status: 'CONFIRMED', amountPaid: 36000 }),
      ownerBooking({ status: 'CONFIRMED', amountPaid: 36000 }),
      ownerBooking({ status: 'COMPLETED', amountPaid: 400000 }),
    ]),
    'v-2': ownerPage([
      ownerBooking({ status: 'CHECKED_IN', amountPaid: 90000 }),
      ownerBooking({ status: 'PENDING_PAYMENT', amountPaid: 0 }),
    ]),
    'v-3': ownerPage([]),
  };
}

function asUser(role: UserRole, id = 'u-1'): void {
  const user: AuthUser = { id, email: 'u@courthub.vn', fullName: 'Người Dùng', role };
  useAuthStore.getState().setSession(user, 'token-test');
}

describe('DashboardPage — tổng quan theo vai', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    resetMockSession();
    mocks.customerBookings = undefined;
    mocks.ownerBookingsByVenue = null;
    mocks.ownerFetchError = null;
    mocks.adminVenuesError = null;
  });

  /* ------------------------------ CUSTOMER ------------------------------ */

  it('CUSTOMER thấy thẻ Đơn sắp tới (mã đơn, ngày dd/mm) + nút QR check-in và đặt sân', async () => {
    mocks.customerBookings = {
      items: {
        items: [customerBooking({ code: 'CH-FUTURE-0001' })],
        total: 1,
        page: 1,
        pages: 1,
      },
    };
    asUser(UserRole.CUSTOMER);
    renderApp({ route: '/dashboard' });

    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeTruthy();
    expect(await screen.findByTestId('customer-upcoming')).toBeTruthy();

    expect(screen.getByText('CH-FUTURE-0001')).toBeTruthy();
    expect(screen.getByText(/Sân Pickleball Saigon · Sân 1/)).toBeTruthy();
    expect(screen.getByText('Đã xác nhận')).toBeTruthy();
    // Ngày hiển thị định dạng Việt Nam thay vì ISO raw.
    expect(screen.getByText(/\d{2}\/\d{2}\/\d{4}/)).toBeTruthy();

    const qrLink = screen.getByRole('link', { name: /Xem QR check-in/ });
    expect(qrLink.getAttribute('href')).toBe('/dashboard/my-bookings');
    const bookLink = screen.getByRole('link', { name: 'Đặt sân ngay' });
    expect(bookLink.getAttribute('href')).toBe('/venues');
  });

  it('CUSTOMER không thấy KPI của OWNER lẫn panel của ADMIN', async () => {
    mocks.customerBookings = {
      items: { items: [customerBooking({})], total: 1, page: 1, pages: 1 },
    };
    asUser(UserRole.CUSTOMER);
    renderApp({ route: '/dashboard' });

    await screen.findByTestId('customer-upcoming');
    expect(screen.queryByText('Tổng sân của tôi')).toBeNull();
    expect(screen.queryByText('Doanh thu kỳ hiện tại')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Quản lý sân' })).toBeNull(); // sidebar owner-only
    expect(screen.queryByText('Cụm sân chờ duyệt')).toBeNull();
    expect(screen.queryByRole('link', { name: /Vào hàng chờ duyệt/ })).toBeNull();
  });

  it('CUSTOMER chưa có đơn upcoming → empty state mời đặt sân đầu tiên', async () => {
    mocks.customerBookings = { items: { items: [], total: 0, page: 1, pages: 1 } };
    asUser(UserRole.CUSTOMER);
    renderApp({ route: '/dashboard' });

    expect(await screen.findByTestId('customer-upcoming-empty')).toBeTruthy();
    expect(screen.getByText(/chưa có đơn nào sắp diễn ra/i)).toBeTruthy();
    expect(screen.queryByTestId('customer-upcoming')).toBeNull();

    const cta = screen.getByRole('link', { name: 'Đặt sân đầu tiên' });
    expect(cta.getAttribute('href')).toBe('/venues');
  });

  it('CUSTOMER chỉ có đơn CONFIRMED đã qua ngày → bị loại, hiện empty state', async () => {
    mocks.customerBookings = {
      items: {
        items: [customerBooking({ date: shiftIso(todayIso(), -2) })],
        total: 1,
        page: 1,
        pages: 1,
      },
    };
    asUser(UserRole.CUSTOMER);
    renderApp({ route: '/dashboard' });

    expect(await screen.findByTestId('customer-upcoming-empty')).toBeTruthy();
    expect(screen.queryByTestId('customer-upcoming')).toBeNull();
  });

  it('CUSTOMER lỗi tải đơn → hộp lỗi role="alert"', async () => {
    mocks.customerBookings = { error: new Error('mock network boom') };
    asUser(UserRole.CUSTOMER);
    renderApp({ route: '/dashboard' });

    expect(await screen.findByRole('alert')).toBeTruthy();
    // plain Error → friendlyApiMessage trả fallback chung, không lộ message thô.
    expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại sau.')).toBeTruthy();
    expect(screen.queryByTestId('customer-upcoming')).toBeNull();
  });

  /* -------------------------------- OWNER -------------------------------- */

  it('OWNER thấy 4 KPI kỳ 30 ngày đúng số liệu và 2 nút nhanh quản lý/thống kê', async () => {
    seedOwnerFixtures();
    asUser(UserRole.OWNER);
    renderApp({ route: '/dashboard' });
    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeTruthy();

    // 3 cụm sân; 5 đơn trong kỳ đều là hôm nay; đã thu 562.000₫; 0% huỷ.
    await waitFor(() => {
      expect(screen.getByTestId('kpi-owner-venues').textContent).toBe('3');
      expect(screen.getByTestId('kpi-owner-today').textContent).toBe('5');
      expect(screen.getByTestId('kpi-owner-revenue').textContent).toContain('562');
      expect(screen.getByTestId('kpi-owner-cancel').textContent).toBe('0%');
    });
    expect(screen.getByText('Đơn hôm nay')).toBeTruthy();
    expect(screen.getByText('Doanh thu kỳ hiện tại')).toBeTruthy();
    expect(screen.getByText('Tỷ lệ hủy')).toBeTruthy();
    expect(screen.getByText('Đã thu trong 30 ngày gần nhất')).toBeTruthy();

    // Sidebar owner cũng có link "Quản lý sân" → kiểm tra tồn tại link tới /dashboard/manage.
    const manageLinks = screen.getAllByRole('link', { name: /Quản lý sân/ });
    expect(manageLinks.some((link) => link.getAttribute('href') === '/dashboard/manage')).toBe(
      true,
    );

    const statsLink = screen.getByRole('link', { name: 'Xem thống kê' });
    expect(statsLink.getAttribute('href')).toBe('/dashboard/statistics');
  });

  it('OWNER không thấy widget Đơn sắp tới của customer và hàng chờ của admin', async () => {
    seedOwnerFixtures();
    asUser(UserRole.OWNER);
    renderApp({ route: '/dashboard' });

    await waitFor(() => expect(screen.getByTestId('kpi-owner-venues')).toBeTruthy());
    expect(screen.queryByText('Đơn sắp tới')).toBeNull();
    expect(screen.queryByRole('link', { name: /Xem QR check-in/ })).toBeNull();
    expect(screen.queryByText('Đặt sân ngay')).toBeNull();
    expect(screen.queryByTestId('kpi-admin-pending')).toBeNull();
  });

  it('OWNER lỗi tải dữ liệu → hộp lỗi role="alert", tỷ lệ huỷ hiển thị "—"', async () => {
    mocks.ownerFetchError = new Error('owner boom');
    asUser(UserRole.OWNER);
    renderApp({ route: '/dashboard' });

    expect(await screen.findByRole('alert')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId('kpi-owner-cancel').textContent).toBe('—');
    });
  });

  /* -------------------------------- ADMIN -------------------------------- */

  it('ADMIN thấy số cụm sân chờ duyệt, đếm nhanh theo trạng thái và nút vào hàng chờ', async () => {
    asUser(UserRole.ADMIN);
    renderApp({ route: '/dashboard' });
    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeTruthy();

    // Mock chỉ có v-2 (Cụm Cầu lông Thủ Đức) ở trạng thái PENDING.
    await waitFor(() => {
      expect(screen.getByTestId('kpi-admin-pending').textContent).toBe('1');
    });

    const queueLink = screen.getByRole('link', { name: /Vào hàng chờ duyệt/ });
    expect(queueLink.getAttribute('href')).toBe('/dashboard/admin');

    expect(screen.getByTestId('admin-status-breakdown')).toBeTruthy();
    expect(screen.getByText('Chờ duyệt')).toBeTruthy();
    expect(screen.getByText('Đã duyệt')).toBeTruthy();
    expect(screen.getByText('Từ chối')).toBeTruthy();
  });

  it('ADMIN không thấy widget của CUSTOMER/OWNER', async () => {
    asUser(UserRole.ADMIN);
    renderApp({ route: '/dashboard' });

    await waitFor(() => expect(screen.getByTestId('kpi-admin-pending')).toBeTruthy());
    expect(screen.queryByText('Đơn sắp tới')).toBeNull();
    expect(screen.queryByRole('link', { name: /Xem QR check-in/ })).toBeNull();
    expect(screen.queryByText('Tổng sân của tôi')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Xem thống kê' })).toBeNull();
  });

  it('ADMIN lỗi tải danh sách sân → hộp lỗi role="alert"', async () => {
    mocks.adminVenuesError = new Error('admin boom');
    asUser(UserRole.ADMIN);
    renderApp({ route: '/dashboard' });

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại sau.')).toBeTruthy();
    expect(screen.queryByTestId('kpi-admin-pending')).toBeNull();
  });

  /* --------------------------- fallback / a11y ---------------------------- */

  it('role lạ (không thuộc enum vai) → fallback skeleton role="status"', async () => {
    // Mount trực tiếp DashboardPage: DashboardLayout hiện tại crash ở ROLE_META
    // với role ngoài enum (pre-existing), widget-level fallback vẫn phải an toàn.
    asUser('SUPER_GOD' as unknown as UserRole);
    renderApp({ ui: <DashboardPage /> });

    const skeleton = await screen.findByTestId('dashboard-role-skeleton');
    expect(skeleton.getAttribute('role')).toBe('status');
    expect(skeleton.getAttribute('aria-label')).toBe('Đang tải tổng quan');
  });

  it('chưa có phiên đăng nhập khi mount trực tiếp → skeleton chờ vai trò', async () => {
    useAuthStore.getState().clearSession();
    renderApp({ ui: <DashboardPage /> });

    const skeleton = await screen.findByTestId('dashboard-role-skeleton');
    expect(skeleton.getAttribute('role')).toBe('status');
  });
});
