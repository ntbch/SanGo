import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Star, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { useToast } from '../../../components/ui/use-toast';
import { cn } from '../../../lib/utils';
import { formatVnd, minutesToTime } from '../../public/format';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { StarRating } from '../../public/components/star-rating';
import {
  useCancelCustomerBooking,
  useMyBookings,
  useRefundPreview,
  useSubmitBookingReview,
} from '../queries';
import type { CustomerBooking } from '../types';

type TabFilter = 'upcoming' | 'history' | 'cancelled';

const TAB_LABELS: Record<TabFilter, string> = {
  upcoming: 'Sắp chơi',
  history: 'Lịch sử',
  cancelled: 'Đã huỷ',
};

const STATUS_BADGES: Record<
  CustomerBooking['status'],
  { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }
> = {
  CONFIRMED: { label: 'Đã xác nhận', variant: 'success' },
  CHECKED_IN: { label: 'Đã check-in', variant: 'secondary' },
  COMPLETED: { label: 'Hoàn tất', variant: 'success' },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', variant: 'warning' },
  CANCELLED: { label: 'Đã huỷ', variant: 'destructive' },
  NO_SHOW: { label: 'Không đến', variant: 'destructive' },
};

export function MyCustomerBookingsPage(): ReactElement {
  const [tab, setTab] = useState<TabFilter>('upcoming');
  const { toast } = useToast();

  const bookingsQuery = useMyBookings({ filter: tab, page: 1 });
  const cancelMutation = useCancelCustomerBooking();
  const reviewMutation = useSubmitBookingReview();

  // Modal Hủy Đơn
  const [cancelTarget, setCancelTarget] = useState<CustomerBooking | undefined>(undefined);
  const [cancelReason, setCancelReason] = useState('');
  const refundQuery = useRefundPreview(cancelTarget?.id);

  // Modal Đánh Giá (Review)
  const [reviewTarget, setReviewTarget] = useState<CustomerBooking | undefined>(undefined);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const bookings = bookingsQuery.data?.items ?? [];

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelMutation.mutateAsync({
        bookingId: cancelTarget.id,
        reason: cancelReason.trim() || undefined,
      });
      toast({ title: 'Hủy đơn thành công' });
      setCancelTarget(undefined);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Hủy đơn thất bại',
        description: friendlyApiMessage(err),
      });
    }
  };

  const handleConfirmReview = async () => {
    if (!reviewTarget) return;
    try {
      await reviewMutation.mutateAsync({
        bookingId: reviewTarget.id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      toast({ title: 'Cảm ơn bạn đã gửi đánh giá!' });
      setReviewTarget(undefined);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Đánh giá thất bại',
        description: friendlyApiMessage(err),
      });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Đơn đặt sân của tôi</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi các trận đấu sắp diễn ra, lịch sử chơi và đánh giá.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/venues">Đặt sân mới +</Link>
        </Button>
      </header>

      {/* Tabs filter */}
      <div className="flex w-fit gap-1.5 rounded-lg bg-muted p-1">
        {(Object.keys(TAB_LABELS) as TabFilter[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-sm font-medium transition',
              tab === key
                ? 'bg-background shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Danh sách đơn */}
      {bookingsQuery.isPending ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : bookingsQuery.isError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {friendlyApiMessage(bookingsQuery.error)}
        </p>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center space-y-3">
          <Calendar className="size-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">Không có đơn đặt sân nào trong mục này.</p>
          <Button asChild variant="outline" size="sm">
            <Link to="/venues">Khám phá sân ngay</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const badge = STATUS_BADGES[b.status] ?? { label: b.status, variant: 'secondary' };
            const canCancel = b.status === 'CONFIRMED';
            const canReview = b.status === 'COMPLETED' && !b.hasReviewed;

            return (
              <Card key={b.id}>
                <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-primary">{b.code}</span>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-base">
                        {b.venueName} · {b.courtName}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="size-3.5" /> {b.date} ·{' '}
                        <Clock className="size-3.5 ml-1" /> {minutesToTime(b.startMinute)} –{' '}
                        {minutesToTime(b.endMinute)}
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground pt-1">
                      <span>
                        Đã thanh toán: <strong>{formatVnd(b.amountPaid)}</strong>
                      </span>
                      {b.paymentType === 'DEPOSIT' ? (
                        <span className="ml-2">
                          (Cọc {b.depositPercent}% · Còn lại trả tại sân)
                        </span>
                      ) : (
                        <span className="ml-2">(Đã trả đủ 100%)</span>
                      )}
                    </div>

                    {b.review ? (
                      <div className="rounded-md bg-muted/50 p-2.5 text-xs space-y-1 mt-2">
                        <div className="flex items-center gap-1 font-semibold">
                          <span>Đánh giá của bạn:</span>
                          <StarRating value={b.review.rating} />
                        </div>
                        {b.review.comment ? (
                          <p className="text-muted-foreground italic">“{b.review.comment}”</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col sm:flex-row gap-2 self-center sm:self-start">
                    {canCancel ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          setCancelTarget(b);
                          setCancelReason('');
                        }}
                      >
                        Huỷ đơn
                      </Button>
                    ) : null}

                    {canReview ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReviewTarget(b);
                          setReviewRating(5);
                          setReviewComment('');
                        }}
                      >
                        <Star className="mr-1 size-3.5 fill-amber-400 text-amber-400" /> Đánh giá
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Hủy Đơn với Mức hoàn dự kiến RefundPreview */}
      <Dialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(undefined);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Huỷ đơn đặt sân {cancelTarget?.code}</DialogTitle>
            <DialogDescription>
              Chính sách hoàn tiền: &gt;24h hoàn 100% · 12–24h hoàn 50% · &lt;12h không hoàn.
            </DialogDescription>
          </DialogHeader>

          {refundQuery.isPending ? (
            <Skeleton className="h-20 w-full" />
          ) : refundQuery.data ? (
            <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thời gian tới giờ chơi:</span>
                <span className="font-medium">~{refundQuery.data.hoursUntilMatch} giờ</span>
              </div>
              <div className="flex justify-between font-semibold text-sm pt-1 border-t">
                <span>Mức hoàn dự kiến ({refundQuery.data.refundPercent}%):</span>
                <span className="text-primary font-bold">
                  {formatVnd(refundQuery.data.refundAmount)}
                </span>
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label htmlFor="cancel-reason" className="text-xs font-medium text-muted-foreground">
              Lý do huỷ (không bắt buộc):
            </label>
            <textarea
              id="cancel-reason"
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="vd: Bận việc đột xuất..."
              className="w-full rounded-md border border-input bg-background p-2 text-xs"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelTarget(undefined)}>
              Giữ đơn
            </Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => {
                void handleConfirmCancel();
              }}
            >
              {cancelMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Xác nhận huỷ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Đánh Giá Trận Đấu */}
      <Dialog
        open={Boolean(reviewTarget)}
        onOpenChange={(open) => {
          if (!open) setReviewTarget(undefined);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đánh giá sân {reviewTarget?.venueName}</DialogTitle>
            <DialogDescription>
              Chia sẻ trải nghiệm trận đấu của bạn với cộng đồng người chơi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 text-2xl transition hover:scale-110"
                    aria-label={`${star} sao`}
                  >
                    <Star
                      className={cn(
                        'size-7',
                        star <= reviewRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/30',
                      )}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-semibold text-amber-500">
                {reviewRating} trên 5 sao
              </span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="review-comment" className="text-xs font-medium text-muted-foreground">
                Nhận xét chi tiết (tối thiểu 4 ký tự):
              </label>
              <textarea
                id="review-comment"
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Sân sạch sẽ, ánh sáng tốt, nhân viên hỗ trợ nhiệt tình..."
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewTarget(undefined)}>
              Để sau
            </Button>
            <Button
              disabled={reviewComment.trim().length < 4 || reviewMutation.isPending}
              onClick={() => {
                void handleConfirmReview();
              }}
            >
              {reviewMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Gửi đánh giá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
