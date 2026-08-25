import { type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Calendar, CheckCircle2, Home, QrCode, XCircle } from 'lucide-react';

import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';

/** Trang kết quả thanh toán — card trắng bo-xl căn giữa kiểu Stitch k_t_qu_thanh_to_n. */
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
    <div className="mx-auto w-full max-w-xl">
      <Card className="rounded-xl border-border/60 p-6 text-center shadow-[0_12px_30px_rgba(15,23,42,0.1)] sm:p-10">
        {/* Icon trạng thái — success dùng cặp token accent, failure dùng destructive */}
        <div className="flex justify-center">
          {isSuccess ? (
            <div className="flex size-20 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <CheckCircle2 className="size-10" aria-hidden />
            </div>
          ) : (
            <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="size-10" aria-hidden />
            </div>
          )}
        </div>

        <h1
          className={`mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl ${
            isSuccess ? 'text-primary' : 'text-destructive'
          }`}
        >
          {isSuccess ? 'Đặt sân thành công!' : 'Thanh toán không thành công'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {isSuccess
            ? 'Đơn đặt sân của bạn đã được xác nhận. Vui lòng lưu mã đơn để check-in tại sân.'
            : message || 'Giao dịch thanh toán chưa được hoàn tất hoặc đã bị huỷ.'}
        </p>

        {/* Mã đơn — dữ liệu kỹ thuật hiển thị bằng font-score */}
        {bookingCode ? (
          <div className="mt-6 space-y-1 rounded-xl border border-border/60 bg-muted/50 px-4 py-4">
            <p className="font-score text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Mã đơn đặt sân
            </p>
            <p className="font-score text-xl font-bold tracking-wide text-primary">{bookingCode}</p>
          </div>
        ) : null}

        {isSuccess ? (
          <div className="mt-4 space-y-1.5 rounded-xl border border-primary/20 bg-accent/60 p-4 text-left text-xs leading-relaxed text-accent-foreground">
            <p className="flex items-center gap-1.5 font-semibold">
              <QrCode className="size-4" aria-hidden /> Hướng dẫn check-in
            </p>
            <p>1. Đến sân trước giờ chơi 10–15 phút.</p>
            <p>
              2. Đưa mã đơn hoặc mã QR trong mục <strong>Đơn của tôi</strong> cho chủ sân.
            </p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          {isSuccess ? (
            <>
              <Button
                asChild
                className="w-full rounded-lg font-bold shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_12px_30px_rgba(15,23,42,0.1)]"
              >
                <Link to="/dashboard/my-bookings">
                  <Calendar aria-hidden /> Xem đơn của tôi
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-lg font-bold">
                <Link to="/venues">
                  <Home aria-hidden /> Trang chủ
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                className="w-full rounded-lg font-bold shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_12px_30px_rgba(15,23,42,0.1)]"
              >
                <Link to="/venues">
                  <ArrowRight aria-hidden /> Đặt lại sân
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-lg font-bold">
                <Link to="/dashboard/my-bookings">Xem đơn đã đặt</Link>
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
