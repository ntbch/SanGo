import type { WalletLedgerDirection, WalletLedgerType } from '@sango/shared';

/** Một dòng biến động ví trong ledger (F6) — backend ghi append-only. */
export interface WalletLedgerEntry {
  id: string;
  direction: WalletLedgerDirection;
  type: WalletLedgerType;
  amount: number;
  refType: string;
  refId: string;
  balanceAfter: number;
  createdAt: string;
}

/** GET /wallet/me — số dư (đọc từ wallet_balances) + lịch sử phân trang. */
export interface WalletMeResponse {
  balance: number;
  page: number;
  pageSize: number;
  total: number;
  items: WalletLedgerEntry[];
}

/** POST /wallet/topup — mock gateway trả URL cho trình duyệt mở. */
export interface WalletTopupResponse {
  txnRef: string;
  amount: number;
  mode: 'mock';
  paymentUrl: string;
}
