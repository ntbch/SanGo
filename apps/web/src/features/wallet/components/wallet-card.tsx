import React from 'react';
import {
  Wallet,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowDownLeft,
  ArrowUpRight,
  QrCode,
  Download,
} from 'lucide-react';
import { formatVND } from '../../../lib/utils';
import { User } from '../../../lib/auth-store';

export interface WalletCardProps {
  user: User | null;
  balance: number;
  showBalance: boolean;
  onToggleBalance: () => void;
  onOpenTopup: () => void;
  onOpenWithdraw: () => void;
  onOpenQrPay: () => void;
}

export function WalletCard({
  user,
  balance,
  showBalance,
  onToggleBalance,
  onOpenTopup,
  onOpenWithdraw,
  onOpenQrPay,
}: WalletCardProps): React.ReactElement {
  return (
    <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">

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
            onClick={onToggleBalance}
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
          onClick={onOpenTopup}
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
          onClick={onOpenWithdraw}
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
          onClick={onOpenQrPay}
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
  );
}
