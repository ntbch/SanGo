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
    const { container } = render(
      <MemoryRouter initialEntries={['/wallet']}>
        <Routes>
          <Route path="/wallet" element={<WalletPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Quản Lý Ví & Biến Động Số Dư/i })).toBeDefined();
    expect(screen.getByText(/SanGo Platinum Wallet/i)).toBeDefined();

    // Cliché checks: no opacity-70, hover:opacity, gradients, blur, pulse
    expect(container.innerHTML).not.toContain('opacity-70');
    expect(container.innerHTML).not.toContain('hover:opacity');
    expect(container.innerHTML).not.toContain('bg-gradient');
    expect(container.innerHTML).not.toContain('backdrop-blur');
    expect(container.querySelector('.animate-pulse')).toBeNull();

    // Verify Quick action buttons
    expect(screen.getAllByRole('button', { name: /Nạp Tiền/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Rút Tiền/i }).length).toBeGreaterThan(0);

    // Wait for ledger items and wallet balance to load
    await waitFor(() => {
      expect(screen.getAllByText(/Nạp Tiền Vào Ví SanGo/i).length).toBeGreaterThan(0);
    });

    // Verify big balance typography
    const balanceText = screen.getAllByText(/2.500.000/i)[0];
    expect(balanceText.className).toContain('font-mono-num');
    expect(balanceText.className).toContain('font-black');
    expect(balanceText.className).toContain('tabular-nums');

    // Verify ledger row amounts: font-mono-num font-bold tabular-nums
    const creditAmounts = screen.getAllByText(/\+1\.000\.000/i);
    const ledgerCredit = creditAmounts.find((el) => el.classList.contains('tabular-nums')) ?? creditAmounts[0];
    expect(ledgerCredit.className).toContain('font-mono-num');
    expect(ledgerCredit.className).toContain('font-bold');
    expect(ledgerCredit.className).toContain('tabular-nums');

    const debitAmounts = screen.getAllByText(/-300\.000/i);
    const ledgerDebit = debitAmounts.find((el) => el.classList.contains('tabular-nums')) ?? debitAmounts[0];
    expect(ledgerDebit.className).toContain('font-mono-num');
    expect(ledgerDebit.className).toContain('font-bold');
    expect(ledgerDebit.className).toContain('tabular-nums');

    // Verify row has active:scale-[0.99] and transition-transform
    const row = ledgerCredit.closest('.cursor-pointer');
    expect(row?.className).toContain('active:scale-[0.99]');
    expect(row?.className).toContain('transition-transform');

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

  it('displays empty state with 3-line formula when no transactions match', async () => {
    render(
      <MemoryRouter initialEntries={['/wallet']}>
        <Routes>
          <Route path="/wallet" element={<WalletPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Nạp Tiền Vào Ví SanGo/i).length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText(/Tìm mã giao dịch \/ số tiền/i);
    fireEvent.change(searchInput, { target: { value: 'NON_EXISTENT_TXN_REF_12345' } });

    expect(screen.getByText('Không có giao dịch nào')).toBeDefined();
    expect(
      screen.getByText('Không tìm thấy biến động số dư nào trong khoảng thời gian đã chọn.'),
    ).toBeDefined();
    const resetBtn = screen.getByRole('button', { name: 'Đặt lại bộ lọc' });
    expect(resetBtn).toBeDefined();

    fireEvent.click(resetBtn);
    await waitFor(() => {
      expect(screen.getAllByText(/Nạp Tiền Vào Ví SanGo/i).length).toBeGreaterThan(0);
    });
  });

  it('triggers calm statement export notice without blocking alert', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(
      <MemoryRouter initialEntries={['/wallet']}>
        <Routes>
          <Route path="/wallet" element={<WalletPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const exportBtn = screen.getByRole('button', { name: /Xuất Sao Kê/i });
    expect(exportBtn.className).toContain('active:scale-[0.98]');
    fireEvent.click(exportBtn);

    expect(alertSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/Đang xuất sao kê định dạng PDF\/Excel/i)).toBeDefined();
    alertSpy.mockRestore();
  });
});
