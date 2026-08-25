import { UserRole } from '@courthub/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { resetMockSession } from '../../../lib/api/mock-server';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { renderApp } from '../../../test/test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('WalletPage', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession(
      {
        id: 'u-cust',
        email: 'cust@courthub.vn',
        role: UserRole.CUSTOMER,
        fullName: 'Khách Hàng',
      },
      'tok',
    );
    resetMockSession();
  });

  it('hiển thị số dư và lịch sử biến động từ ledger', async () => {
    renderApp({ route: '/dashboard/wallet' });
    await waitFor(() => {
      expect(screen.getByText('Số dư ví')).toBeTruthy();
      expect(screen.getByText('+300.000₫')).toBeTruthy(); // dòng TOPUP seed
      expect(screen.getAllByText('300.000₫').length).toBeGreaterThan(0);
      expect(screen.getByText('Lịch sử giao dịch')).toBeTruthy();
    });
  });

  it('toast xác nhận khi quay lại từ mock gateway với status=SUCCESS (/vi/wallet)', async () => {
    renderApp({ route: '/vi/wallet?status=SUCCESS&txnRef=TOPUP-x' });
    await waitFor(() => {
      expect(screen.getByText(/Nạp tiền thành công/)).toBeTruthy();
      expect(screen.getByText('Số dư ví')).toBeTruthy();
    });
  });

  it('toast thất bại khi quay lại với status=FAIL (/wallet)', async () => {
    renderApp({ route: '/wallet?status=FAIL&txnRef=TOPUP-x' });
    await waitFor(() => {
      expect(screen.getByText(/Nạp tiền thất bại/)).toBeTruthy();
      expect(screen.getByText('Số dư ví')).toBeTruthy();
    });
  });

  it('chặn số tiền nạp dưới mức tối thiểu trong dialog', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/dashboard/wallet' });
    await waitFor(() => {
      expect(screen.getByText('Số dư ví')).toBeTruthy();
    });

    await user.click(screen.getByRole('button', { name: 'Nạp tiền' }));
    const input = screen.getByLabelText(/Số tiền nạp/);
    await user.clear(input);
    await user.type(input, '5000');
    await user.click(screen.getByRole('button', { name: 'Xác nhận nạp' }));

    await waitFor(() => {
      expect(screen.getByText('Số tiền nạp tối thiểu 10.000₫')).toBeTruthy();
    });
  });
});
