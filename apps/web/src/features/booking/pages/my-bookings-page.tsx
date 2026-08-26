import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Plus, ShoppingBag, Star, Loader2, UsersRound, QrCode } from 'lucide-react';
import { generateQrSvg } from '../../../lib/qrcode';
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
import { formatJoinedCount } from '../../matches/match-utils';
import { useMatchParticipants } from '../../matches/queries';
import { AddOnsDialog } from '../components/addons-dialog';
import type { CustomerBooking } from '../types';

type TabFilter = 'all' | 'upcoming' | 'completed' | 'cancelled';

const TAB_LABELS: Record<TabFilter, string> = {
  all: 'Tất cả',
  upcoming: 'Sắp diễn ra',
  completed: 'Hoàn thành',
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
  const [tab, setTab] = useState<TabFilter>('all');
  const { toast } = useToast();

  const bookingsQuery = useMyBookings(tab === 'all' ? { page: 1 } : { filter: tab === 'completed' ? 'history' : tab, page: 1 });
  const [qrTarget, setQrTarget] = useState<CustomerBooking | undefined>(undefined);
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

  // Modal Người tham gia ghép trận (§3.11) — chủ đơn xem danh sách.
  const [participantsTarget, setParticipantsTarget] = useState<CustomerBooking | undefined>(
    undefined,
  );
  const participantsQuery = useMatchParticipants(participantsTarget?.id);

  // Modal Gọi thêm dịch vụ (F4) — đơn CONFIRMED/CHECKED_IN mua nước/bóng kèm.
  const [addonTarget, setAddonTarget] = useState<CustomerBooking | undefined>(undefined);

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
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Đơn đặt sân của tôi</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi các trận đấu sắp diễn ra, lịch sử chơi và đánh giá.
          </p>
        </div>
        <Button asChild size="sm" className="rounded-lg font-bold">
          <Link to="/venues">
            <Plus className="size-4" aria-hidden /> Đặt sân mới
          </Link>
        </Button>
      </header>

      {/* Tabs filter */}
      <div className="inline-flex w-fit gap-1 rounded-full bg-muted p-1">
        {(Object.keys(TAB_LABELS) as TabFilter[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm transition-colors',
              tab === key
                ? 'bg-card font-semibold text-foreground shadow-xs'
                : 'font-medium text-muted-foreground hover:text-foreground',
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
          <Calendar className="mx-auto mb-2 size-8 opacity-50" aria-hidden />
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
            // F4: gọi thêm dịch vụ ngay sau khi đơn được xác nhận (kể cả đã check-in).
            const canOrderAddOns = b.status === 'CONFIRMED' || b.status === 'CHECKED_IN';

            return (
              <Card
                key={b.id}
                className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow duration-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
              >
                <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-score text-xs font-bold uppercase tracking-widest text-primary">
                        {b.code}
                      </span>
                      <Badge
                        variant={badge.variant}
                        className="rounded-full px-2.5 py-1 font-score text-[10px] uppercase tracking-wide"
                      >
                        {badge.label}
                      </Badge>
                      {b.isPublicMatch && b.status === 'CONFIRMED' ? (
                        <Badge
                          variant={b.matchFull ? 'success' : 'warning'}
                          data-testid="open-match-badge"
                          className="rounded-full px-2.5 py-1 font-score text-[10px] uppercase tracking-wide"
                        >
                          {b.matchFull
                            ? 'Đã đủ người'
                            : `Đang tìm người${b.slotsNeeded ? ` · cần ${b.slotsNeeded}` : ''}`}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-base">
                        {b.venueName} · {b.courtName}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3.5" aria-hidden />{' '}
                        <span className="font-score">{b.date}</span> ·{' '}
                        <Clock className="ml-1 size-3.5" aria-hidden />{' '}
                        <span className="font-score">
                          {minutesToTime(b.startMinute)} – {minutesToTime(b.endMinute)}
                        </span>
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground pt-1">
                      <span>
                        Đã thanh toán:{' '}
                        <strong className="font-score text-primary">
                          {formatVnd(b.amountPaid)}
                        </strong>
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
                      <div className="mt-2 space-y-1 rounded-lg bg-muted/60 p-3 text-xs">
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
                    {(b.status === 'CONFIRMED' || b.status === 'CHECKED_IN') ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="font-semibold"
                        onClick={() => setQrTarget(b)}
                      >
                        <QrCode className="mr-1.5 size-3.5" aria-hidden /> Mã QR
                      </Button>
                    ) : null}
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

                    {canOrderAddOns ? (
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid="order-addons"
                        onClick={() => setAddonTarget(b)}
                      >
                        <ShoppingBag className="mr-1 size-3.5" aria-hidden /> Gọi thêm dịch vụ
                      </Button>
                    ) : null}

                    {b.isPublicMatch && b.status === 'CONFIRMED' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid="view-participants"
                        onClick={() => setParticipantsTarget(b)}
                      >
                        <UsersRound className="mr-1 size-3.5" aria-hidden /> Người tham gia
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
            <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/40 p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thời gian tới giờ chơi:</span>
                <span className="font-medium">~{refundQuery.data.hoursUntilMatch} giờ</span>
              </div>
              <div className="flex justify-between border-t pt-1 text-sm font-semibold">
                <span>Mức hoàn dự kiến ({refundQuery.data.refundPercent}%):</span>
                <span className="font-score text-primary">
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
              className="w-full rounded-lg border border-input bg-background p-2 text-xs shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                className="w-full rounded-lg border border-input bg-background p-2.5 text-xs shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      {/* Modal Người tham gia ghép trận (§3.11) — chỉ chủ đơn xem được. */}
      <Dialog
        open={Boolean(participantsTarget)}
        onOpenChange={(open) => {
          if (!open) setParticipantsTarget(undefined);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Người tham gia {participantsTarget?.code}</DialogTitle>
            <DialogDescription>Người chơi đã ghép vào đơn công khai của bạn.</DialogDescription>
          </DialogHeader>
          {participantsQuery.isPending ? (
            <div className="space-y-2 py-2">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : participantsQuery.isError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {friendlyApiMessage(participantsQuery.error)}
            </p>
          ) : participantsQuery.data ? (
            <div className="space-y-3 py-1">
              <p className="text-sm text-muted-foreground">
                Đã tham gia:{' '}
                <strong className="text-foreground">
                  {formatJoinedCount(
                    participantsQuery.data.joinedCount,
                    participantsQuery.data.slotsNeeded ?? 0,
                  )}
                </strong>
                {participantsQuery.data.matchFull ? ' · đơn đã đủ người' : ''}
              </p>
              {participantsQuery.data.participants.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Chưa có ai tham gia. Đơn đang hiển thị ở trang Ghép trận.
                </p>
              ) : (
                <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {participantsQuery.data.participants.map((p) => (
                    <li
                      key={p.userId}
                      className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2 transition-colors hover:border-primary/40"
                    >
                      <span
                        aria-hidden
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary"
                      >
                        {p.fullName.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">{p.fullName}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Modal Gọi thêm dịch vụ (F4) — chọn nước/bóng/giày rồi thanh toán ADD_ON riêng */}
      <AddOnsDialog
        key={addonTarget?.id ?? 'no-addon-target'}
        booking={addonTarget}
        onOpenChange={(open) => {
          if (!open) setAddonTarget(undefined);
        }}
      />

      {/* Modal QR Check-in */}
      <Dialog
        open={Boolean(qrTarget)}
        onOpenChange={(open) => {
          if (!open) setQrTarget(undefined);
        }}
      >
        <DialogContent className="sm:max-w-xs text-center">
          <DialogHeader>
            <DialogTitle className="text-center">Mã Check-in Sân</DialogTitle>
            <DialogDescription className="text-center">
              Đưa mã QR này cho quản lý sân khi đến nhận sân.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            <div className="rounded-xl border border-border/80 bg-white p-4 shadow-sm text-slate-900">
              {qrTarget ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: generateQrSvg(qrTarget.code, 180),
                  }}
                />
              ) : null}
            </div>
            <div className="mt-3 font-mono text-base font-bold tracking-wider text-primary">
              {qrTarget?.code}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {qrTarget?.venueName} · {qrTarget?.courtName}
            </p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button variant="outline" size="sm" onClick={() => setQrTarget(undefined)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
