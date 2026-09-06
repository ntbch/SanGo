import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBookingHoldApi,
  applyHoldVoucherApi,
  createCheckoutApi,
  releaseBookingHoldApi,
} from '../api/booking-api';
import { HoldTimer } from '../components/hold-timer';
import { CheckoutVoucherPicker } from '../components/checkout-voucher-picker';
import { CheckoutPaymentMethods } from '../components/checkout-payment-methods';
import { CheckoutOrderSummary } from '../components/checkout-order-summary';
import { CheckoutAddOnsPicker } from '../components/checkout-addons-picker';
import { updateHoldAddOnsApi } from '../../venues/api/venue-services-api';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { EmptyState } from '../../../components/feedback';
import { formatMinutesToTime } from '../../../lib/utils';
import { SportType, SPORT_LABELS } from '../../../lib/constants';

export function CheckoutHoldPage(): React.ReactElement {
  const { holdId } = useParams<{ holdId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [voucherCode, setVoucherCode] = React.useState('');
  const [voucherError, setVoucherError] = React.useState<string | null>(null);
  const [voucherSuccess, setVoucherSuccess] = React.useState<string | null>(null);
  const [paymentType, setPaymentType] = React.useState<'DEPOSIT' | 'FULL'>('DEPOSIT');
  const [paymentGateway, setPaymentGateway] = React.useState<'WALLET' | 'VNPAY'>('VNPAY');
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);

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
      setVoucherSuccess(`Đã áp dụng mã thành công! Giảm ${data.discountAmount?.toLocaleString('vi-VN') || '50.000'} đ`);
      setVoucherError(null);
      refetch();
    },
    onError: (err: any) => {
      setVoucherError(err.message || 'Mã giảm giá không áp dụng được cho khung giờ này');
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
      if (data.mode === 'mock') {
        navigate(
          `/checkout/payment?mode=mock&txnRef=${encodeURIComponent(data.txnRef)}&amount=${data.amount}&holdId=${holdId}`,
        );
        return;
      }
      window.location.href = data.paymentUrl;
    },
    onError: (err: any) => {
      setCheckoutError(err.message || 'Không thể khởi tạo thanh toán. Vui lòng thử lại.');
    },
  });

  const releaseMutation = useMutation({
    mutationFn: releaseBookingHoldApi,
    onSuccess: () => {
      queryClient.setQueryData(['active-booking-hold'], null);
      navigate('/venues');
    },
    onError: (err: any) => setCheckoutError(err.message || 'Không thể hủy giữ chỗ. Vui lòng thử lại.'),
  });

  const addOnsMutation = useMutation({
    mutationFn: (items: { serviceId: string; quantity: number }[]) =>
      updateHoldAddOnsApi(holdId || '', items),
    onSuccess: () => {
      refetch();
    },
    onError: (err: any) => {
      setCheckoutError(err?.message || 'Không thể cập nhật dịch vụ đi kèm');
    },
  });

  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !hold) {
    return (
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-16 max-w-2xl mx-auto">
        <EmptyState
          title="Không tìm thấy phiên giữ chỗ"
          description="Phiên giữ chỗ này có thể đã hết hạn hoặc đã được thanh toán hoàn tất. Vui lòng quay lại tìm và chọn khung giờ khác."
          actionLabel="Tìm sân ngay"
          onAction={() => navigate('/venues')}
        />
      </div>
    );
  }

  const subtotal = hold.subtotal || 250000;
  const discount = hold.discountAmount || 0;
  const finalTotal = hold.finalAmount ?? Math.max(0, subtotal - discount);
  const depositPercent = hold.depositPercent ?? hold.court?.venue?.depositPercent ?? 30;
  const depositAmount = Math.round((finalTotal * depositPercent) / 100);
  const amountToPay = paymentType === 'FULL' ? finalTotal : depositAmount;

  const venueId = hold.venueId || hold.court?.venue?.id || '';
  const selectedAddOns = Array.isArray(hold?.addOns)
    ? (hold.addOns as any[]).map((i: any) => ({
        serviceId: i.serviceId,
        quantity: i.quantity,
      }))
    : [];
  const addOnsTotal = Array.isArray(hold?.addOns)
    ? (hold.addOns as any[]).reduce((sum: number, item: any) => sum + (item.unitPrice || 0) * (item.quantity || 0), 0)
    : (hold?.addOnsTotal || 0);
  const courtSubtotal = hold?.courtSubtotal ?? (subtotal - addOnsTotal);

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">
        {/* Left column (60%): 3 of 5 columns */}
        <div className="lg:col-span-3 space-y-6">
          {/* Dải đếm ngược HoldTimer trên cùng */}
          <HoldTimer
            expiresAt={hold.expiresAt}
            onExpire={() => {
              refetch();
            }}
          />

          {/* Card chi tiết suất sân đã giữ */}
          <Card className="p-5 border border-border bg-card space-y-4 shadow-none">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">Chi Tiết Đơn Đặt Sân</h3>
                <p className="text-xs text-muted-foreground">Thông tin suất sân đang được giữ cho bạn</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={releaseMutation.isPending || hold.status !== 'ACTIVE'}
                onClick={() => releaseMutation.mutate(hold.id)}
                className="text-xs h-8 font-medium border-border hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive active:scale-[0.98] transition-all"
              >
                {releaseMutation.isPending ? 'Đang hủy...' : 'Hủy giữ chỗ'}
              </Button>
            </div>

            <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2.5 text-xs">
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
                <span className="text-muted-foreground">Môn thi đấu:</span>
                <span className="font-medium text-foreground">
                  {SPORT_LABELS[hold.court?.sportType as SportType] || hold.court?.sportType || 'Thể thao'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ngày:</span>
                <span className="font-medium text-foreground">
                  {new Date(hold.date).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Khung giờ:</span>
                <span className="font-mono-num font-bold text-primary tabular-nums">
                  {formatMinutesToTime(hold.startMinute)} - {formatMinutesToTime(hold.endMinute)}
                </span>
              </div>
            </div>
          </Card>

          {/* Dịch vụ thêm */}
          {venueId && (
            <CheckoutAddOnsPicker
              venueId={venueId}
              selectedItems={selectedAddOns}
              onChange={(items) => {
                addOnsMutation.mutate(items);
              }}
              disabled={addOnsMutation.isPending || hold.status !== 'ACTIVE'}
            />
          )}

          {/* Voucher */}
          <CheckoutVoucherPicker
            voucherCode={voucherCode}
            onVoucherCodeChange={setVoucherCode}
            isApplied={Boolean(hold.voucherId)}
            isPending={voucherMutation.isPending}
            voucherSuccess={voucherSuccess}
            voucherError={voucherError}
            onApplyVoucher={handleApplyVoucher}
          />

          {/* Phương thức thanh toán */}
          <CheckoutPaymentMethods
            paymentType={paymentType}
            onPaymentTypeChange={setPaymentType}
            depositPercent={depositPercent}
            depositAmount={depositAmount}
            finalTotal={finalTotal}
            paymentGateway={paymentGateway}
            onPaymentGatewayChange={(gateway) => {
              setPaymentGateway(gateway);
              setCheckoutError(null);
            }}
          />
        </div>

        {/* Right column (40%): 2 of 5 columns (sticky) */}
        <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-24">
          <CheckoutOrderSummary
            subtotal={subtotal}
            courtSubtotal={courtSubtotal}
            addOnsTotal={addOnsTotal}
            discount={discount}
            finalTotal={finalTotal}
            depositPercent={depositPercent}
            amountToPay={amountToPay}
            paymentType={paymentType}
            isPending={checkoutMutation.isPending}
            isActive={hold.status === 'ACTIVE'}
            onCheckout={() => {
              setCheckoutError(null);
              if (paymentGateway === 'WALLET') {
                setCheckoutError('Ví SanGo chưa hỗ trợ thanh toán đặt sân. Vui lòng chọn VNPAY.');
                return;
              }
              checkoutMutation.mutate({ holdId: hold.id, type: paymentType });
            }}
          />
          {checkoutError && (
            <p className="text-xs font-medium text-destructive px-1">{checkoutError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
