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
  mode: 'mock' | 'vnpay';
  paymentUrl: string;
}

export interface WithdrawalDto {
  amount: number;
  bankCode: string;
  bankAccountNo: string;
  accountHolder: string;
}

// In-memory mock ledger for fallback or local mock environment
let mockBalance = 2450000;
let mockLedgerItems: WalletLedgerItem[] = [
  {
    id: 'tx-001',
    direction: 'CREDIT',
    type: 'TOPUP',
    amount: 1000000,
    refType: 'VNPAY_TOPUP',
    refId: 'TOPUP-789012',
    balanceAfter: 2450000,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'tx-002',
    direction: 'DEBIT',
    type: 'PAYMENT',
    amount: 300000,
    refType: 'BOOKING_DEPOSIT',
    refId: 'BK-552190',
    balanceAfter: 1450000,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'tx-003',
    direction: 'CREDIT',
    type: 'REFUND',
    amount: 150000,
    refType: 'MATCH_CANCELLATION',
    refId: 'MC-110294',
    balanceAfter: 1750000,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'tx-004',
    direction: 'CREDIT',
    type: 'CASHBACK',
    amount: 50000,
    refType: 'FAIR_PLAY_REWARD',
    refId: 'RW-990182',
    balanceAfter: 1600000,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
  {
    id: 'tx-005',
    direction: 'CREDIT',
    type: 'TOPUP',
    amount: 2000000,
    refType: 'VIETQR_TOPUP',
    refId: 'TOPUP-667120',
    balanceAfter: 1550000,
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
  },
];

export async function getMyWalletApi(params?: { page?: number; pageSize?: number }): Promise<MyWalletResponse> {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  try {
    const res = await apiClient<MyWalletResponse>(`/wallet/me?page=${page}&pageSize=${pageSize}`);
    return res;
  } catch {
    const total = mockLedgerItems.length;
    const start = (page - 1) * pageSize;
    const items = mockLedgerItems.slice(start, start + pageSize);
    return {
      balance: mockBalance,
      page,
      pageSize,
      total,
      items,
    };
  }
}

export async function createTopupApi(dto: TopupDto): Promise<TopupResponse> {
  try {
    return await apiClient<TopupResponse>('/wallet/topup', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  } catch {
    const txnRef = `topup-${Date.now()}.TOPUP.mock`;
    return {
      txnRef,
      amount: dto.amount,
      mode: 'mock',
      paymentUrl: `/vi/wallet?status=SUCCESS&amount=${dto.amount}&txnRef=${txnRef}`,
    };
  }
}

export async function instantMockTopupApi(amount: number): Promise<{ success: boolean; newBalance: number }> {
  mockBalance += amount;
  const newEntry: WalletLedgerItem = {
    id: `tx-${Date.now()}`,
    direction: 'CREDIT',
    type: 'TOPUP',
    amount,
    refType: 'INSTANT_TOPUP',
    refId: `TOPUP-${Math.floor(100000 + Math.random() * 900000)}`,
    balanceAfter: mockBalance,
    createdAt: new Date().toISOString(),
  };
  mockLedgerItems.unshift(newEntry);
  return { success: true, newBalance: mockBalance };
}

export async function requestWithdrawalApi(dto: WithdrawalDto): Promise<{ success: boolean; newBalance: number }> {
  if (dto.amount > mockBalance) {
    throw new Error('Số dư khả dụng không đủ để thực hiện lệnh rút tiền');
  }
  mockBalance -= dto.amount;
  const newEntry: WalletLedgerItem = {
    id: `tx-${Date.now()}`,
    direction: 'DEBIT',
    type: 'PAYMENT',
    amount: dto.amount,
    refType: `WITHDRAW_${dto.bankCode}`,
    refId: `WD-${Math.floor(100000 + Math.random() * 900000)}`,
    balanceAfter: mockBalance,
    createdAt: new Date().toISOString(),
  };
  mockLedgerItems.unshift(newEntry);
  return { success: true, newBalance: mockBalance };
}
