import { UserRole } from '@sango/shared';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as AdminApiModule from '../../../../src/features/admin/api';
import type { AdminUsersResponse } from '../../../../src/features/admin/types';
import { ApiError } from '../../../../src/lib/api/api-error';
import { resetMockSession } from '../../../../src/lib/api/mock-server';
import { useAuthStore } from '../../../../src/lib/auth/auth-store';
import { renderApp } from '../../../test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

// Router kéo statistics-page (đăng ký ChartJS ở module scope) nên vẫn cần stub.
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

/** Ghi nhận tham số fetchAdminUsers + điều khiển kết quả setUserStatus. */
const mocks = vi.hoisted(() => ({
  listCalls: [] as unknown[],
  statusCalls: [] as Array<{ id: string; status: string }>,
  statusError: null as Error | null,
}));

vi.mock('../../../../src/features/admin/api', async (importOriginal) => {
  const actual = await importOriginal<typeof AdminApiModule>();
  const buildPage = (): AdminUsersResponse => ({
    // Thứ tự cố định: [0]=chính mình(ADMIN), [1]=ADMIN khác, [2]=customer, [3]=owner LOCKED, [4]=customer.
    items: [
      { id: 'u-admin-01', fullName: 'Quản Trị', email: 'admin@sango.vn', phone: '0900000001', role: 'ADMIN', status: 'ACTIVE', createdAt: '2026-01-05T00:00:00Z', bookingCount: 0 },
      { id: 'u-adm2', fullName: 'Admin Hai', email: 'admin2@sango.vn', phone: '0900000002', role: 'ADMIN', status: 'ACTIVE', createdAt: '2026-02-10T00:00:00Z', bookingCount: 1 },
      { id: 'u-c1', fullName: 'Khách Văn', email: 'van@sango.vn', phone: '0900000003', role: 'CUSTOMER', status: 'ACTIVE', createdAt: '2026-03-15T00:00:00Z', bookingCount: 12 },
      { id: 'u-o1', fullName: 'Chủ Sân Bình', email: 'binh@sango.vn', phone: null, role: 'OWNER', status: 'LOCKED', createdAt: '2026-04-20T00:00:00Z', bookingCount: 30 },
      { id: 'u-c2', fullName: 'Khách Lan', email: 'lan@sango.vn', phone: '0900000005', role: 'CUSTOMER', status: 'ACTIVE', createdAt: '2026-05-25T00:00:00Z', bookingCount: 3 },
    ],
    total: 12,
    page: 1,
    limit: 10,
  });
  return {
    ...actual,
    fetchAdminUsers: (async (filters?: Record<string, unknown>) => {
      mocks.listCalls.push(filters ?? {});
      return buildPage();
    }) as typeof actual.fetchAdminUsers,
    setUserStatus: (async (id: string, status: string) => {
      if (mocks.statusError !== null) throw mocks.statusError;
      mocks.statusCalls.push({ id, status });
      return {
        id,
        fullName: 'Khách Văn',
        email: 'van@sango.vn',
        phone: '0900000003',
        role: 'CUSTOMER',
        status,
        createdAt: '2026-03-15T00:00:00Z',
        bookingCount: 12,
      } as Awaited<ReturnType<typeof actual.setUserStatus>>;
    }) as typeof actual.setUserStatus,
  };
});

function asAdmin(): void {
  useAuthStore.getState().setSession(
    { id: 'u-admin-01', email: 'admin@sango.vn', fullName: 'Quản Trị', role: UserRole.ADMIN },
    'token-test',
  );
}

describe('AdminUsersPage — Quản lý người dùng (/dashboard/admin-users)', () => {
  beforeEach(() => {
    resetMockSession();
    mocks.listCalls = [];
    mocks.statusCalls = [];
    mocks.statusError = null;
  });

  it('render bảng Tên/Email/SĐT/Vai trò/Trạng thái/Ngày tạo/Số đơn và phân trang items/total', async () => {
    asAdmin();
    renderApp({ route: '/dashboard/admin-users' });
    expect(await screen.findByRole('heading', { name: 'Quản lý người dùng' })).toBeTruthy();

    const table = await screen.findByTestId('admin-users-table');
    expect(table).toBeTruthy();
    expect(await screen.findByTestId('admin-user-row-0')).toBeTruthy();
    expect(screen.getByText('admin@sango.vn')).toBeTruthy();
    expect(screen.getAllByText('Chủ sân').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Khách hàng').length).toBeGreaterThan(0);
    // Badge 'Đã khoá' nằm trên row owner (trùng label option lọc nên query theo row).
    expect(within(screen.getByTestId('admin-user-row-3')).getByText('Đã khoá')).toBeTruthy();
    // Ngày tạo định dạng dd/mm/yyyy.
    expect(screen.getByText('15/03/2026')).toBeTruthy();
    expect(screen.getByText('30')).toBeTruthy(); // số đơn của owner

    // Phân trang items/total: 12 tổng -> 2 trang, prev tắt ở trang đầu.
    expect(screen.getByTestId('admin-users-total').textContent).toContain('tổng 12 người dùng');
    expect((screen.getByTestId('admin-users-prev') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId('admin-users-next') as HTMLButtonElement).disabled).toBe(false);

    // Ẩn nút khoá với CHÍNH MÌNH và với user role ADMIN; còn lại hiện Khoá/Mở khoá.
    expect(within(screen.getByTestId('admin-user-row-0')).queryByRole('button')).toBeNull();
    expect(within(screen.getByTestId('admin-user-row-1')).queryByRole('button')).toBeNull();
    expect(
      within(screen.getByTestId('admin-user-row-2')).getByRole('button', { name: 'Khoá' }),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId('admin-user-row-3')).getByRole('button', { name: 'Mở khoá' }),
    ).toBeTruthy();
  });

  it('ô search debounce chỉ gọi API sau khi ngừng gõ với q đã trim', async () => {
    const user = userEvent.setup();
    asAdmin();
    renderApp({ route: '/dashboard/admin-users' });
    await screen.findByTestId('admin-user-row-0');
    const before = mocks.listCalls.length;

    await user.type(screen.getByTestId('admin-users-search'), '  lan ');
    await waitFor(() => {
      const last = mocks.listCalls.at(-1) as { q?: string } | undefined;
      expect(last?.q).toBe('lan');
    });
    // Debounce: không phát sinh một call cho TỪNG ký tự (trước+debounce là đủ).
    expect(mocks.listCalls.length - before).toBeLessThanOrEqual(2);
  });

  it('lọc Vai trò và Trạng thái truyền đúng tham số xuống API', async () => {
    const user = userEvent.setup();
    asAdmin();
    renderApp({ route: '/dashboard/admin-users' });
    await screen.findByTestId('admin-user-row-0');

    await user.selectOptions(screen.getByTestId('admin-filter-role'), 'OWNER');
    await waitFor(() => {
      const last = mocks.listCalls.at(-1) as { role?: string } | undefined;
      expect(last?.role).toBe('OWNER');
    });

    await user.selectOptions(screen.getByTestId('admin-filter-status'), 'LOCKED');
    await waitFor(() => {
      const last = mocks.listCalls.at(-1) as { status?: string } | undefined;
      expect(last?.status).toBe('LOCKED');
    });
  });

  it('Khoá có hộp xác nhận -> PATCH /admin/users/:id/status {status:LOCKED} + toast thành công', async () => {
    const user = userEvent.setup();
    asAdmin();
    renderApp({ route: '/dashboard/admin-users' });
    await screen.findByTestId('admin-user-row-0');

    await user.click(within(screen.getByTestId('admin-user-row-2')).getByRole('button', { name: 'Khoá' }));
    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Khoá tài khoản?')).toBeTruthy();

    await user.click(screen.getByTestId('admin-user-confirm-toggle'));
    await waitFor(() => {
      expect(mocks.statusCalls.at(-1)).toEqual({ id: 'u-c1', status: 'LOCKED' });
    });
    // Toast thành công hiển thị.
    expect(await screen.findByText(/Đã khoá tài khoản Khách Văn/)).toBeTruthy();
    // Hộp thoại đóng sau khi thành công.
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('lỗi CANNOT_LOCK_ADMIN từ API -> toast destructive với message map tiếng Việt', async () => {
    const user = userEvent.setup();
    mocks.statusError = new ApiError(
      400,
      'Cannot lock admin',
      'CANNOT_LOCK_ADMIN',
    );
    asAdmin();
    renderApp({ route: '/dashboard/admin-users' });
    await screen.findByTestId('admin-user-row-0');

    await user.click(within(screen.getByTestId('admin-user-row-2')).getByRole('button', { name: 'Khoá' }));
    await user.click(await screen.findByTestId('admin-user-confirm-toggle'));

    expect(await screen.findByText('Khoá tài khoản thất bại')).toBeTruthy();
    // Thông báo xuất hiện ở cả toast và inline dialog.
    expect((await screen.findAllByText('Không thể khoá tài khoản quản trị viên khác.')).length).toBeGreaterThanOrEqual(1);
    // Lỗi thì hộp thoại giữ mở để người dùng Huỷ.
    expect(screen.queryByRole('dialog')).not.toBeNull();
    expect(mocks.statusCalls.length).toBe(0);
  });
});