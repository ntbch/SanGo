/**
 * Trang Quản lý đơn toàn hệ thống (t9) — ADMIN:
 * tìm kiếm/lọc (search, trạng thái, ngày chơi) + bảng phân trang từ
 * GET /admin/bookings; huỷ HỘ qua DELETE /bookings/:id với reason trong BODY
 * (bắt buộc nhập, tối đa 300 ký tự), dialog hiển thị mức hoàn dự kiến từ
 * GET /bookings/:id/refund-preview (>24h 100% · 12–24h 50% · <12h 0%).
 */
import { Search } from 'lucide-react';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

import { Badge, type BadgeProps } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { toast } from '../../../components/ui/use-toast';
import { useRefundPreview } from '../../booking/queries';
import type { AdminBookingItem, AdminBookingStatus } from '../types';
import { formatActivityTime } from '../format';
import { useAdminBookings, useAdminCancelBooking } from '../queries';
import { formatVnd, formatDate } from '../../public/format';
import { friendlyApiMessage } from '../../../lib/api/api-error';

const PAGE_SIZE = 10;
/** Độ trễ debounce ô tìm kiếm (ms). */
const SEARCH_DEBOUNCE_MS = 300;
/** Giới hạn ký tự lý do huỷ — khớp backend (max 300). */
const REASON_MAX = 300;

/** Chỉ các đơn CHƯA diễn ra/chưa thanh toán mới có thể huỷ hộ. */
const CANCELLABLE_STATUSES: ReadonlySet<AdminBookingStatus> = new Set([
  'PENDING_PAYMENT',
  'CONFIRMED',
]);

const STATUS_META: Record<AdminBookingStatus, { label: string; variant: BadgeProps['variant'] }> = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', variant: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'success' },
  CHECKED_IN: { label: 'Đã check-in', variant: 'secondary' },
  COMPLETED: { label: 'Hoàn tất', variant: 'outline' },
  CANCELLED: { label: 'Đã huỷ', variant: 'destructive' },
  NO_SHOW: { label: 'Không đến', variant: 'destructive' },
};

export function AdminBookingsPage(): ReactElement {
  // Bộ lọc + phân trang
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | AdminBookingStatus>('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const bookingsQuery = useAdminBookings({
    page,
    limit: PAGE_SIZE,
    search: search !== '' ? search : undefined,
    status: status !== '' ? status : undefined,
    date: date !== '' ? date : undefined,
  });
  const cancelMutation = useAdminCancelBooking();

  const rows = bookingsQuery.data?.items ?? [];
  const total = bookingsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  /** Đơn đang mở dialog huỷ hộ. */
  const [cancelTarget, setCancelTarget] = useState<AdminBookingItem | undefined>(undefined);
  const [reason, setReason] = useState('');
  // Mở dialog mới -> reset lý do.
  useEffect(() => {
    if (cancelTarget !== undefined) setReason('');
  }, [cancelTarget]);

  /** Mức hoàn dự kiến — hiển thị TRƯỚC khi confirm huỷ hộ (bonus UX t9). */
  const refundQuery = useRefundPreview(cancelTarget?.id);
  const trimmedReason = reason.trim();
  const canSubmit =
    confirmable(trimmedReason) && !cancelMutation.isPending && cancelTarget !== undefined;

  const submitCancel = (): void => {
    if (cancelTarget === undefined || !confirmable(trimmedReason)) return;
    cancelMutation.mutate(
      { id: cancelTarget.id, reason: trimmedReason },
      {
        onSuccess: () => {
          toast({ title: 'Đã huỷ hộ đơn ' + cancelTarget.code });
          setCancelTarget(undefined);
        },
        onError: (error) => {
          // Người khác 403 / đơn không huỷ được... hiển thị message gốc server.
          toast({
            variant: 'destructive',
            title: 'Huỷ hộ đơn thất bại',
            description: friendlyApiMessage(error),
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Quản lý đơn đặt sân</h1>
        <p className="text-sm text-muted-foreground">
          Tra cứu toàn bộ đơn trên hệ thống và huỷ hộ khi cần thiết.
        </p>
      </header>

      {/* Bộ lọc: search debounce + trạng thái + ngày chơi */}
      <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
        <CardHeader className="pb-3">
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>Tìm theo mã đơn hoặc tên khách hàng.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm mã đơn hoặc khách…"
              aria-label="Tìm kiếm đơn"
              data-testid="admin-bookings-search"
              className="pl-9"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="whitespace-nowrap text-muted-foreground">Trạng thái</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as '' | AdminBookingStatus);
                setPage(1);
              }}
              data-testid="admin-filter-status"
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Tất cả</option>
              {(Object.keys(STATUS_META) as AdminBookingStatus[]).map((key) => (
                <option key={key} value={key}>
                  {STATUS_META[key].label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="whitespace-nowrap text-muted-foreground">Ngày chơi</span>
            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setPage(1);
              }}
              data-testid="admin-filter-date"
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </CardContent>
      </Card>

      {/* Bảng đơn */}
      <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
        <CardHeader className="pb-3">
          <CardTitle>Danh sách đơn</CardTitle>
          <CardDescription data-testid="admin-bookings-total">
            Hiển thị {rangeStart}–{rangeEnd} trên tổng {total} đơn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookingsQuery.isPending ? (
            <div className="space-y-3" role="status" aria-label="Đang tải danh sách đơn">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : bookingsQuery.isError ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
            >
              {friendlyApiMessage(bookingsQuery.error)}
            </p>
          ) : rows.length === 0 ? (
            <p
              data-testid="admin-bookings-empty"
              className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground"
            >
              Không tìm thấy đơn phù hợp bộ lọc.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table data-testid="admin-bookings-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Cụm sân / Sân con</TableHead>
                      <TableHead>Khách</TableHead>
                      <TableHead>Bắt đầu</TableHead>
                      <TableHead>Kết thúc</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Tổng tiền</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((booking, index) => (
                      <TableRow key={booking.id} data-testid={'admin-booking-row-' + index}>
                        <TableCell className="font-score text-xs font-bold uppercase tracking-widest text-primary">
                          {booking.code}
                        </TableCell>
                        <TableCell>
                          {booking.venueName}
                          <span className="block text-xs text-muted-foreground">
                            {booking.courtName}
                          </span>
                        </TableCell>
                        <TableCell>
                          {booking.customerName}
                          <span className="block text-xs text-muted-foreground">
                            {booking.customerEmail}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums">
                          {formatActivityTime(booking.startTime)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums">
                          {formatActivityTime(booking.endTime)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_META[booking.status].variant}>
                            {STATUS_META[booking.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-score font-bold">
                          {booking.totalPriceVnd.toLocaleString('vi-VN')}₫
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(booking.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {CANCELLABLE_STATUSES.has(booking.status) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setCancelTarget(booking)}
                              data-testid={'admin-booking-cancel-' + index}
                            >
                              Huỷ hộ
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Phân trang items/total */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Trang {page}/{totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1 || bookingsQuery.isFetching}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    data-testid="admin-bookings-prev"
                  >
                    Trang trước
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages || bookingsQuery.isFetching}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    data-testid="admin-bookings-next"
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog huỷ hộ: mức hoàn dự kiến + lý do bắt buộc (max 300) */}
      <Dialog
        open={cancelTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(undefined);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Huỷ hộ đơn {cancelTarget?.code}</DialogTitle>
            <DialogDescription>
              Chính sách hoàn tiền: &gt;24h hoàn 100% · 12–24h hoàn 50% · &lt;12h không hoàn.
            </DialogDescription>
          </DialogHeader>

          {refundQuery.isPending ? (
            <Skeleton className="h-20 w-full" aria-label="Đang tải mức hoàn dự kiến" />
          ) : refundQuery.data ? (
            <div
              className="space-y-1.5 rounded-lg border border-border/60 bg-muted/40 p-3 text-xs"
              data-testid="admin-cancel-refund"
            >
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
          ) : (
            <p className="text-xs text-muted-foreground" role="note">
              Không xem trước được mức hoàn cho đơn này.
            </p>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="admin-cancel-reason"
              className="text-xs font-medium text-muted-foreground"
            >
              Lý do huỷ (bắt buộc):
            </label>
            <textarea
              id="admin-cancel-reason"
              rows={2}
              maxLength={REASON_MAX}
              value={reason}
              onChange={(event) => setReason(event.target.value.slice(0, REASON_MAX))}
              placeholder="vd: Khách liên hệ huỷ do bận việc đột xuất"
              data-testid="admin-cancel-reason"
              className="w-full rounded-lg border border-input bg-background p-2 text-xs shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p
              className="text-right text-[11px] text-muted-foreground"
              data-testid="admin-cancel-reason-count"
            >
              {reason.length}/{REASON_MAX}
            </p>
          </div>

          {cancelMutation.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {friendlyApiMessage(cancelMutation.error)}
            </p>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(undefined)}>
              Giữ đơn
            </Button>
            <Button
              variant="destructive"
              disabled={!canSubmit}
              onClick={submitCancel}
              data-testid="admin-booking-confirm-cancel"
            >
              Xác nhận huỷ hộ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Lý do huỷ bắt buộc theo UI dù API optional. */
function confirmable(reason: string): boolean {
  return reason.length > 0;
}
