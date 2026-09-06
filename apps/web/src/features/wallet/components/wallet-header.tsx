import React from 'react';
import { Wallet, PlusCircle, ArrowUpRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface WalletHeaderProps {
  onOpenTopup: () => void;
  onOpenWithdraw: () => void;
}

export function WalletHeader({
  onOpenTopup,
  onOpenWithdraw,
}: WalletHeaderProps): React.ReactElement {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5" data-testid="wallet-passbook-header">
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
          onClick={onOpenTopup}
          className="gap-1.5 font-bold text-xs shadow-md cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Nạp Tiền Vào Ví</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onOpenWithdraw}
          className="gap-1.5 font-bold text-xs cursor-pointer"
        >
          <ArrowUpRight className="h-4 w-4" />
          <span>Rút Tiền Về Ngân Hàng</span>
        </Button>
      </div>
    </div>
  );
}
