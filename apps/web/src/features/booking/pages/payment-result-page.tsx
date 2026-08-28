import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { formatVND } from '../../../lib/utils';
import { CheckCircle2, Ticket } from 'lucide-react';

export function PaymentResultPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const txnRef = searchParams.get('txnRef') || 'TXN-SUCCESS';
  const amount = Number(searchParams.get('amount')) || 0;

  return (
    <div className="w-full px-4 py-16 text-center space-y-6 max-w-md mx-auto animate-in fade-in duration-200">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-inner">
        <CheckCircle2 className="h-8 w-8" />
      </div>

      <div className="space-y-1.5">
        <h1 className="text-xl sm:text-2xl font-black text-foreground">
          Thanh Toán Đặt Sân Thành Công!
        </h1>
        <p className="text-xs text-muted-foreground">
          Vé đặt sân của bạn đã được xác nhận. Mã QR Check-in đã sẵn sàng.
        </p>
      </div>

      <Card className="p-4 border border-border/80 bg-card space-y-2 text-xs text-left">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Mã giao dịch:</span>
          <span className="font-mono-num font-bold text-foreground">{txnRef}</span>
        </div>
        {amount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Số tiền đã trả:</span>
            <span className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
              {formatVND(amount)}
            </span>
          </div>
        )}
      </Card>

      <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
        <Link to="/bookings">
          <Button size="lg" className="w-full sm:w-auto font-bold gap-2 shadow-xs">
            <Ticket className="h-4 w-4" />
            <span>Xem Vé Của Tôi</span>
          </Button>
        </Link>
        <Link to="/">
          <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold">
            <span>Về Trang Chủ</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
