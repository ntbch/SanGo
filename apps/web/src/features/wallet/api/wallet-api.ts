import { apiClient } from '../../../lib/api-client';

export type WalletDirection = 'CREDIT' | 'DEBIT';
export type WalletEntryType = 'TOPUP' | 'PAYMENT' | 'REFUND' | 'CASHBACK';

export interface WalletLedgerItem {
  id: string;
  direction: WalletDirection;
  type: WalletEntryType;
  amount: number;
  refType: string;
  refId: string;
  balanceAfter: number;
  createdAt: string;
}

export interface MyWalletResponse {
  balance: number;
  page: number;
  pageSize: number;
  total: number;
  items: WalletLedgerItem[];
}

export interface TopupDto {
  amount: number;
}

export interface TopupResponse {
  txnRef: string;
  amount: number;
  paymentUrl: string;
}

export interface WithdrawalDto {
  amount: number;
  bankCode: string;
  bankAccountNo: string;
  accountHolder: string;
}

export async function getMyWalletApi(params?: { page?: number; pageSize?: number }): Promise<MyWalletResponse> {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  return apiClient<MyWalletResponse>(`/wallet/me?page=${page}&pageSize=${pageSize}`);
}

export async function createTopupApi(dto: TopupDto): Promise<TopupResponse> {
  return apiClient<TopupResponse>('/wallet/topup', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}
