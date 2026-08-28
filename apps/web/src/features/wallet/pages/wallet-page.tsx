import React from 'react';
import { useWallet } from '../hooks/use-wallet';
import { WalletHeader } from '../components/wallet-header';
import { WalletCard } from '../components/wallet-card';
import { WalletStatsCard } from '../components/wallet-stats-card';
import { WalletLedgerTable } from '../components/wallet-ledger-table';
import { WalletModalsContainer } from '../components/wallet-modals-container';

export function WalletPage(): React.ReactElement {
  const w = useWallet();

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 space-y-8 min-h-screen bg-background">
      <WalletHeader
        onOpenTopup={() => w.setShowTopupModal(true)}
        onOpenWithdraw={() => w.setShowWithdrawModal(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <WalletCard
          user={w.user}
          balance={w.balance}
          showBalance={w.showBalance}
          onToggleBalance={() => w.setShowBalance(!w.showBalance)}
          onOpenTopup={() => w.setShowTopupModal(true)}
          onOpenWithdraw={() => w.setShowWithdrawModal(true)}
          onOpenQrPay={() => w.setShowQrPayModal(true)}
        />

        <WalletStatsCard
          totalTopupMonth={w.totalTopupMonth}
          totalSpentMonth={w.totalSpentMonth}
          totalRewardMonth={w.totalRewardMonth}
        />
      </div>

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

      <WalletModalsContainer wallet={w} />
    </div>
  );
}
