import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { CreditCard } from 'lucide-react';
import { formatVND } from '../../../lib/utils';

interface CheckoutOrderSummaryProps {
  subtotal: number;
  discount: number;
  finalTotal: number;
  depositPercent: number;
  amountToPay: number;
  paymentType: 'DEPOSIT' | 'FULL';
  isPending: boolean;
  isActive: boolean;
  onCheckout: () => void;
}

export function CheckoutOrderSummary({
  subtotal,
  discount,
  finalTotal,
  depositPercent,
  amountToPay,
  paymentType,
  isPending,
  isActive,
  onCheckout,
}: CheckoutOrderSummaryProps): React.ReactElement {
  return (
    <Card className="p-5 border border-border/80 bg-card space-y-4 shadow-md">
      <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border/60">
        Tổng Kết Chi Phí
      </h3>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Tiền sân niêm yết</span>
          <span className="font-mono-num font-semibold text-foreground">{formatVND(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
            <span>Giảm giá voucher</span>
            <span className="font-mono-num">- {formatVND(discount)}</span>
          </div>
        )}

        <div className="pt-2 border-t border-border/60 flex items-center justify-between font-bold text-sm">
          <span>Tổng giá trị đơn</span>
          <span className="font-mono-num text-foreground">{formatVND(finalTotal)}</span>
        </div>

        <div className="pt-2 border-t border-border/60 flex items-baseline justify-between">
          <div>
            <span className="text-[11px] font-bold text-primary block">
              Số tiền cần thanh toán
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({paymentType === 'DEPOSIT' ? `Cọc ${depositPercent}%` : 'Toàn bộ'})
            </span>
          </div>
          <span className="font-mono-num font-black text-lg sm:text-xl text-primary">
            {formatVND(amountToPay)}
          </span>
        </div>
      </div>

      <Button
        size="lg"
        disabled={isPending || !isActive}
        onClick={onCheckout}
        className="w-full font-bold gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer"
      >
        <CreditCard className="h-4 w-4" />
        <span>{isPending ? 'Đang tạo giao dịch...' : 'Xác Nhận Thanh Toán'}</span>
      </Button>
    </Card>
  );
}
