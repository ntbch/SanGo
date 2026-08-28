import React from 'react';
import { WalletTopupModal } from './wallet-topup-modal';
import { WalletWithdrawModal } from './wallet-withdraw-modal';
import { WalletReceiptModal } from './wallet-receipt-modal';
import { WalletQrModal } from './wallet-qr-modal';
import { useWallet } from '../hooks/use-wallet';

interface WalletModalsContainerProps {
  wallet: ReturnType<typeof useWallet>;
}

export function WalletModalsContainer({ wallet: w }: WalletModalsContainerProps): React.ReactElement {
  return (
    <>
      <WalletTopupModal
        user={w.user}
        show={w.showTopupModal}
        onClose={() => w.setShowTopupModal(false)}
        topupAmount={w.topupAmount}
        setTopupAmount={w.setTopupAmount}
        customTopupText={w.customTopupText}
        setCustomTopupText={w.setCustomTopupText}
        topupMethod={w.topupMethod}
        setTopupMethod={w.setTopupMethod}
        isTopupLoading={w.isTopupLoading}
        topupSuccessMsg={w.topupSuccessMsg}
        onSubmit={w.handleTopupSubmit}
      />

      <WalletWithdrawModal
        show={w.showWithdrawModal}
        onClose={() => w.setShowWithdrawModal(false)}
        balance={w.balance}
        withdrawAmount={w.withdrawAmount}
        setWithdrawAmount={w.setWithdrawAmount}
        selectedBank={w.selectedBank}
        setSelectedBank={w.setSelectedBank}
        bankAccountNo={w.bankAccountNo}
        setBankAccountNo={w.setBankAccountNo}
        accountHolder={w.accountHolder}
        setAccountHolder={w.setAccountHolder}
        isWithdrawLoading={w.isWithdrawLoading}
        withdrawError={w.withdrawError}
        withdrawSuccessMsg={w.withdrawSuccessMsg}
        onSubmit={w.handleWithdrawSubmit}
      />

      <WalletReceiptModal
        receipt={w.selectedReceipt}
        onClose={() => w.setSelectedReceipt(null)}
      />

      <WalletQrModal
        user={w.user}
        show={w.showQrPayModal}
        onClose={() => w.setShowQrPayModal(false)}
      />
    </>
  );
}
