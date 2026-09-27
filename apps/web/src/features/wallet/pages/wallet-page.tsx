import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { useWallet } from '../hooks/use-wallet';
import { getMyWalletApi } from '../api/wallet-api';
import { formatVND } from '../../../lib/utils';
import { WalletHeader } from '../components/wallet-header';
import { WalletCard } from '../components/wallet-card';
import { WalletStatsCard } from '../components/wallet-stats-card';
import { WalletLedgerTable } from '../components/wallet-ledger-table';
import { WalletModalsContainer } from '../components/wallet-modals-container';
import { useAuthStore } from '../../../lib/auth-store';

interface TopupResultBanner {
  ok: boolean;
  txnRef: string;
  balance?: number;
}

/** Dashboard ví — tách riêng để có thể remount (refetch số dư + ledger) sau khi quay về từ cổng thanh toán. */
function WalletDashboard(): React.ReactElement {
  const w = useWallet();

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 space-y-6 min-h-screen bg-background" data-testid="wallet-passbook-page">
      <WalletHeader
        onOpenTopup={() => w.setShowTopupModal(true)}
        onOpenWithdraw={() => w.setShowWithdrawModal(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch" data-testid="wallet-balance-actions">
        <WalletCard
          user={w.user}
          balance={w.balance}
          status={w.status}
          onRetry={() => void w.retry()}
          showBalance={w.showBalance}
          onToggleBalance={() => w.setShowBalance(!w.showBalance)}
          onOpenTopup={() => w.setShowTopupModal(true)}
          onOpenWithdraw={() => w.setShowWithdrawModal(true)}
          onOpenQrPay={() => w.setShowQrPayModal(true)}
        />

        {w.status === 'success' && (
        <WalletStatsCard
          totalTopupMonth={w.totalTopupMonth}
          totalSpentMonth={w.totalSpentMonth}
          totalRewardMonth={w.totalRewardMonth}
        />
        )}
      </div>

      {w.status !== 'error' && (
      <WalletLedgerTable
        ledgerItems={w.ledgerItems}
        filteredLedger={w.filteredLedger}
        isLoading={w.isLoading}
        totalItems={w.totalItems}
        currentPage={w.currentPage}
        totalPages={w.totalPages}
        searchQuery={w.searchQuery}
        setSearchQuery={w.setSearchQuery}
        typeFilter={w.typeFilter}
        setTypeFilter={w.setTypeFilter}
        timePreset={w.timePreset}
        setTimePreset={w.setTimePreset}
        startDate={w.startDate}
        setStartDate={w.setStartDate}
        endDate={w.endDate}
        setEndDate={w.setEndDate}
        onResetFilters={w.handleResetFilters}
        onPageChange={w.setCurrentPage}
        onSelectReceipt={w.setSelectedReceipt}
      />
      )}

      <WalletModalsContainer wallet={w} />
    </div>
  );
}

function WalletSessionPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reloadKey, setReloadKey] = React.useState(0);
  const [topupResult, setTopupResult] = React.useState<TopupResultBanner | null>(null);

  // Phase 2: callback cổng (VNPay/mock) redirect về /wallet?topup=SUCCESS|FAIL&txnRef=...
  // Toast chỉ là gợi ý — số dư thật luôn được refetch từ REST (nguồn sự thật).
  React.useEffect(() => {
    const topup = searchParams.get('topup');
    const txnRef = searchParams.get('txnRef') ?? '';
    if (topup !== 'SUCCESS' && topup !== 'FAIL') return;

    // Consume params ngay để reload/refetch sau này không tái hiện toast.
    setSearchParams({}, { replace: true });
    let alive = true;

    if (topup === 'SUCCESS') {
      getMyWalletApi()
        .then((res) => {
          if (!alive) return;
          setTopupResult({ ok: true, txnRef, balance: res.balance });
          setReloadKey((k) => k + 1); // remount dashboard -> useWallet refetch số dư + lịch sử
        })
        .catch(() => {
          if (alive) setTopupResult({ ok: true, txnRef });
        });
    } else {
      setTopupResult({ ok: false, txnRef });
    }

    const timer = setTimeout(() => {
      if (alive) setTopupResult(null);
    }, 8000);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      {topupResult && (
        <div
          role="status"
          aria-live="polite"
          className={
            'fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 max-w-md w-[calc(100%-2rem)] ' +
            (topupResult.ok
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
              : 'bg-destructive/10 border-destructive/40 text-destructive')
          }
        >
          {topupResult.ok ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm">
            <p className="font-bold">
              {topupResult.ok ? 'Nạp ví thành công!' : 'Nạp ví không thành công'}
            </p>
            <p className="text-xs text-muted-foreground">
              {topupResult.ok && topupResult.balance != null
                ? `Số dư mới: ${formatVND(topupResult.balance)}`
                : 'Giao dịch chưa được xác nhận. Bạn thử lại.'}
              {topupResult.txnRef ? ` · Mã GD: ${topupResult.txnRef}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTopupResult(null)}
            aria-label="Đóng thông báo"
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors active:scale-[0.98]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <WalletDashboard key={reloadKey} />
    </div>
  );
}

export function WalletPage(): React.ReactElement {
  const { user } = useAuthStore();
  return <WalletSessionPage key={user?.id ?? 'anonymous'} />;
}
