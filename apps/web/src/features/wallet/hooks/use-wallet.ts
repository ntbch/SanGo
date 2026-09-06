import React from 'react';
import {
  getMyWalletApi,
  createTopupApi,
  type WalletLedgerItem,
  type WalletEntryType,
} from '../api/wallet-api';
import { formatVND } from '../../../lib/utils';
import { useAuthStore } from '../../../lib/auth-store';

export function useWallet() {
  const { user } = useAuthStore();
  const [balance, setBalance] = React.useState<number>(0);
  const [ledgerItems, setLedgerItems] = React.useState<WalletLedgerItem[]>([]);
  const [totalItems, setTotalItems] = React.useState<number>(0);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [showBalance, setShowBalance] = React.useState<boolean>(true);

  // Filters
  const [typeFilter, setTypeFilter] = React.useState<'ALL' | WalletEntryType>('ALL');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [timePreset, setTimePreset] = React.useState<'ALL' | 'TODAY' | '7DAYS' | 'THIS_MONTH' | '30DAYS' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = React.useState<string>('');
  const [endDate, setEndDate] = React.useState<string>('');

  const handleResetFilters = () => {
    setTypeFilter('ALL');
    setSearchQuery('');
    setTimePreset('ALL');
    setStartDate('');
    setEndDate('');
  };

  // Modals
  const [showTopupModal, setShowTopupModal] = React.useState<boolean>(false);
  const [showWithdrawModal, setShowWithdrawModal] = React.useState<boolean>(false);
  const [showQrPayModal, setShowQrPayModal] = React.useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = React.useState<WalletLedgerItem | null>(null);

  // Topup State
  const [topupAmount, setTopupAmount] = React.useState<number>(500000);
  const [customTopupText, setCustomTopupText] = React.useState<string>('500000');
  const [topupMethod, setTopupMethod] = React.useState<'VIETQR' | 'VNPAY' | 'INSTANT'>('VNPAY');
  const [isTopupLoading, setIsTopupLoading] = React.useState<boolean>(false);
  const [topupSuccessMsg, setTopupSuccessMsg] = React.useState<string | null>(null);

  // Withdraw State
  const [withdrawAmount, setWithdrawAmount] = React.useState<string>('500000');
  const [selectedBank, setSelectedBank] = React.useState<string>('MB');
  const [bankAccountNo, setBankAccountNo] = React.useState<string>('');
  const [accountHolder, setAccountHolder] = React.useState<string>(user?.fullName?.toUpperCase() || '');
  const [isWithdrawLoading, setIsWithdrawLoading] = React.useState<boolean>(false);
  const [withdrawError, setWithdrawError] = React.useState<string | null>(null);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = React.useState<string | null>(null);

  const fetchWalletData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getMyWalletApi({ page: currentPage, pageSize: 10 });
      setBalance(res.balance);
      setLedgerItems(res.items);
      setTotalItems(res.total);
    } catch {
      setBalance(0);
      setLedgerItems([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  React.useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  // Handle Top-up
  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topupAmount < 10000) {
      alert('Số tiền nạp tối thiểu là 10.000 đ');
      return;
    }
    setIsTopupLoading(true);
    try {
      const res = await createTopupApi({ amount: topupAmount });
      if (res.paymentUrl) {
        setTopupSuccessMsg('Đang chuyển hướng đến cổng thanh toán...');
        window.location.href = res.paymentUrl;
      }
    } catch (err: any) {
      alert(err.message || 'Không thể tạo giao dịch nạp tiền');
    } finally {
      setIsTopupLoading(false);
    }
  };

  // Handle Withdrawal
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!amt || amt < 50000) {
      setWithdrawError('Số tiền rút tối thiểu là 50.000 đ');
      return;
    }
    if (amt > balance) {
      setWithdrawError('Số dư khả dụng trong ví không đủ');
      return;
    }
    setIsWithdrawLoading(true);
    setWithdrawError(null);
    try {
      setWithdrawSuccessMsg(`Yêu cầu rút ${formatVND(amt)} về ${selectedBank} đã được gửi tới ban quản trị để xử lý!`);
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      setWithdrawError(err.message || 'Không thể thực hiện rút tiền, thử lại');
    } finally {
      setIsWithdrawLoading(false);
    }
  };

  // Filtered items
  const filteredLedger = ledgerItems.filter((item) => {
    if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        item.refId.toLowerCase().includes(q) ||
        item.refType.toLowerCase().includes(q) ||
        String(item.amount).includes(q);
      if (!matchSearch) return false;
    }

    const itemTime = new Date(item.createdAt).getTime();
    const now = new Date();

    if (timePreset === 'TODAY') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      if (itemTime < startOfToday) return false;
    } else if (timePreset === '7DAYS') {
      const sevenDaysAgo = Date.now() - 7 * 86400 * 1000;
      if (itemTime < sevenDaysAgo) return false;
    } else if (timePreset === 'THIS_MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      if (itemTime < startOfMonth) return false;
    } else if (timePreset === '30DAYS') {
      const thirtyDaysAgo = Date.now() - 30 * 86400 * 1000;
      if (itemTime < thirtyDaysAgo) return false;
    } else if (timePreset === 'CUSTOM' || startDate || endDate) {
      if (startDate) {
        const from = new Date(startDate + 'T00:00:00').getTime();
        if (itemTime < from) return false;
      }
      if (endDate) {
        const to = new Date(endDate + 'T23:59:59').getTime();
        if (itemTime > to) return false;
      }
    }

    return true;
  });

  const totalPages = Math.ceil(totalItems / 10) || 1;

  // Monthly stats calculations
  const totalTopupMonth = ledgerItems
    .filter((i) => i.type === 'TOPUP')
    .reduce((sum, i) => sum + i.amount, 0);
  const totalSpentMonth = ledgerItems
    .filter((i) => i.type === 'PAYMENT')
    .reduce((sum, i) => sum + i.amount, 0);
  const totalRewardMonth = ledgerItems
    .filter((i) => i.type === 'CASHBACK' || i.type === 'REFUND')
    .reduce((sum, i) => sum + i.amount, 0);

  return {
    user,
    balance,
    showBalance,
    setShowBalance,
    ledgerItems,
    filteredLedger,
    isLoading,
    totalItems,
    currentPage,
    setCurrentPage,
    totalPages,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    timePreset,
    setTimePreset,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    handleResetFilters,
    totalTopupMonth,
    totalSpentMonth,
    totalRewardMonth,
    showTopupModal,
    setShowTopupModal,
    topupAmount,
    setTopupAmount,
    customTopupText,
    setCustomTopupText,
    topupMethod,
    setTopupMethod,
    isTopupLoading,
    topupSuccessMsg,
    handleTopupSubmit,
    showWithdrawModal,
    setShowWithdrawModal,
    withdrawAmount,
    setWithdrawAmount,
    selectedBank,
    setSelectedBank,
    bankAccountNo,
    setBankAccountNo,
    accountHolder,
    setAccountHolder,
    isWithdrawLoading,
    withdrawError,
    withdrawSuccessMsg,
    handleWithdrawSubmit,
    showQrPayModal,
    setShowQrPayModal,
    selectedReceipt,
    setSelectedReceipt,
  };
}
