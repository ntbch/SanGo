import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { resetMockSession } from '../../../../src/lib/api/mock-server';
import { renderApp } from '../../../test-utils';

vi.stubEnv('VITE_USE_MOCK', 'true');

describe('PaymentResultPage', () => {
  beforeEach(() => {
    resetMockSession();
  });

  it('hiển thị trạng thái thành công kèm mã đơn', async () => {
    renderApp({ route: '/thanh-toan/ket-qua?status=SUCCESS&code=CH-20260828-0001' });
    await waitFor(() => {
      expect(screen.getByText('Đặt sân thành công!')).toBeTruthy();
      expect(screen.getByText('CH-20260828-0001')).toBeTruthy();
      expect(screen.getByText(/Xem đơn của tôi/)).toBeTruthy();
    });
  });

  it('hiển thị trạng thái thất bại khi status=FAILED', async () => {
    renderApp({
      route:
        '/thanh-toan/ket-qua?status=FAILED&message=Giao%20d%E1%BB%8Bch%20b%E1%BB%8B%20hu%E1%BB%B7',
    });
    await waitFor(() => {
      expect(screen.getByText('Thanh toán không thành công')).toBeTruthy();
      expect(screen.getByText('Giao dịch bị huỷ')).toBeTruthy();
    });
  });
});
