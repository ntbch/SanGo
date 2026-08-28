import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { formatVND } from '../../../lib/utils';

export function ProfileWalletTab(): React.ReactElement {
  return (
    <Card className="p-6 border border-border/80 bg-card shadow-md space-y-5 animate-in fade-in-50 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div>
          <h3 className="text-base font-black text-foreground">Ví Tiền SanGo</h3>
          <p className="text-xs text-muted-foreground">Quản lý số dư đặt cọc và thanh toán tiền sân.</p>
        </div>
        <Link to="/wallet">
          <Button size="sm" className="text-xs font-bold gap-1.5 cursor-pointer">
            <span>Nạp / Rút Ví</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-primary/5 border border-primary/20 space-y-2">
        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Số Dư Khả Dụng</span>
        <p className="font-mono-num font-black text-2xl sm:text-3xl text-primary">{formatVND(1500000)}</p>
        <p className="text-[11px] text-muted-foreground">Dùng để đặt cọc 30% nhanh chóng không cần qua cổng ngân hàng.</p>
      </div>
    </Card>
  );
}
