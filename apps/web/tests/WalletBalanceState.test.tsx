import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ProfileWalletTab } from '../src/features/auth/components/profile-wallet-tab';
import { WalletPage } from '../src/features/wallet/pages/wallet-page';
import { getMyWalletApi, type MyWalletResponse } from '../src/features/wallet/api/wallet-api';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';
import { formatVND as formatCurrency } from '../src/lib/utils';

vi.mock('../src/features/wallet/api/wallet-api', () => ({
  getMyWalletApi: vi.fn(),
  createTopupApi: vi.fn(),
}));

function deferredWallet() {
  let resolve!: (value: MyWalletResponse) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<MyWalletResponse>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const response = (balance: number): MyWalletResponse => ({ balance, page: 1, pageSize: 10, total: 0, items: [] });

const formatVND = (balance: number) => formatCurrency(balance).replace(/\s/g, ' ');

function setSession(id: string, token = id) {
  useAuthStore.setState({
    user: { id, email: `${id}@sango.vn`, fullName: id, role: UserRole.CUSTOMER },
    accessToken: token,
    status: 'authenticated',
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  setSession('first');
});
afterEach(cleanup);

for (const [name, Component] of [['profile', ProfileWalletTab], ['dashboard', WalletPage]] as const) {
  describe(`${name} wallet balance`, () => {
    it('does not present loading or failure as zero and retries to a confirmed zero', async () => {
      const first = deferredWallet();
      const retry = deferredWallet();
      vi.mocked(getMyWalletApi).mockReturnValueOnce(first.promise).mockReturnValueOnce(retry.promise);
      render(<MemoryRouter><Component /></MemoryRouter>);
      expect(screen.getByText('Đang tải số dư...')).toBeDefined();
      expect(screen.queryAllByText(formatVND(0))).toHaveLength(0);
      await act(async () => { first.reject(new Error('Unavailable')); });
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.queryAllByText(formatVND(0))).toHaveLength(0);
      fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
      expect(screen.getByText('Đang tải số dư...')).toBeDefined();
      expect(screen.queryAllByText(formatVND(0))).toHaveLength(0);
      await act(async () => { retry.resolve(response(0)); });
      expect(screen.getAllByText(formatVND(0)).length).toBeGreaterThan(0);
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('shows a confirmed positive balance but never reuses it across sessions', async () => {
      const next = deferredWallet();
      vi.mocked(getMyWalletApi).mockResolvedValueOnce(response(2500000)).mockReturnValueOnce(next.promise);
      render(<MemoryRouter><Component /></MemoryRouter>);
      await waitFor(() => expect(screen.getByText(formatVND(2500000))).toBeDefined());
      act(() => { setSession('second'); });
      expect(screen.queryByText(formatVND(2500000))).toBeNull();
      expect(screen.getByText('Đang tải số dư...')).toBeDefined();
      await act(async () => { next.reject(new Error('Unavailable')); });
      expect(screen.queryByText(formatVND(2500000))).toBeNull();
      expect(screen.queryAllByText(formatVND(0))).toHaveLength(0);
    });

    it('ignores a late response from the previous session', async () => {
      const previous = deferredWallet();
      const current = deferredWallet();
      vi.mocked(getMyWalletApi).mockReturnValueOnce(previous.promise).mockReturnValueOnce(current.promise);
      render(<MemoryRouter><Component /></MemoryRouter>);
      act(() => { setSession('second'); });
      await act(async () => { current.resolve(response(123000)); });
      expect(screen.getByText(formatVND(123000))).toBeDefined();
      await act(async () => { previous.resolve(response(999000)); });
      expect(screen.getByText(formatVND(123000))).toBeDefined();
      expect(screen.queryByText(formatVND(999000))).toBeNull();
    });
    it('clears confirmed money on logout and refetches for a new token', async () => {
      const nextSession = deferredWallet();
      vi.mocked(getMyWalletApi).mockResolvedValueOnce(response(2500000)).mockReturnValueOnce(nextSession.promise);
      render(<MemoryRouter><Component /></MemoryRouter>);
      await waitFor(() => expect(screen.getByText(formatVND(2500000))).toBeDefined());
      act(() => { useAuthStore.setState({ user: null, accessToken: null, status: 'unauthenticated' }); });
      expect(screen.queryByText(formatVND(2500000))).toBeNull();
      expect(screen.queryAllByText(formatVND(0))).toHaveLength(0);
      act(() => { setSession('first', 'new-token'); });
      expect(screen.getByText('Đang tải số dư...')).toBeDefined();
      await act(async () => { nextSession.resolve(response(500000)); });
      expect(screen.getByText(formatVND(500000))).toBeDefined();
      expect(screen.queryByText(formatVND(2500000))).toBeNull();
    });

  });
}
