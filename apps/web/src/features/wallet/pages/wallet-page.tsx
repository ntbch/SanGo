import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Wallet,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Award,
  ShieldCheck,
  QrCode,
  Download,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Gift,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Calendar,
} from 'lucide-react';
import {
  getMyWalletApi,
  createTopupApi,
  instantMockTopupApi,
  requestWithdrawalApi,
  type WalletLedgerItem,
  type WalletEntryType,
} from '../api/wallet-api';
import { formatVND, cn } from '../../../lib/utils';
import { useAuthStore } from '../../../lib/auth-store';

const PRESET_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];

const BANK_OPTIONS = [
  { code: 'MB', name: 'MB Bank (Ngân hàng Quân Đội)' },
  { code: 'VCB', name: 'Vietcombank (Ngoại Thương Việt Nam)' },
  { code: 'TCB', name: 'Techcombank (Kỹ Thương Việt Nam)' },
  { code: 'ACB', name: 'ACB (Á Châu)' },
  { code: 'BIDV', name: 'BIDV (Đầu Tư & Phát Triển)' },
  { code: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)' },
  { code: 'TPB', name: 'TPBank (Tiên Phong)' },
];

export function WalletPage(): React.ReactElement {
  const { user } = useAuthStore();
  const [balance, setBalance] = React.useState<number>(2450000);
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
  const [topupMethod, setTopupMethod] = React.useState<'VIETQR' | 'VNPAY' | 'INSTANT'>('VIETQR');
  const [isTopupLoading, setIsTopupLoading] = React.useState<boolean>(false);
  const [topupSuccessMsg, setTopupSuccessMsg] = React.useState<string | null>(null);

  // Withdraw State
  const [withdrawAmount, setWithdrawAmount] = React.useState<string>('500000');
  const [selectedBank, setSelectedBank] = React.useState<string>('MB');
  const [bankAccountNo, setBankAccountNo] = React.useState<string>('0912345678');
  const [accountHolder, setAccountHolder] = React.useState<string>(user?.fullName?.toUpperCase() || 'TRAN DUC');
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
      if (topupMethod === 'INSTANT' || topupMethod === 'VIETQR') {
        const res = await instantMockTopupApi(topupAmount);
        setBalance(res.newBalance);
        setTopupSuccessMsg(`Nạp thành công ${formatVND(topupAmount)} vào Ví SanGo!`);
        setTimeout(() => {
          setShowTopupModal(false);
          setTopupSuccessMsg(null);
          fetchWalletData();
        }, 1200);
      } else {
        const res = await createTopupApi({ amount: topupAmount });
        if (res.paymentUrl) {
          window.location.href = res.paymentUrl;
        }
      }
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
      const res = await requestWithdrawalApi({
        amount: amt,
        bankCode: selectedBank,
        bankAccountNo,
        accountHolder,
      });
      setBalance(res.newBalance);
      setWithdrawSuccessMsg(`Lệnh rút ${formatVND(amt)} về ${selectedBank} đã được tiếp nhận và xử lý thành công!`);
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccessMsg(null);
        fetchWalletData();
      }, 1500);
    } catch (err: any) {
      setWithdrawError(err.message || 'Không thể thực hiện rút tiền, vui lòng thử lại');
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

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 space-y-8 min-h-screen bg-background">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
            <Wallet className="h-4 w-4" />
            <span>Ví Thể Thao SanGo Pay</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Quản Lý Ví &amp; Biến Động Số Dư
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Thanh toán giữ chỗ sân, đặt cọc giải đấu, chia tiền đội nhóm và nạp rút tiền an toàn.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setShowTopupModal(true)}
            className="gap-1.5 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Nạp Tiền Vào Ví</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowWithdrawModal(true)}
            className="gap-1.5 font-bold text-xs cursor-pointer"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Rút Tiền Về Ngân Hàng</span>
          </Button>
        </div>
      </div>

      {/* Main Dual Row: Platinum Card + Monthly Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Platinum Glassmorphism Wallet Card */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/10 p-6 sm:p-8 shadow-xl flex flex-col justify-between space-y-6">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-12 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

          {/* Card Header */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-xs">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  SanGo Platinum Wallet
                </span>
                <span className="text-xs font-black text-foreground">
                  {user?.fullName || 'Người Chơi Thể Thao'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Đã Xác Thực KYC Level 2</span>
            </div>
          </div>

          {/* Balance Display */}
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Số Dư Khả Dụng
              </span>
              <button
                type="button"
                onClick={() => setShowBalance(!showBalance)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title={showBalance ? 'Ẩn số dư' : 'Hiện số dư'}
              >
                {showBalance ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-mono-num font-black text-primary tracking-tight">
                {showBalance ? formatVND(balance) : '•••••••• đ'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Số dư tạm giữ cọc: <strong className="text-foreground font-mono-num">0 đ</strong> (Sẵn sàng thanh toán tức thì mọi sân bóng &amp; giải đấu)
            </p>
          </div>

          {/* Quick Action Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={() => setShowTopupModal(true)}
              className="p-3 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border/60 hover:border-primary/50 text-left transition-all cursor-pointer space-y-1"
            >
              <div className="h-7 w-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-foreground block">Nạp Tiền</span>
              <span className="text-[10px] text-muted-foreground block">VietQR, VNPAY</span>
            </button>

            <button
              type="button"
              onClick={() => setShowWithdrawModal(true)}
              className="p-3 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border/60 hover:border-primary/50 text-left transition-all cursor-pointer space-y-1"
            >
              <div className="h-7 w-7 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-foreground block">Rút Tiền</span>
              <span className="text-[10px] text-muted-foreground block">Về mọi ngân hàng</span>
            </button>

            <button
              type="button"
              onClick={() => setShowQrPayModal(true)}
              className="p-3 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border/60 hover:border-primary/50 text-left transition-all cursor-pointer space-y-1"
            >
              <div className="h-7 w-7 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                <QrCode className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-foreground block">Mã QR Pay</span>
              <span className="text-[10px] text-muted-foreground block">Thanh toán tại sân</span>
            </button>

            <button
              type="button"
              onClick={() => alert('Đang xuất sao kê định dạng PDF/Excel...')}
              className="p-3 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border/60 hover:border-primary/50 text-left transition-all cursor-pointer space-y-1"
            >
              <div className="h-7 w-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Download className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-foreground block">Xuất Sao Kê</span>
              <span className="text-[10px] text-muted-foreground block">Tải biên lai điện tử</span>
            </button>
          </div>
        </div>

        {/* Month Financial Breakdown Card */}
        <Card className="border border-border/80 bg-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <span className="text-xs font-bold text-foreground">Tổng Quan Tháng Này</span>
              <span className="text-[11px] font-mono-num text-muted-foreground">Tháng 08/2026</span>
            </div>

            <div className="space-y-3.5 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs text-muted-foreground">Tổng Nạp Tiền</span>
                </div>
                <span className="font-mono-num font-bold text-xs text-emerald-500">
                  +{formatVND(totalTopupMonth || 3000000)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <TrendingDown className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs text-muted-foreground">Chi Tiêu Đặt Sân</span>
                </div>
                <span className="font-mono-num font-bold text-xs text-rose-500">
                  -{formatVND(totalSpentMonth || 850000)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Gift className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs text-muted-foreground">Hoàn Cọc &amp; Thưởng</span>
                </div>
                <span className="font-mono-num font-bold text-xs text-amber-500">
                  +{formatVND(totalRewardMonth || 200000)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/50 space-y-1 text-xs">
            <span className="font-bold text-foreground block">Hạn mức giao dịch:</span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Tối đa <strong className="text-foreground">50.000.000 đ/giao dịch</strong>. Miễn 100% phí nạp rút và chuyển tiền nội bộ.
            </p>
          </div>
        </Card>
      </div>

      {/* Transaction History & Filtered Ledger Section */}
      <Card className="border border-border/80 bg-card overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-border/60 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                <span>Lịch Sử Giao Dịch &amp; Biến Động Số Dư</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground pt-0.5">
                Hệ thống lưu trữ minh bạch toàn bộ các biến động nạp tiền, cọc sân, hoàn tiền và tiền thưởng.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Tìm mã giao dịch / số tiền..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 text-xs w-60 bg-background"
              />
              {(typeFilter !== 'ALL' || timePreset !== 'ALL' || startDate || endDate || searchQuery) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetFilters}
                  className="h-8.5 text-xs font-bold gap-1 px-2.5 shrink-0 cursor-pointer"
                  title="Đặt lại toàn bộ bộ lọc"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Đặt lại</span>
                </Button>
              )}
            </div>
          </div>

          {/* Dual Filter Bars: Type + Date Range */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2 border-t border-border/50">
            {/* 1. Type Filter Pills */}
            <div className="flex flex-wrap items-center gap-1 bg-secondary/60 p-1 rounded-xl">
              {(
                [
                  { key: 'ALL', label: 'Tất Cả Loại' },
                  { key: 'TOPUP', label: 'Nạp Tiền' },
                  { key: 'PAYMENT', label: 'Chi Tiêu' },
                  { key: 'REFUND', label: 'Hoàn Tiền' },
                  { key: 'CASHBACK', label: 'Thưởng' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTypeFilter(tab.key)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    typeFilter === tab.key
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 2. Time Range Presets & Date Pickers */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Presets */}
              <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-xl overflow-x-auto no-scrollbar">
                {(
                  [
                    { key: 'ALL', label: 'Tất Cả Thời Gian' },
                    { key: 'TODAY', label: 'Hôm Nay' },
                    { key: '7DAYS', label: '7 Ngày Qua' },
                    { key: 'THIS_MONTH', label: 'Tháng Này' },
                    { key: '30DAYS', label: '30 Ngày Qua' },
                  ] as const
                ).map((tp) => (
                  <button
                    key={tp.key}
                    type="button"
                    onClick={() => {
                      setTimePreset(tp.key);
                      setStartDate('');
                      setEndDate('');
                    }}
                    className={cn(
                      'px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer',
                      timePreset === tp.key && !startDate && !endDate
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {tp.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Pickers */}
              <div className="flex items-center gap-1.5 bg-secondary/40 p-1 rounded-xl border border-border/50">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground px-1">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span className="font-bold">Từ:</span>
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setTimePreset('CUSTOM');
                  }}
                  className="h-7 px-2 rounded-lg bg-background border border-input text-[11px] font-mono-num text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
                />

                <span className="text-[11px] text-muted-foreground font-bold px-0.5">Đến:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setTimePreset('CUSTOM');
                  }}
                  className="h-7 px-2 rounded-lg bg-background border border-input text-[11px] font-mono-num text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Search result count strip */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span>
              Đang hiển thị <strong className="text-foreground">{filteredLedger.length}</strong> / {ledgerItems.length} giao dịch
            </span>
            {(startDate || endDate || timePreset !== 'ALL') && (
              <span className="text-primary font-semibold">
                Bộ lọc thời gian: {startDate ? `từ ${startDate}` : ''} {endDate ? `đến ${endDate}` : ''} {timePreset !== 'CUSTOM' ? `(${timePreset})` : ''}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              Đang tải danh sách giao dịch...
            </div>
          ) : filteredLedger.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="h-10 w-10 rounded-2xl bg-secondary/80 flex items-center justify-center mx-auto text-muted-foreground">
                <Receipt className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-foreground">Không có giao dịch nào phù hợp</p>
              <p className="text-[11px] text-muted-foreground">
                Bạn chưa có biến động số dư nào trong khoảng tìm kiếm này.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredLedger.map((item) => {
                const isCredit = item.direction === 'CREDIT';
                const formattedDate = new Date(item.createdAt).toLocaleString('vi-VN');

                let title = 'Biến Động Số Dư';
                let icon = <ArrowDownLeft className="h-4 w-4 text-emerald-500" />;
                let badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';

                if (item.type === 'TOPUP') {
                  title = 'Nạp Tiền Vào Ví SanGo';
                  icon = <ArrowDownLeft className="h-4 w-4 text-emerald-500" />;
                  badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                } else if (item.type === 'PAYMENT') {
                  title = item.refType.includes('WITHDRAW') ? 'Rút Tiền Về Ngân Hàng' : 'Thanh Toán Đặt Sân / Cọc Giải';
                  icon = <ArrowUpRight className="h-4 w-4 text-rose-500" />;
                  badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
                } else if (item.type === 'REFUND') {
                  title = 'Hoàn Tiền Giữ Chỗ / Hủy Kèo';
                  icon = <RotateCcw className="h-4 w-4 text-cyan-500" />;
                  badgeClass = 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
                } else if (item.type === 'CASHBACK') {
                  title = 'Thưởng Điểm Uy Tín & Fair-Play';
                  icon = <Award className="h-4 w-4 text-amber-500" />;
                  badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedReceipt(item)}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-secondary/30 transition-colors cursor-pointer"
                  >
                    {/* Left Icon & Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-10 w-10 rounded-2xl bg-secondary/80 border border-border/80 flex items-center justify-center shrink-0 shadow-xs">
                        {icon}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                            {title}
                          </h4>
                          <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold border', badgeClass)}>
                            {item.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono-num">
                          <span>Mã: <strong className="text-foreground">{item.refId}</strong></span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formattedDate}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Amount & Balance After */}
                    <div className="text-right shrink-0 space-y-0.5">
                      <div
                        className={cn(
                          'text-sm sm:text-base font-mono-num font-black',
                          isCredit ? 'text-emerald-500' : 'text-rose-500',
                        )}
                      >
                        {isCredit ? '+' : '-'}{formatVND(item.amount)}
                      </div>
                      <span className="text-[11px] font-mono-num text-muted-foreground block">
                        Số dư sau GD: <strong className="text-foreground">{formatVND(item.balanceAfter)}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Hiển thị trang {currentPage} / {totalPages} ({totalItems} giao dịch)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-2.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-2.5"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 1. Modal Nạp Tiền (Top-up Modal) */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between sticky top-0 bg-card z-10">
              <div className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-black text-foreground">Nạp Tiền Vào Ví SanGo</CardTitle>
              </div>
              <button
                type="button"
                onClick={() => setShowTopupModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {topupSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{topupSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleTopupSubmit} className="space-y-4">
                {/* Preset Amounts Grid */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Chọn Nhanh Mệnh Giá Nạp
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setTopupAmount(amt);
                          setCustomTopupText(String(amt));
                        }}
                        className={cn(
                          'py-2 rounded-xl border text-xs font-mono-num font-bold transition-all cursor-pointer text-center',
                          topupAmount === amt
                            ? 'border-primary bg-primary/10 text-primary shadow-xs'
                            : 'border-border/60 bg-secondary/30 text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {formatVND(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Hoặc Nhập Số Tiền Tùy Ý (đ)
                  </label>
                  <Input
                    type="number"
                    min={10000}
                    max={50000000}
                    step={10000}
                    value={customTopupText}
                    onChange={(e) => {
                      setCustomTopupText(e.target.value);
                      setTopupAmount(Number(e.target.value) || 0);
                    }}
                    required
                    className="h-10 text-sm font-mono-num font-bold"
                  />
                  <span className="text-[11px] text-muted-foreground block">
                    Tối thiểu 10.000 đ - Tối đa 50.000.000 đ
                  </span>
                </div>

                {/* Method Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground block">
                    Phương Thức Thanh Toán
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setTopupMethod('VIETQR')}
                      className={cn(
                        'p-3 rounded-2xl border text-left space-y-1 transition-all cursor-pointer',
                        topupMethod === 'VIETQR'
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                          : 'border-border/60 bg-secondary/30 hover:border-border',
                      )}
                    >
                      <div className="flex items-center gap-2 text-primary font-bold text-xs">
                        <QrCode className="h-4 w-4 shrink-0" />
                        <span>Mã QR VietQR</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">Quét từ mọi App ngân hàng</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTopupMethod('VNPAY')}
                      className={cn(
                        'p-3 rounded-2xl border text-left space-y-1 transition-all cursor-pointer',
                        topupMethod === 'VNPAY'
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                          : 'border-border/60 bg-secondary/30 hover:border-border',
                      )}
                    >
                      <div className="flex items-center gap-2 text-primary font-bold text-xs">
                        <CreditCard className="h-4 w-4 shrink-0" />
                        <span>Cổng VNPAY QR</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">Thẻ ATM / Visa / Master</span>
                    </button>
                  </div>
                </div>

                {/* VietQR View details */}
                {topupMethod === 'VIETQR' && (
                  <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-2 text-xs">
                    <div className="h-28 w-28 mx-auto bg-white p-2 rounded-2xl border border-border shadow-xs flex items-center justify-center">
                      <QrCode className="h-24 w-24 text-slate-900" />
                    </div>
                    <div className="space-y-0.5 text-[11px] bg-background/80 p-2.5 rounded-xl border border-border/40">
                      <p><strong className="text-foreground">Ngân hàng:</strong> MB Bank (Quân Đội)</p>
                      <p><strong className="text-foreground">Số tài khoản:</strong> <span className="font-mono-num font-bold text-primary">0912345678</span></p>
                      <p><strong className="text-foreground">Chủ tài khoản:</strong> SANGO VIETNAM JSC</p>
                      <p><strong className="text-foreground">Số tiền:</strong> <span className="font-mono-num font-bold text-emerald-500">{formatVND(topupAmount)}</span></p>
                      <p><strong className="text-foreground">Nội dung CK:</strong> <span className="font-mono-num font-bold text-amber-500">SANGO TOPUP {user?.id?.slice(0, 6) || 'TEST'}</span></p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTopupModal(false)}
                    className="text-xs font-bold"
                  >
                    Đóng
                  </Button>
                  <Button
                    type="submit"
                    disabled={isTopupLoading || topupAmount < 10000}
                    size="sm"
                    className="font-bold text-xs shadow-md shadow-emerald-500/20"
                  >
                    {isTopupLoading ? 'Đang xử lý nạp...' : `Xác Nhận Nạp ${formatVND(topupAmount)}`}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. Modal Rút Tiền (Withdrawal Modal) */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between sticky top-0 bg-card z-10">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-rose-500" />
                <CardTitle className="text-base font-black text-foreground">Rút Tiền Về Tài Khoản Ngân Hàng</CardTitle>
              </div>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Số dư khả dụng hiện có:</span>
                  <span className="font-mono-num font-black text-primary text-sm">{formatVND(balance)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Phí giao dịch rút tiền: <strong className="text-emerald-500 font-bold">0 đ (Miễn phí 100%)</strong>
                </p>
              </div>

              {withdrawError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{withdrawError}</span>
                </div>
              )}

              {withdrawSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{withdrawSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                {/* Select Bank */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Ngân Hàng Thụ Hưởng <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-hidden cursor-pointer"
                  >
                    {BANK_OPTIONS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bank Account No & Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">
                      Số Tài Khoản <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="0912345678"
                      value={bankAccountNo}
                      onChange={(e) => setBankAccountNo(e.target.value)}
                      required
                      className="h-10 text-xs font-mono-num"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">
                      Tên Chủ Tài Khoản <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="NGUYEN VAN A"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                      required
                      className="h-10 text-xs uppercase"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Số Tiền Cần Rút (đ) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    min={50000}
                    max={balance}
                    step={10000}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                    className="h-10 text-sm font-mono-num font-bold"
                  />
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Tối thiểu: 50.000 đ</span>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(String(balance))}
                      className="text-primary font-bold hover:underline cursor-pointer"
                    >
                      Rút tất cả số dư
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWithdrawModal(false)}
                    className="text-xs font-bold"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={isWithdrawLoading || Number(withdrawAmount) > balance || Number(withdrawAmount) < 50000}
                    size="sm"
                    className="font-bold text-xs shadow-md shadow-rose-500/20 bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    {isWithdrawLoading ? 'Đang rút tiền...' : 'Xác Nhận Rút Tiền'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Modal E-Receipt (Chi Tiết Biên Lai Điện Tử) */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150">
            <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between bg-card z-10">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-black text-foreground">Biên Lai Điện Tử SanGo Pay</CardTitle>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="text-center py-2 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Số Tiền Giao Dịch
                </span>
                <p
                  className={cn(
                    'text-2xl sm:text-3xl font-mono-num font-black',
                    selectedReceipt.direction === 'CREDIT' ? 'text-emerald-500' : 'text-rose-500',
                  )}
                >
                  {selectedReceipt.direction === 'CREDIT' ? '+' : '-'}{formatVND(selectedReceipt.amount)}
                </p>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Giao dịch thành công</span>
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Mã tham chiếu (Ref ID):</span>
                  <span className="font-mono-num font-bold text-foreground">{selectedReceipt.refId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Loại biến động:</span>
                  <span className="font-bold text-foreground">{selectedReceipt.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Nguồn gốc / Dịch vụ:</span>
                  <span className="font-mono-num font-bold text-primary">{selectedReceipt.refType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Thời gian ghi nhận:</span>
                  <span className="font-mono-num text-foreground">
                    {new Date(selectedReceipt.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <span className="text-muted-foreground">Số dư sau giao dịch:</span>
                  <span className="font-mono-num font-black text-foreground">
                    {formatVND(selectedReceipt.balanceAfter)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => alert('Đang in biên lai điện tử...')}
                  className="text-xs font-bold gap-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Tải Biên Lai</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setSelectedReceipt(null)}
                  className="text-xs font-bold"
                >
                  Đóng
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. Modal QR Pay Tại Sân */}
      {showQrPayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-sm border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150 text-center">
            <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between bg-card z-10">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-black text-foreground">Mã QR Pay Cá Nhân</CardTitle>
              </div>
              <button
                type="button"
                onClick={() => setShowQrPayModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="h-44 w-44 mx-auto bg-white p-3 rounded-2xl border border-border shadow-md flex items-center justify-center">
                <QrCode className="h-40 w-40 text-slate-900" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-foreground">{user?.fullName || 'Người Chơi SanGo'}</h4>
                <p className="text-[11px] text-muted-foreground">
                  Đưa mã này cho quầy lễ tân cụm sân để thanh toán tiền giờ hoặc dịch vụ đi kèm.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setShowQrPayModal(false)}
                className="w-full text-xs font-bold"
              >
                Đã Xong
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
