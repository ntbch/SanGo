import { type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Calendar, Home } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '../../../components/ui/card';

export function PaymentResultPage(): ReactElement {
  const [searchParams] = useSearchParams();

  const status =
    searchParams.get('status') ||
    (searchParams.get('vnp_ResponseCode') === '00' ? 'SUCCESS' : 'FAILED');
  const bookingCode =
    searchParams.get('code') || searchParams.get('txnRef') || searchParams.get('vnp_TxnRef') || '';
  const message = searchParams.get('message') || '';

  const isSuccess = status === 'SUCCESS' || status === '00';

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card className="border-2 text-center shadow-lg">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex justify-center">
            {isSuccess ? (
              <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-10" />
              </div>
            ) : (
              <div className="size-16 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <XCircle className="size-10" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {isSuccess ? 'Đặt sân thành công!' : 'Thanh toán không thành công'}
          </CardTitle>
          <CardDescription className="text-sm">
            {isSuccess
              ? 'Đơn đặt sân của bạn đã được xác nhận. Vui lòng lưu mã đơn để check-in tại sân.'
              : message || 'Giao dịch thanh toán chưa được hoàn tất hoặc đã bị huỷ.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          {bookingCode ? (
            <div className="rounded-lg bg-muted p-4 space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Mã đơn đặt sân:
              </div>
              <div className="text-xl font-mono font-bold text-primary">{bookingCode}</div>
            </div>
          ) : null}

          {isSuccess ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-xs text-emerald-800 dark:text-emerald-300 text-left space-y-1">
              <p className="font-semibold">💡 Hướng dẫn check-in:</p>
              <p>1. Đến sân trước giờ chơi 10–15 phút.</p>
              <p>
                2. Đưa mã đơn hoặc mã QR trong mục <strong>Đơn của tôi</strong> cho chủ sân.
              </p>
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          {isSuccess ? (
            <>
              <Button asChild className="w-full">
                <Link to="/dashboard/my-bookings">
                  <Calendar className="mr-2 size-4" /> Xem đơn của tôi
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/venues">
                  <Home className="mr-2 size-4" /> Trang chủ
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="w-full">
                <Link to="/venues">
                  <ArrowRight className="mr-2 size-4" /> Đặt lại sân
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/dashboard/my-bookings">Xem đơn đã đặt</Link>
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
