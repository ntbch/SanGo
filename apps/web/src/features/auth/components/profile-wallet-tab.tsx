import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { formatVND } from '../../../lib/utils';
import { useWallet } from '../../wallet/hooks/use-wallet';

export function ProfileWalletTab(): React.ReactElement {
  const { balance, status, retry } = useWallet();

  return (
    <Card className="p-6 border border-border/80 bg-card shadow-md space-y-5 animate-in fade-in-50 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div>
          <h3 className="text-base font-black text-foreground">Ví Tiền SanGo</h3>
          <p className="text-xs text-muted-foreground">Quản lý số dư cọc và tiền sân.</p>
        </div>
        <Link to="/wallet">
          <Button size="sm" className="text-xs font-bold gap-1.5 cursor-pointer">
            <span>Nạp / Rút Ví</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 space-y-2">
        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Số Dư Khả Dụng</span>
        {status === 'loading' ? (
          <p role="status" className="text-sm text-muted-foreground">Đang tải số dư...</p>
        ) : status === 'error' ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm text-destructive">Không thể tải số dư ví. Vui lòng thử lại.</p>
            <Button size="sm" variant="outline" onClick={() => void retry()}>Thử lại</Button>
          </div>
        ) : balance !== null ? (
          <p className="font-mono-num font-black text-2xl sm:text-3xl text-primary">{formatVND(balance)}</p>
        ) : null}
        <p className="text-[11px] text-muted-foreground">Đặt cọc 30% không cần ngân hàng.</p>
      </div>
    </Card>
  );
}
