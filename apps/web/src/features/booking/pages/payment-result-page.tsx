import { type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, Check, Home, RotateCcw, X, ShieldCheck } from 'lucide-react';

import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { generateQrSvg } from '../../../lib/qrcode';
import { formatVnd } from '../../public/format';

/** Trang kết quả thanh toán — chuẩn UI/UX Pro-Max với Match Pass Ticket + QR Check-in. */
export function PaymentResultPage(): ReactElement {
  const [searchParams] = useSearchParams();

  const status =
    searchParams.get('status') ||
    (searchParams.get('vnp_ResponseCode') === '00' ? 'SUCCESS' : 'FAILED');
  const bookingCode =
    searchParams.get('code') || searchParams.get('txnRef') || searchParams.get('vnp_TxnRef') || '';
  const message = searchParams.get('message') || '';
  const amountStr = searchParams.get('amount') || searchParams.get('vnp_Amount');
  const amount = amountStr
    ? amountStr.length > 6 && amountStr.endsWith('00') && !amountStr.includes('.')
      ? Number(amountStr) / 100
      : Number(amountStr)
    : null;

  const isSuccess = status === 'SUCCESS' || status === '00';
  const isAddOn = searchParams.get('type') === 'ADD_ON';

  return (
    <div className="mx-auto w-full max-w-xl py-6">
      <Card className="overflow-hidden rounded-2xl border-border/60 p-6 text-center shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:p-10 bg-card">
        {/* Animated Checkmark / Failure Icon */}
        <div className="flex justify-center">
          {isSuccess ? (
            <div className="relative flex size-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <span className="absolute size-full animate-ping rounded-full bg-emerald-500/20 duration-1000" />
              <div className="relative flex size-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                <Check className="size-8 stroke-[3]" aria-hidden />
              </div>
            </div>
          ) : (
            <div className="relative flex size-20 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <div className="flex size-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md">
                <X className="size-8 stroke-[3]" aria-hidden />
              </div>
            </div>
          )}
        </div>

        <h1
          className={`mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl ${
            isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
          }`}
        >
          {isSuccess
            ? isAddOn
              ? 'Thanh toán dịch vụ thành công!'
              : 'Đặt sân thành công!'
            : 'Thanh toán không thành công'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {isSuccess
            ? isAddOn
              ? 'Dịch vụ đi kèm đã được xác nhận vào đơn. Bạn có thể xem chi tiết trong mục Đơn đặt sân.'
              : 'Đơn đặt sân của bạn đã được xác nhận. Vui lòng lưu mã đơn hoặc quét QR bên dưới khi đến sân.'
            : message || 'Giao dịch thanh toán chưa được hoàn tất hoặc đã bị huỷ bởi người dùng.'}
        </p>

        {/* Thông tin đơn và QR code check-in khi thành công */}
        {isSuccess && bookingCode ? (
          <div className="mt-6 space-y-4 rounded-xl border border-border/60 bg-muted/40 p-5 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="rounded-xl border border-border/80 bg-white p-3 shadow-xs text-slate-900">
                <div
                  dangerouslySetInnerHTML={{
                    __html: generateQrSvg(bookingCode, 160),
                  }}
                />
              </div>
              <div className="mt-3 font-score text-xl font-extrabold tracking-widest text-primary">
                <span>{bookingCode}</span>
              </div>
              {amount && !isNaN(amount) && amount > 0 ? (
                <div className="text-xs text-muted-foreground mt-1">
                  Đã thanh toán: <strong className="text-foreground font-score">{formatVnd(amount)}</strong>
                </div>
              ) : null}
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-background p-3 text-left text-xs text-muted-foreground border border-border/60">
              <ShieldCheck className="size-4 shrink-0 text-primary mt-0.5" aria-hidden />
              <div>
                <p className="font-semibold text-foreground">Hướng dẫn nhận sân:</p>
                <p>Đến sân trước 10-15 phút và xuất trình mã QR này cho quản lý sân để check-in.</p>
              </div>
            </div>
          </div>
        ) : !isSuccess && bookingCode ? (
          <div className="mt-6 rounded-xl border border-border/60 bg-muted/40 p-4 text-xs font-score text-muted-foreground">
            Mã giao dịch: <span className="font-bold text-foreground">{bookingCode}</span>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {isSuccess ? (
            <>
              <Button asChild className="rounded-xl font-bold shadow-xs">
                <Link to="/bookings" className="gap-2">
                  <Calendar className="size-4" />
                  Xem đơn của tôi
                </Link>
              </Button>
              <Button variant="outline" asChild className="rounded-xl font-bold">
                <Link to="/" className="gap-2">
                  <Home className="size-4" />
                  Trang chủ
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="rounded-xl font-bold shadow-xs">
                <Link to="/venues" className="gap-2">
                  <RotateCcw className="size-4" />
                  Chọn giờ khác
                </Link>
              </Button>
              <Button variant="outline" asChild className="rounded-xl font-bold">
                <Link to="/bookings" className="gap-2">
                  <Calendar className="size-4" />
                  Xem đơn của tôi
                </Link>
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
