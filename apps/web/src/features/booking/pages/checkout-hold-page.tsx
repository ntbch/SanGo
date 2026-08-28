import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getBookingHoldApi,
  applyHoldVoucherApi,
  createCheckoutApi,
} from '../api/booking-api';
import { HoldTimer } from '../components/hold-timer';
import { CheckoutVoucherPicker } from '../components/checkout-voucher-picker';
import { CheckoutPaymentMethods } from '../components/checkout-payment-methods';
import { CheckoutOrderSummary } from '../components/checkout-order-summary';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { formatMinutesToTime, formatVND } from '../../../lib/utils';
import { XCircle } from 'lucide-react';

export function CheckoutHoldPage(): React.ReactElement {
  const { holdId } = useParams<{ holdId: string }>();
  const [voucherCode, setVoucherCode] = React.useState('');
  const [voucherError, setVoucherError] = React.useState<string | null>(null);
  const [voucherSuccess, setVoucherSuccess] = React.useState<string | null>(null);
  const [paymentType, setPaymentType] = React.useState<'DEPOSIT' | 'FULL'>('DEPOSIT');
  const [paymentGateway, setPaymentGateway] = React.useState<'WALLET' | 'VNPAY'>('WALLET');

  const { data: hold, isLoading, isError, refetch } = useQuery({
    queryKey: ['booking-hold', holdId],
    queryFn: () => getBookingHoldApi(holdId || ''),
    enabled: Boolean(holdId),
    refetchInterval: 10000,
  });

  const voucherMutation = useMutation({
    mutationFn: ({ holdId, code }: { holdId: string; code: string }) =>
      applyHoldVoucherApi(holdId, code),
    onSuccess: (data) => {
      setVoucherSuccess(`Đã áp dụng mã thành công! Giảm ${formatVND(data.discountAmount || 50000)}`);
      setVoucherError(null);
      refetch();
    },
    onError: (err: any) => {
      setVoucherError(err.message || 'Mã giảm giá không hợp lệ hoặc không áp dụng cho khung giờ này');
      setVoucherSuccess(null);
    },
  });

  const handleApplyVoucher = (codeToApply?: string) => {
    const code = (codeToApply || voucherCode).trim().toUpperCase();
    if (!code || !holdId) return;
    setVoucherCode(code);
    voucherMutation.mutate({ holdId, code });
  };

  const checkoutMutation = useMutation({
    mutationFn: createCheckoutApi,
    onSuccess: (data) => {
      window.location.href = data.paymentUrl;
    },
  });

  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !hold) {
    return (
      <div className="w-full px-4 py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <XCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Không tìm thấy phiên giữ chỗ</h2>
        <p className="text-xs text-muted-foreground">
          Phiên giữ chỗ này có thể đã hết hạn hoặc đã được thanh toán hoàn tất.
        </p>
        <Link to="/venues">
          <Button size="sm">Đặt lại sân</Button>
        </Link>
      </div>
    );
  }

  const subtotal = hold.subtotal || 250000;
  const discount = hold.discountAmount || 0;
  const finalTotal = hold.finalAmount ?? Math.max(0, subtotal - discount);
  const depositPercent = hold.depositPercent ?? hold.court?.venue?.depositPercent ?? 30;
  const depositAmount = Math.round((finalTotal * depositPercent) / 100);
  const amountToPay = paymentType === 'FULL' ? finalTotal : depositAmount;

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 space-y-6 max-w-4xl mx-auto">
      {/* 1. 10:00 Hold Countdown Timer */}
      <HoldTimer
        expiresAt={hold.expiresAt}
        onExpire={() => {
          refetch();
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Order Details & Payment Method */}
        <div className="md:col-span-2 space-y-6">
          {/* Booking Summary */}
          <Card className="p-5 border border-border/80 bg-card space-y-4">
            <h3 className="text-sm font-bold text-foreground">Chi Tiết Đơn Đặt Sân</h3>

            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/50 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cụm sân:</span>
                <span className="font-bold text-foreground">
                  {hold.venueName || hold.court?.venue?.name || 'Cụm sân'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sân con:</span>
                <span className="font-bold text-foreground">
                  {hold.courtName || hold.court?.name || 'Sân con'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Thời gian:</span>
                <span className="font-mono-num font-bold text-primary">
                  {formatMinutesToTime(hold.startMinute)} - {formatMinutesToTime(hold.endMinute)} ({new Date(hold.date).toLocaleDateString('vi-VN')})
                </span>
              </div>
            </div>
          </Card>

          <CheckoutPaymentMethods
            paymentType={paymentType}
            onPaymentTypeChange={setPaymentType}
            depositPercent={depositPercent}
            depositAmount={depositAmount}
            finalTotal={finalTotal}
            paymentGateway={paymentGateway}
            onPaymentGatewayChange={setPaymentGateway}
          />

          <CheckoutVoucherPicker
            voucherCode={voucherCode}
            onVoucherCodeChange={setVoucherCode}
            isApplied={Boolean(hold.voucherId)}
            isPending={voucherMutation.isPending}
            voucherSuccess={voucherSuccess}
            voucherError={voucherError}
            onApplyVoucher={handleApplyVoucher}
          />
        </div>

        {/* Right 1 Column: Cost Breakdown & Checkout CTA */}
        <div className="md:col-span-1 space-y-4">
          <CheckoutOrderSummary
            subtotal={subtotal}
            discount={discount}
            finalTotal={finalTotal}
            depositPercent={depositPercent}
            amountToPay={amountToPay}
            paymentType={paymentType}
            isPending={checkoutMutation.isPending}
            isActive={hold.status === 'ACTIVE'}
            onCheckout={() => checkoutMutation.mutate({ holdId: hold.id, type: paymentType })}
          />
        </div>
      </div>
    </div>
  );
}
