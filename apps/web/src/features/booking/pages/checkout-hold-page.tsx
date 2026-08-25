import { useState, type ReactElement } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { CreditCard, Loader2, ShieldCheck, AlertCircle, TicketPercent, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/skeleton';
import { useToast } from '../../../components/ui/use-toast';
import { formatVnd, minutesToTime } from '../../public/format';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { CountdownTimer } from '../components/countdown-timer';
import {
  useApplyVoucher,
  useBookingHold,
  useCheckoutPayment,
  useDeleteBookingHold,
} from '../queries';
import type { ApplyVoucherResponse } from '../types';

export function CheckoutHoldPage(): ReactElement {
  const { holdId = '' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const holdQuery = useBookingHold(holdId);
  const checkoutMutation = useCheckoutPayment();
  const deleteHoldMutation = useDeleteBookingHold();

  const [paymentType, setPaymentType] = useState<'DEPOSIT' | 'FULL'>('DEPOSIT');
  const [isExpired, setIsExpired] = useState(false);
  // F3 voucher: ô nhập mã + thông tin áp thành công (giá đã snapshot vào hold).
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedInfo, setAppliedInfo] = useState<ApplyVoucherResponse | undefined>(undefined);
  const applyVoucher = useApplyVoucher(holdId);

  const hold = holdQuery.data;

  // Giá ưu tiên snapshot sau giảm (finalAmount); chưa áp mã thì bằng subtotal.
  const baseAmount = hold ? (hold.finalAmount ?? appliedInfo?.finalAmount ?? hold.subtotal) : 0;
  const discountAmount = hold?.discountAmount ?? appliedInfo?.discountAmount ?? 0;
  const hasDiscount = discountAmount > 0;
  const appliedCode = appliedInfo?.code;
  const depositAmount = Math.round((baseAmount * (hold?.depositPercent ?? 30)) / 100);
  const payAmount = paymentType === 'DEPOSIT' ? depositAmount : baseAmount;
  const remainingAmount = baseAmount - depositAmount;

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
              {hasDiscount ? (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Giảm giá{appliedCode ? ' (' + appliedCode + ')' : ''}:</span>
                  <span className="font-semibold">−{formatVnd(discountAmount)}</span>
                </div>
              ) : null}
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
                  <div className="text-primary font-bold">{formatVnd(baseAmount)}</div>
                  <div className="text-muted-foreground text-[11px]">
                    Không cần thanh toán thêm tại sân
                  </div>
                </div>
              </label>
            </div>

            {/* F3: Áp mã giảm giá vào hold — hiển thị ngay trên nút thanh toán */}
            <div className="space-y-2 rounded-lg border border-border/60 p-3">
              {hasDiscount ? (
                <div className="flex items-start gap-2 text-xs">
                  <TicketPercent className="mt-0.5 size-4 text-primary" aria-hidden />
                  <div>
                    <p className="font-semibold">Đã áp mã {appliedCode ?? ''}</p>
                    <p className="text-muted-foreground">
                      Giảm {formatVnd(discountAmount)} — cần trả {formatVnd(baseAmount)}.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <label htmlFor="voucher-code" className="text-xs font-semibold">
                    Mã giảm giá
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="voucher-code"
                      value={voucherCode}
                      onChange={(event) => setVoucherCode(event.target.value.toUpperCase())}
                      placeholder="VD: MUA50"
                      disabled={isExpired || applyVoucher.isPending}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 font-semibold"
                      disabled={!voucherCode.trim() || isExpired || applyVoucher.isPending}
                      onClick={() =>
                        applyVoucher.mutate(voucherCode.trim(), {
                          onSuccess: (res) => {
                            setAppliedInfo(res);
                            toast({
                              title: 'Áp mã thành công',
                              description:
                                'Giảm ' +
                                formatVnd(res.discountAmount) +
                                ' — cần trả ' +
                                formatVnd(res.finalAmount) +
                                '.',
                            });
                          },
                          onError: (err) =>
                            toast({
                              variant: 'destructive',
                              title: 'Không áp dụng được mã',
                              description: friendlyApiMessage(err),
                            }),
                        })
                      }
                    >
                      Áp dụng
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Mã áp cho khung giờ thấp điểm của sân này.
                  </p>
                </>
              )}
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
