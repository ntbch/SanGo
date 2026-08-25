import { apiFetch } from '../../lib/api/client';
import { endpoints } from '../../lib/api/endpoints';
import type { WalletMeResponse, WalletTopupResponse } from './types';

/** Ví của tôi — số dư + lịch sử biến động phân trang (đọc ledger F6). */
export function fetchMyWallet(
  query: { page?: number; pageSize?: number } = {},
): Promise<WalletMeResponse> {
  return apiFetch<WalletMeResponse>(endpoints.wallet.me(query));
}

/** Tạo yêu cầu nạp tiền — trình duyệt mở paymentUrl (cổng mock) ở tab hiện tại. */
export function createWalletTopup(payload: { amount: number }): Promise<WalletTopupResponse> {
  return apiFetch<WalletTopupResponse>(endpoints.wallet.topup(), {
    method: 'POST',
    body: payload,
  });
}
