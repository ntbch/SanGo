import { UserRole, VenueStatus } from '@sango/shared';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as AdminApiModule from '../../../../src/features/admin/api';
import type { AdminVenuesResponse } from '../../../../src/features/admin/types';
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

/** Ghi nhận tham số fetchAdminVenues + điều khiển kết quả setVenueStatus. */
const mocks = vi.hoisted(() => ({
  listCalls: [] as unknown[],
  statusCalls: [] as Array<{ id: string; status: string }>,
  statusError: null as Error | null,
}));

vi.mock('../../../../src/features/admin/api', async (importOriginal) => {
  const actual = await importOriginal<typeof AdminApiModule>();
  const venue = (over: Partial<AdminVenuesResponse['items'][number]>): AdminVenuesResponse['items'][number] => ({
    id: 'v-x', name: 'Cụm sân', slug: 'cum-san', address: '123 Đường ABC', images: [], amenities: [], depositPercent: null, openMinute: 360, closeMinute: 1320, status: VenueStatus.APPROVED, owner: { fullName: 'Chủ Sân', email: 'owner@sango.vn' }, createdAt: '2026-03-01T00:00:00.000Z', courtsCount: 2,
    ...over,
  });
  return {
    ...actual,
    fetchAdminVenues: (async (filters?: Record<string, unknown>) => {
      mocks.listCalls.push(filters ?? {});
      return {
        items: [
          venue({ id: 'v-1', name: 'Sân Bóng Đá Nguyễn Trãi', status: VenueStatus.APPROVED }),
          venue({ id: 'v-2', name: 'Cụm Cầu Lông Thủ Đức', status: VenueStatus.PENDING }),
          venue({ id: 'v-3', name: 'CLB Pickleball Cầu Giấy', status: VenueStatus.REJECTED, owner: null }),
          venue({ id: 'v-4', name: 'Sân Tennis Hoàng Mai', status: VenueStatus.SUSPENDED }),
        ],
        total: 11,
        page: 1,
        limit: 10,
        pages: 2,
      };
    }) as typeof actual.fetchAdminVenues,
    setVenueStatus: (async (id: string, status: string) => {
      if (mocks.statusError !== null) throw mocks.statusError;
      mocks.statusCalls.push({ id, status });
      return venue({ id, status: status as AdminVenuesResponse['items'][number]['status'] });
    }) as typeof actual.setVenueStatus,
  };
});

function asAdmin(): void {
  useAuthStore.getState().setSession(
    { id: 'u-admin-01', email: 'admin@sango.vn', fullName: 'Quản Trị', role: UserRole.ADMIN },
    'token-test',
  );
}

describe('AdminVenuesPage — Quản lý cụm sân (/dashboard/admin-venues)', () => {
  beforeEach(() => {
    resetMockSession();
    mocks.listCalls = [];
    mocks.statusCalls = [];
    mocks.statusError = null;
  });

  it('render bảng tên/chủ sân/địa chỉ/trạng thái 4 màu và phân trang items/total', async () => {
    asAdmin();
    renderApp({ route: '/dashboard/admin-venues' });
    expect(await screen.findByRole('heading', { name: 'Quản lý cụm sân' })).toBeTruthy();

    const table = await screen.findByTestId('admin-venues-table');
    expect(table).toBeTruthy();
    expect(screen.getByText('Sân Bóng Đá Nguyễn Trãi')).toBeTruthy();
    // Chủ sân từ backend include; REJECTED không có owner -> hiển thị '—'.
    expect(screen.getAllByText('Chủ Sân').length).toBe(3);
    // REJECTED: không có chủ sân lẫn hành động -> hai ô '—' trên cùng row.
    expect(within(screen.getByTestId('admin-venue-row-2')).getAllByText('—').length).toBeGreaterThanOrEqual(1);
    // Ngày tạo định dạng dd/mm/yyyy.
    expect(screen.getAllByText('01/03/2026').length).toBeGreaterThan(0);

    // Badge đủ 4 trạng thái, SUSPENDED có nhãn riêng.
    // Badge 'Đã duyệt' trên row-0 (trùng label option lọc nên query theo row).
    expect(within(screen.getByTestId('admin-venue-row-0')).getByText('Đã duyệt')).toBeTruthy();
    expect(within(screen.getByTestId('admin-venue-row-1')).getByText('Chờ duyệt')).toBeTruthy();
    expect(within(screen.getByTestId('admin-venue-row-2')).getByText('Từ chối')).toBeTruthy();
    expect(within(screen.getByTestId('admin-venue-row-3')).getByText('Tạm ngừng')).toBeTruthy();

    // Phân trang items/total: tổng 11 -> 2 trang.
    expect(screen.getByTestId('admin-venues-total').textContent).toContain('tổng 11 cụm sân');
    expect((screen.getByTestId('admin-venues-prev') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId('admin-venues-next') as HTMLButtonElement).disabled).toBe(false);

    // Hành động theo trạng thái.
    expect(within(screen.getByTestId('admin-venue-row-0')).getByRole('button', { name: 'Tạm ngưng' })).toBeTruthy();
    expect(within(screen.getByTestId('admin-venue-row-3')).getByRole('button', { name: 'Kích hoạt lại' })).toBeTruthy();
    // PENDING -> Link sang /dashboard/admin thay vì duyệt tại đây.
    const reviewLink = within(screen.getByTestId('admin-venue-row-1')).getByRole('link', { name: 'Xét duyệt' });
    expect(reviewLink.getAttribute('href')).toBe('/dashboard/admin');
    expect(within(screen.getByTestId('admin-venue-row-2')).queryByRole('button')).toBeNull();
  });

  it('search debounce và lọc trạng thái truyền đúng tham số xuống API', async () => {
    const user = userEvent.setup();
    asAdmin();
    renderApp({ route: '/dashboard/admin-venues' });
    await screen.findByTestId('admin-venue-row-0');

    await user.type(screen.getByTestId('admin-venues-search'), 'tennis');
    await waitFor(() => {
      const last = mocks.listCalls.at(-1) as { q?: string } | undefined;
      expect(last?.q).toBe('tennis');
    });

    await user.selectOptions(screen.getByTestId('admin-filter-status'), 'SUSPENDED');
    await waitFor(() => {
      const last = mocks.listCalls.at(-1) as { status?: string } | undefined;
      expect(last?.status).toBe(VenueStatus.SUSPENDED);
    });
  });

  it('Tạm ngưng có hộp xác nhận -> PATCH /admin/venues/:id/status {status:SUSPENDED} + toast', async () => {
    const user = userEvent.setup();
    asAdmin();
    renderApp({ route: '/dashboard/admin-venues' });
    await screen.findByTestId('admin-venue-row-0');

    await user.click(within(screen.getByTestId('admin-venue-row-0')).getByRole('button', { name: 'Tạm ngưng' }));
    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.getByText(/ẨN khỏi tìm kiếm public/)).toBeTruthy();

    await user.click(screen.getByTestId('admin-venue-confirm-toggle'));
    await waitFor(() => {
      expect(mocks.statusCalls.at(-1)).toEqual({ id: 'v-1', status: VenueStatus.SUSPENDED });
    });
    expect(await screen.findByText(/Đã tạm ngừng cụm sân Sân Bóng Đá Nguyễn Trãi/)).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('Kích hoạt lại gửi status APPROVED qua hộp xác nhận', async () => {
    const user = userEvent.setup();
    asAdmin();
    renderApp({ route: '/dashboard/admin-venues' });
    await screen.findByTestId('admin-venue-row-0');

    await user.click(within(screen.getByTestId('admin-venue-row-3')).getByRole('button', { name: 'Kích hoạt lại' }));
    expect(await screen.findByText(/hiển thị trở lại/)).toBeTruthy();
    await user.click(screen.getByTestId('admin-venue-confirm-toggle'));
    await waitFor(() => {
      expect(mocks.statusCalls.at(-1)).toEqual({ id: 'v-4', status: VenueStatus.APPROVED });
    });
  });

  it('lỗi INVALID_STATUS_TRANSITION -> toast destructive và dialog giữ mở', async () => {
    const user = userEvent.setup();
    mocks.statusError = new ApiError(400, 'Chuyển trạng thái không hợp lệ', 'INVALID_STATUS_TRANSITION');
    asAdmin();
    renderApp({ route: '/dashboard/admin-venues' });
    await screen.findByTestId('admin-venue-row-0');

    await user.click(within(screen.getByTestId('admin-venue-row-0')).getByRole('button', { name: 'Tạm ngưng' }));
    await user.click(await screen.findByTestId('admin-venue-confirm-toggle'));

    expect(await screen.findByText('Cập nhật trạng thái thất bại')).toBeTruthy();
    // Thông báo hiện ở cả toast và inline dialog.
    expect((await screen.findAllByText('Chuyển trạng thái không hợp lệ')).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole('dialog')).not.toBeNull();
    expect(mocks.statusCalls.length).toBe(0);
  });
});