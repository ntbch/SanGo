import React from 'react';
import { Card } from '../../../components/ui/card';
import { Wallet, CreditCard } from 'lucide-react';
import { formatVND, cn } from '../../../lib/utils';

interface CheckoutPaymentMethodsProps {
  paymentType: 'DEPOSIT' | 'FULL';
  onPaymentTypeChange: (type: 'DEPOSIT' | 'FULL') => void;
  depositPercent: number;
  depositAmount: number;
  finalTotal: number;
  paymentGateway: 'WALLET' | 'VNPAY';
  onPaymentGatewayChange: (gateway: 'WALLET' | 'VNPAY') => void;
}

export function CheckoutPaymentMethods({
  paymentType,
  onPaymentTypeChange,
  depositPercent,
  depositAmount,
  finalTotal,
  paymentGateway,
  onPaymentGatewayChange,
}: CheckoutPaymentMethodsProps): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Payment Type Selection (Deposit vs Full) */}
      <Card className="p-5 border border-border/80 bg-card space-y-3">
        <h3 className="text-sm font-bold text-foreground">Chọn Mức Thanh Toán</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onPaymentTypeChange('DEPOSIT')}
            className={cn(
              'p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1',
              paymentType === 'DEPOSIT'
                ? 'bg-primary/10 border-primary ring-2 ring-primary/30'
                : 'bg-card border-border/70 hover:bg-secondary/40',
            )}
          >
            <span className="text-xs font-bold text-foreground block">
              Đặt cọc {depositPercent}%
            </span>
            <span className="font-mono-num font-black text-sm text-primary block">
              {formatVND(depositAmount)}
            </span>
            <span className="text-[10px] text-muted-foreground block">
              Trả phần còn lại tại sân khi check-in
            </span>
          </button>

          <button
            type="button"
            onClick={() => onPaymentTypeChange('FULL')}
            className={cn(
              'p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1',
              paymentType === 'FULL'
                ? 'bg-primary/10 border-primary ring-2 ring-primary/30'
                : 'bg-card border-border/70 hover:bg-secondary/40',
            )}
          >
            <span className="text-xs font-bold text-foreground block">
              Thanh toán toàn bộ 100%
            </span>
            <span className="font-mono-num font-black text-sm text-primary block">
              {formatVND(finalTotal)}
            </span>
            <span className="text-[10px] text-muted-foreground block">
              Không cần thanh toán thêm tại quầy
            </span>
          </button>
        </div>
      </Card>

      {/* Payment Gateway Selector */}
      <Card className="p-5 border border-border/80 bg-card space-y-3">
        <h3 className="text-sm font-bold text-foreground">Phương Thức Thanh Toán</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onPaymentGatewayChange('WALLET')}
            className={cn(
              'p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3',
              paymentGateway === 'WALLET'
                ? 'bg-primary/10 border-primary ring-2 ring-primary/30'
                : 'bg-card border-border/70 hover:bg-secondary/40',
            )}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground block">Ví SanGo</span>
              <span className="text-[10px] text-muted-foreground block">Thanh toán tức thì 0đ phí</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onPaymentGatewayChange('VNPAY')}
            className={cn(
              'p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3',
              paymentGateway === 'VNPAY'
                ? 'bg-primary/10 border-primary ring-2 ring-primary/30'
                : 'bg-card border-border/70 hover:bg-secondary/40',
            )}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground block">Cổng VNPAY QR</span>
              <span className="text-[10px] text-muted-foreground block">Quét mã Banking &amp; Thẻ ATM</span>
            </div>
          </button>
        </div>
      </Card>
    </div>
  );
}
