import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserRole } from '@sango/shared';
import { resetMockSession } from '../../../../src/lib/api/mock-server';
import { useAuthStore } from '../../../../src/lib/auth/auth-store';
import { renderApp } from '../../../test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('CheckoutHoldPage', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession(
      {
        id: 'u-cust',
        email: 'cust@sango.vn',
        role: UserRole.CUSTOMER,
        fullName: 'Khách Hàng',
      },
      'tok',
    );
    resetMockSession();
  });

  it('render đồng hồ đếm ngược 10 phút, thông tin giữ chỗ và tuỳ chọn cọc', async () => {
    renderApp({ route: '/thanh-toan/checkout/h-demo1' });
    await waitFor(() => {
      expect(screen.getByRole('timer')).toBeTruthy();
      expect(screen.getByText('Thông tin đơn đặt sân')).toBeTruthy();
      expect(screen.getByText(/Đặt cọc/)).toBeTruthy();
      expect(screen.getByText(/Thanh toán toàn bộ/)).toBeTruthy();
    });
  });

  it('cho phép chuyển đổi giữa thanh toán cọc và thanh toán đủ', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/thanh-toan/checkout/h-demo1' });
    await waitFor(() => {
      expect(screen.getByText('Thông tin đơn đặt sân')).toBeTruthy();
    });

    const fullRadio = screen.getByLabelText(/Thanh toán toàn bộ/i) as HTMLInputElement;
    await user.click(fullRadio);
    expect(fullRadio.checked).toBe(true);
  });

  it('áp mã giảm giá và cập nhật giá cần trả ngay trước nút thanh toán', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/thanh-toan/checkout/h-demo1' });
    await waitFor(() => {
      expect(screen.getByText('Thông tin đơn đặt sân')).toBeTruthy();
    });

    await user.type(screen.getByLabelText('Mã giảm giá'), 'SALE10');
    await user.click(screen.getByRole('button', { name: 'Áp dụng' }));

    await waitFor(() => {
      expect(screen.getByText(/Đã áp mã SALE10/)).toBeTruthy();
      expect(screen.getByText(/Giảm giá \(SALE10\)/)).toBeTruthy();
      expect(screen.getByText('−24.000₫')).toBeTruthy();
      expect(screen.queryByLabelText('Mã giảm giá')).toBeNull();
    });
  });
});
