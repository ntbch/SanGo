import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createWalletTopup, fetchMyWallet } from './api';
import type { WalletTopupResponse } from './types';

/**
 * Số dư + lịch sử ví. Badge ở topbar (pageSize 1) và trang Ví dùng chung
 * tiền tố ['wallet'] nên nạp tiền xong cả hai nơi đều được làm mới.
 */
export function useMyWallet(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ['wallet', 'me', page, pageSize],
    queryFn: () => fetchMyWallet({ page, pageSize }),
  });
}

/** Nạp tiền qua cổng mock — thành công thì điều hướng sang paymentUrl. */
export function useWalletTopup() {
  const qc = useQueryClient();
  return useMutation<WalletTopupResponse, Error, { amount: number }>({
    mutationFn: createWalletTopup,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
