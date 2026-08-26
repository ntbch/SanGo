import { UserRole } from '@sango/shared';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as AdminApiModule from '../../../../src/features/admin/api';
import type * as BookingApiModule from '../../../../src/features/booking/api';
import type { AdminBookingsResponse } from '../../../../src/features/admin/types';
import type { RefundPreview } from '../../../../src/features/booking/types';
import { ApiError } from '../../../../src/lib/api/api-error';
import { resetMockSession } from '../../../../src/lib/api/mock-server';
import { useAuthStore } from '../../../../src/lib/auth/auth-store';
import { renderApp } from '../../../test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

// Router kéo statistics-page (ChartJS register ở module scope) — stub như các test khác.
vi.mock('chart.js', () => ({
  Chart: { register: (): void => undefined },
  CategoryScale: {},
  LinearScale: {},
  BarElement: {},
  LineElement: {},
  PointElement: {},
  Tooltip: {},
  Legend: {},
}));
vi.mock('react-chartjs-2', () => ({ Chart: () => null }));

/** Ghi nhận tham số + điều khiển kết quả mutation huỷ hộ và refund preview. */
const mocks = vi.hoisted(() => ({
  listCalls: [] as unknown[],
  cancelCalls: [] as Array<{ id: string; reason: string }>,
  cancelError: null as Error | null,
  refundPreview: null as unknown,
}));

vi.mock('../../../../src/features/admin/api', async (importOriginal) => {
  const actual = await importOriginal<typeof AdminApiModule>();
  const booking = (over: Partial<AdminBookingsResponse['items'][number]>): AdminBookingsResponse['items'][number] => ({
    id: 'b-x', code: 'CH-0000', venueId: 'v-1', venueName: 'Cụm A', courtName: 'Sân 1', customerName: 'Khách', customerEmail: 'khach@sango.vn', startTime: '2026-09-01T02:00:00.000Z', endTime: '2026-09-01T03:00:00.000Z', status: 'CONFIRMED', totalPriceVnd: 120000, createdAt: '2026-08-20T00:00:00.000Z',
    ...over,
  });
  return {
    ...actual,
    fetchAdminBookings: (async (filters?: Record<string, unknown>) => {
      mocks.listCalls.push(filters ?? {});
      return {
        items: [
          booking({ id: 'b-1', code: 'CH-1001', status: 'CONFIRMED', customerName: 'Khách Văn', customerEmail: 'van@sango.vn' }),
          booking({ id: 'b-2', code: 'CH-1002', status: 'COMPLETED' }),
          booking({ id: 'b-3', code: 'CH-1003', status: 'PENDING_PAYMENT', totalPriceVnd: 90000 }),
        ],
        total: 12,
        page: 1,
        limit: 10,
      };
    }) as typeof actual.fetchAdminBookings,
    adminCancelBooking: (async (id: string, reason: string) => {
      if (mocks.cancelError !== null) throw mocks.cancelError;
      mocks.cancelCalls.push({ id, reason });
    }) as typeof actual.adminCancelBooking,
  };
});

vi.mock('../../../../src/features/booking/api', async (importOriginal) => {
  const actual = await importOriginal<typeof BookingApiModule>();
  return {
    ...actual,
    fetchRefundPreview: (async (_bookingId: string) => {
      if (mocks.refundPreview !== null && mocks.refundPreview !== undefined) {
        throw mocks.refundPreview as Error;
      }
      return {
        refundPercent: 50,
        refundAmount: 60000,
        amountPaid: 120000,
        hoursUntilMatch: 18,
      } as RefundPreview & { bookingId?: string };
    }) as typeof actual.fetchRefundPreview,
  };
});

function asAdmin(): void {
  useAuthStore.getState().setSession(
    { id: 'u-admin-01', email: 'admin@sango.vn', fullName: 'Quản Trị', role: UserRole.ADMIN },
    'token-test',
  );
}

describe('AdminBookingsPage — Quản lý đơn toàn hệ thống (/dashboard/admin-bookings)', () => {
  beforeEach(() => {
    resetMockSession();
    mocks.listCalls = [];
    mocks.cancelCalls = [];
    mocks.cancelError = null;
    mocks.refundPreview = null;
  });

  it('render bảng đơn với badge trạng thái, tiền VND, thời gian và phân trang items/total', async () => {
    asAdmin();
    renderApp({ route: '/dashboard/admin-bookings' });
    expect(await screen.findByRole('heading', { name: 'Quản lý đơn đặt sân' })).toBeTruthy();

    expect(await screen.findByTestId('admin-bookings-table')).toBeTruthy();
    expect(screen.getByText('CH-1001')).toBeTruthy();
    expect(screen.getByText('Khách Văn')).toBeTruthy();
    expect(screen.getAllByText('Đã xác nhận').length).toBeGreaterThan(0);
    expect(screen.getByTestId('admin-booking-row-1').textContent).toContain('Hoàn tất');
    expect(screen.getAllByText('120.000₫').length).toBeGreaterThanOrEqual(1);
    // startTime ISO hiển thị qua cùng formatter vi-VN với trang (locale/TZ-proof).
    const expectedStart = new Date('2026-09-01T02:00:00.000Z').toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    expect(screen.getByTestId('admin-booking-row-0').textContent).toContain(expectedStart);

    // Phân trang items/total: tổng 12 -> 2 trang.
    expect(screen.getByTestId('admin-bookings-total').textContent).toContain('tổng 12 đơn');
    expect((screen.getByTestId('admin-bookings-prev') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId('admin-bookings-next') as HTMLButtonElement).disabled).toBe(false);

    // Chỉ đơn PENDING_PAYMENT/CONFIRMED mới có nút Huỷ hộ.
    expect(within(screen.getByTestId('admin-booking-row-0')).getByRole('button', { name: 'Huỷ hộ' })).toBeTruthy();
    expect(within(screen.getByTestId('admin-booking-row-2')).getByRole('button', { name: 'Huỷ hộ' })).toBeTruthy();
    expect(within(screen.getByTestId('admin-booking-row-1')).queryByRole('button')).toBeNull();
  });

  it('search debounce truyền search; lọc trạng thái/ngày chơi truyền đúng tham số', async () => {
    const user = userEvent.setup();
    asAdmin();
    renderApp({ route: '/dashboard/admin-bookings' });
    await screen.findByTestId('admin-booking-row-0');

    await user.type(screen.getByTestId('admin-bookings-search'), 'CH-10');
    await waitFor(() => {
      const last = mocks.listCalls.at(-1) as { search?: string } | undefined;
      expect(last?.search).toBe('CH-10');
    });

    await user.selectOptions(screen.getByTestId('admin-filter-status'), 'CANCELLED');
    await waitFor(() => {
      const last = mocks.listCalls.at(-1) as { status?: string } | undefined;
      expect(last?.status).toBe('CANCELLED');
    });

    await user.type(screen.getByTestId('admin-filter-date'), '2026-09-01');
    await waitFor(() => {
      const last = mocks.listCalls.at(-1) as { date?: string } | undefined;
      expect(last?.date).toBe('2026-09-01');
    });
  });

  it('dialog huỷ hộ hiển thị mức hoàn dự kiến từ refund-preview trước khi confirm', async () => {
    const user = userEvent.setup();
    asAdmin();
    renderApp({ route: '/dashboard/admin-bookings' });
    await screen.findByTestId('admin-booking-row-0');

    await user.click(within(screen.getByTestId('admin-booking-row-0')).getByRole('button', { name: 'Huỷ hộ' }));
    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.getByText(/Huỷ hộ đơn CH-1001/)).toBeTruthy();

    // Mức hoàn dự kiến 50% (12–24h) hiện TRƯỚC confirm.
    const refundBox = await screen.findByTestId('admin-cancel-refund');
    expect(refundBox.textContent).toContain('~18 giờ');
    expect(refundBox.textContent).toContain('(50%):');
    expect(refundBox.textContent).toContain('60.000₫');

    // Reason BẮT BUỘC: nút confirm tắt khi trống, bật khi có lý do; counter cập nhật.
    const confirmBtn = screen.getByTestId('admin-booking-confirm-cancel') as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);
    await user.type(screen.getByTestId('admin-cancel-reason'), 'Khách yêu cầu huỷ');
    expect((screen.getByTestId('admin-cancel-reason-count') as HTMLElement).textContent).toContain('17/300');
    expect((screen.getByTestId('admin-booking-confirm-cancel') as HTMLButtonElement).disabled).toBe(false);

    await user.click(screen.getByTestId('admin-booking-confirm-cancel'));
    await waitFor(() => {
      expect(mocks.cancelCalls.at(-1)).toEqual({ id: 'b-1', reason: 'Khách yêu cầu huỷ' });
    });
    expect(await screen.findByText('Đã huỷ hộ đơn CH-1001')).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('lỗi huỷ hộ (403 người khác / API lỗi) -> toast destructive và dialog giữ mở', async () => {
    const user = userEvent.setup();
    mocks.cancelError = new ApiError(403, 'Bạn không có quyền huỷ đơn này.', 'BOOKING_FORBIDDEN');
    asAdmin();
    renderApp({ route: '/dashboard/admin-bookings' });
    await screen.findByTestId('admin-booking-row-0');

    await user.click(within(screen.getByTestId('admin-booking-row-0')).getByRole('button', { name: 'Huỷ hộ' }));
    await user.type(await screen.findByTestId('admin-cancel-reason'), 'test');
    await user.click(screen.getByTestId('admin-booking-confirm-cancel'));

    expect(await screen.findByText('Huỷ hộ đơn thất bại')).toBeTruthy();

    // BOOKING_FORBIDDEN map sang thông báo chung; hiện ở toast + inline dialog.
    expect((await screen.findAllByText('Bạn không có quyền thao tác trên đơn đặt này.')).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole('dialog')).not.toBeNull();
    expect(mocks.cancelCalls.length).toBe(0);
  });
});