import { useState, type ReactElement } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { CreditCard, Loader2, ShieldCheck, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { useToast } from '../../../components/ui/use-toast';
import { formatVnd, minutesToTime } from '../../public/format';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { CountdownTimer } from '../components/countdown-timer';
import { useBookingHold, useCheckoutPayment, useDeleteBookingHold } from '../queries';

export function CheckoutHoldPage(): ReactElement {
  const { holdId = '' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const holdQuery = useBookingHold(holdId);
  const checkoutMutation = useCheckoutPayment();
  const deleteHoldMutation = useDeleteBookingHold();

  const [paymentType, setPaymentType] = useState<'DEPOSIT' | 'FULL'>('DEPOSIT');
  const [isExpired, setIsExpired] = useState(false);

  const hold = holdQuery.data;

  const depositAmount = hold ? Math.round((hold.subtotal * hold.depositPercent) / 100) : 0;
  const payAmount = paymentType === 'DEPOSIT' ? depositAmount : (hold?.subtotal ?? 0);
  const remainingAmount = (hold?.subtotal ?? 0) - depositAmount;

  const handlePay = async () => {
    if (!hold || isExpired) return;

    try {
      const res = await checkoutMutation.mutateAsync({
        holdId: hold.id,
        type: paymentType,
      });

      // Nếu có paymentUrl (VNPay hoặc mock callback endpoint)
      if (res.mode === 'mock') {
        // Trong mock mode, gọi thẳng API callback hoặc mở paymentUrl
        window.location.href = res.paymentUrl;
      } else if (res.paymentUrl) {
        // VNPay sandbox
        window.location.href = res.paymentUrl;
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Thanh toán thất bại',
        description: friendlyApiMessage(err),
      });
    }
  };

  const handleCancelHold = async () => {
    if (!hold) return;
    if (!window.confirm('Bạn có chắc chắn muốn huỷ giữ chỗ này không?')) return;

    try {
      await deleteHoldMutation.mutateAsync(hold.id);
      toast({ title: 'Đã huỷ giữ chỗ' });
      navigate(-1);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Huỷ giữ chỗ thất bại',
        description: friendlyApiMessage(err),
      });
    }
  };

  if (holdQuery.isPending) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-12" aria-busy="true">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (holdQuery.isError || !hold) {
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-4">
        <AlertCircle className="size-12 text-destructive mx-auto" />
        <h2 className="text-lg font-bold">Không tìm thấy thông tin giữ chỗ</h2>
        <p className="text-sm text-muted-foreground">
          Đơn giữ chỗ có thể đã hết hạn hoặc không tồn tại.
        </p>
        <Button asChild variant="outline">
          <Link to="/venues">Về danh sách sân</Link>
        </Button>
      </div>
    );
  }

  const sortedSlots = [...hold.slots].sort((a, b) => a.startMinute - b.startMinute);
  const startMin = sortedSlots[0]?.startMinute ?? 0;
  const endMin = sortedSlots[sortedSlots.length - 1]?.endMinute ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Đồng hồ đếm ngược 10 phút */}
      <CountdownTimer expiresAt={hold.expiresAt} onExpire={() => setIsExpired(true)} />

      <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
        {/* Chi tiết đơn */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Thông tin đơn đặt sân</CardTitle>
            <CardDescription>Mã giữ chỗ: #{hold.id.slice(0, 8)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1 border-b pb-3">
              <p className="font-semibold text-base">{hold.venueName ?? 'Cụm sân'}</p>
              <p className="text-muted-foreground">Sân: {hold.courtName ?? 'Sân con'}</p>
            </div>

            <div className="space-y-1 border-b pb-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngày chơi:</span>
                <span className="font-medium">{hold.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Khung giờ:</span>
                <span className="font-medium">
                  {minutesToTime(startMin)} – {minutesToTime(endMin)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số lượng slot:</span>
                <span className="font-medium">{hold.slots.length} slot</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng tiền sân:</span>
                <span className="font-semibold">{formatVnd(hold.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mức cọc yêu cầu ({hold.depositPercent}%):</span>
                <span>{formatVnd(depositAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tuỳ chọn thanh toán */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg">Hình thức thanh toán</CardTitle>
            <CardDescription>Chọn thanh toán cọc hoặc toàn bộ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/30">
                <input
                  type="radio"
                  name="paymentType"
                  value="DEPOSIT"
                  checked={paymentType === 'DEPOSIT'}
                  onChange={() => setPaymentType('DEPOSIT')}
                  className="text-primary"
                />
                <div className="text-xs flex-1">
                  <div className="font-semibold text-sm">Đặt cọc ({hold.depositPercent}%)</div>
                  <div className="text-primary font-bold">{formatVnd(depositAmount)}</div>
                  <div className="text-muted-foreground text-[11px]">
                    Còn lại {formatVnd(remainingAmount)} trả tại sân
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/30">
                <input
                  type="radio"
                  name="paymentType"
                  value="FULL"
                  checked={paymentType === 'FULL'}
                  onChange={() => setPaymentType('FULL')}
                  className="text-primary"
                />
                <div className="text-xs flex-1">
                  <div className="font-semibold text-sm">Thanh toán toàn bộ (100%)</div>
                  <div className="text-primary font-bold">{formatVnd(hold.subtotal)}</div>
                  <div className="text-muted-foreground text-[11px]">
                    Không cần thanh toán thêm tại sân
                  </div>
                </div>
              </label>
            </div>

            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <ShieldCheck className="size-4 text-primary" />
                <span>Cổng thanh toán an toàn</span>
              </div>
              <p>VNPay Sandbox / Giả lập thanh toán tức thì theo chế độ.</p>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                className="w-full font-bold"
                size="lg"
                disabled={isExpired || checkoutMutation.isPending}
                onClick={() => {
                  void handlePay();
                }}
              >
                {checkoutMutation.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 size-4" />
                )}
                Thanh toán {formatVnd(payAmount)}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-destructive hover:text-destructive"
                disabled={deleteHoldMutation.isPending}
                onClick={() => {
                  void handleCancelHold();
                }}
              >
                <Trash2 className="mr-1 size-3.5" /> Huỷ giữ chỗ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
