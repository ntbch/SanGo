import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, QrCode, ShieldCheck, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { formatVND } from '../../../lib/utils';
import { confirmMockPaymentApi } from '../api/booking-api';

export function PaymentPendingPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const txnRef = searchParams.get('txnRef') ?? '';
  const amount = Number(searchParams.get('amount')) || 0;
  const mode = searchParams.get('mode');
  const holdId = searchParams.get('holdId');
  const isMock = mode === 'mock';
  const qrData = `SANGO|${txnRef}|${amount}`;

  const confirmMutation = useMutation({
    mutationFn: () => confirmMockPaymentApi(txnRef, amount),
    onSuccess: (result) => {
      navigate(
        `/payment/result?status=SUCCESS&txnRef=${encodeURIComponent(result.txnRef ?? txnRef)}&amount=${amount}`,
        { replace: true },
      );
    },
  });

  if (!txnRef || amount <= 0 || !isMock) {
    return (
      <div className="w-full px-4 py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <XCircle className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-black text-foreground">Không tìm thấy giao dịch chờ thanh toán</h1>
        <p className="text-sm text-muted-foreground">quay lại giữ chỗ để tạo giao dịch.</p>
        <Link to={holdId ? `/checkout/hold/${holdId}` : '/venues'}>
          <Button>Quay lại</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8 sm:py-12 max-w-md mx-auto">
      <Card className="p-5 sm:p-7 border border-border/80 bg-card space-y-6 shadow-xl shadow-primary/5">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <QrCode className="h-7 w-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">Quét mã QR để thanh toán</h1>
          <p className="text-xs text-muted-foreground">Mở app ngân hàng, quét mã, hoàn tất.</p>
        </div>

        <div className="rounded-3xl bg-white p-4 mx-auto w-fit shadow-inner">
          <img
            alt="Mã QR thanh toán"
            className="h-52 w-52 rounded-xl"
            src={`https://api.qrserver.com/v1/create-qr-code/?size=208x208&data=${encodeURIComponent(qrData)}`}
          />
        </div>

        <div className="rounded-2xl border border-border/70 bg-secondary/35 px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Số tiền thanh toán</span>
            <span className="font-mono-num font-black text-primary">{formatVND(amount)}</span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground break-all">Mã giao dịch: {txnRef}</p>
        </div>

        {confirmMutation.error && (
          <p className="text-xs font-medium text-destructive">
            {(confirmMutation.error as Error).message || 'Không thể xác nhận giao dịch. thử lại.'}
          </p>
        )}

        <Button
          size="lg"
          className="w-full font-bold gap-2"
          onClick={() => confirmMutation.mutate()}
          disabled={confirmMutation.isPending}
        >
          <CheckCircle2 className="h-4 w-4" />
          {confirmMutation.isPending ? 'Đang xác nhận...' : 'Tôi đã quét mã'}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Đơn chỉ được xác nhận sau khi thanh toán được ghi nhận.
        </p>
      </Card>
    </div>
  );
}
