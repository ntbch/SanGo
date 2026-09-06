import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { WalletPage } from '../src/features/wallet/pages/wallet-page';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';

vi.mock('../src/features/wallet/api/wallet-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/features/wallet/api/wallet-api')>();
  return {
    ...actual,
    getMyWalletApi: vi.fn().mockResolvedValue({
      balance: 2500000,
      page: 1,
      pageSize: 10,
      total: 2,
      items: [
        {
          id: 'TOPUP-001',
          direction: 'CREDIT',
          type: 'TOPUP',
          amount: 1000000,
          refType: 'TOPUP',
          refId: 'TOPUP-001',
          balanceAfter: 2500000,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'PAY-001',
          direction: 'DEBIT',
          type: 'PAYMENT',
          amount: 300000,
          refType: 'BOOKING',
          refId: 'BK-001',
          balanceAfter: 1500000,
          createdAt: new Date().toISOString(),
        },
      ],
    }),
    createTopupApi: vi.fn().mockResolvedValue({ txnRef: 'TXN-1', amount: 1000000, paymentUrl: '/pay' }),
  };
});

describe('Wallet Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'u-1',
        email: 'player1@sango.vn',
        fullName: 'Trần Đức Người Chơi',
        role: UserRole.CUSTOMER,
      },
      accessToken: 'test-token',
      status: 'authenticated',
    });
  });

  it('renders WalletPage with balance, stats, actions and ledger items', async () => {
    render(
      <MemoryRouter initialEntries={['/wallet']}>
        <Routes>
          <Route path="/wallet" element={<WalletPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Quản Lý Ví & Biến Động Số Dư/i })).toBeDefined();
    expect(screen.getByText(/SanGo Platinum Wallet/i)).toBeDefined();

    // Verify Quick action buttons
    expect(screen.getAllByRole('button', { name: /Nạp Tiền/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Rút Tiền/i }).length).toBeGreaterThan(0);

    // Wait for ledger items to load
    await waitFor(() => {
      expect(screen.getAllByText(/Nạp Tiền Vào Ví SanGo/i).length).toBeGreaterThan(0);
    });

    // Open Topup Modal
    const topupBtn = screen.getByRole('button', { name: /Nạp Tiền Vào Ví/i });
    fireEvent.click(topupBtn);
    expect(screen.getAllByText(/Chọn Nhanh Mệnh Giá Nạp/i).length).toBeGreaterThan(0);

    // Select preset amount 1.000.000 đ
    const preset1M = screen.getByRole('button', { name: /1\.000\.000/i });
    fireEvent.click(preset1M);
    expect(screen.getByRole('button', { name: /Xác Nhận Nạp 1\.000\.000/i })).toBeDefined();
  });

  it('filters ledger by time presets and custom date range', async () => {
    render(
      <MemoryRouter initialEntries={['/wallet']}>
        <Routes>
          <Route path="/wallet" element={<WalletPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Check time filter presets
    expect(screen.getByRole('button', { name: /Tất Cả Thời Gian/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Hôm Nay/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /7 Ngày Qua/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Tháng Này/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /30 Ngày Qua/i })).toBeDefined();

    // Click 7 Days preset
    const btn7Days = screen.getByRole('button', { name: /7 Ngày Qua/i });
    fireEvent.click(btn7Days);
    expect(screen.getByText(/Bộ lọc thời gian:/i)).toBeDefined();

    // Click reset button
    const resetBtn = screen.getByRole('button', { name: /Đặt lại/i });
    fireEvent.click(resetBtn);
  });

  it('opens Withdrawal modal and E-Receipt modal on transaction click', async () => {
    render(
      <MemoryRouter initialEntries={['/wallet']}>
        <Routes>
          <Route path="/wallet" element={<WalletPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Wait for ledger to load
    await waitFor(() => {
      expect(screen.getAllByText(/Nạp Tiền Vào Ví SanGo/i).length).toBeGreaterThan(0);
    });

    // Open Withdrawal Modal
    const withdrawBtn = screen.getByRole('button', { name: /Rút Tiền Về Ngân Hàng/i });
    fireEvent.click(withdrawBtn);
    expect(screen.getByRole('heading', { name: /Rút Tiền Về Tài Khoản Ngân Hàng/i })).toBeDefined();

    // Close withdraw modal
    const cancelBtn = screen.getByRole('button', { name: /Hủy/i });
    fireEvent.click(cancelBtn);

    // Click a ledger row to open E-Receipt
    const ledgerRow = screen.getAllByText(/Nạp Tiền Vào Ví SanGo/i)[0];
    fireEvent.click(ledgerRow);
    await waitFor(() => {
      expect(screen.getAllByText(/TOPUP-001/i).length).toBeGreaterThan(0);
    });
  });
});
