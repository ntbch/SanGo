import { CalendarDays, CheckCircle2, UserX } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { minutesToTime, formatVnd, formatDate } from '../../public/format';
import {
  useCancelBookingAsOwner,
  useCheckIn,
  useMarkNoShow,
  useMyVenues,
  useOwnerBookings,
} from '../queries';
import type { OwnerBooking, OwnerBookingStatus } from '../types';

const STATUS_LABELS: Record<
  OwnerBookingStatus,
  { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }
> = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', variant: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'secondary' },
  CHECKED_IN: { label: 'Đã check-in', variant: 'success' },
  COMPLETED: { label: 'Hoàn tất', variant: 'success' },
  CANCELLED: { label: 'Đã huỷ', variant: 'destructive' },
  NO_SHOW: { label: 'Không đến', variant: 'destructive' },
};

/** Trang 'Đơn đặt' của owner: lọc theo sân/ngày/trạng thái + check-in, no-show, huỷ hộ. */
export function OwnerBookingsPage(): ReactElement {
  const venuesQuery = useMyVenues();
  const [venueId, setVenueId] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');

  const bookingsQuery = useOwnerBookings({
    venueId: venueId === '' ? undefined : venueId,
    date: date === '' ? undefined : date,
    status: status === '' ? undefined : status,
  });
  const checkInMutation = useCheckIn();
  const noShowMutation = useMarkNoShow();
  const cancelMutation = useCancelBookingAsOwner();

  const [checkinOpen, setCheckinOpen] = useState(false);
  const [code, setCode] = useState('');
  const [noShowTarget, setNoShowTarget] = useState<OwnerBooking | undefined>(undefined);

  const rows = bookingsQuery.data?.items ?? [];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Đơn đặt</h1>
        <p className="text-sm text-muted-foreground">
          Xử lý check-in, khách không đến và huỷ hộ theo sân.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5 w-full max-w-56">
          <Label htmlFor="bk-venue">Cụm sân</Label>
          <select
            id="bk-venue"
            value={venueId}
            onChange={(event) => setVenueId(event.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Tất cả</option>
            {(venuesQuery.data?.items ?? []).map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 w-40">
          <Label htmlFor="bk-date" className="flex items-center gap-1">
            <CalendarDays className="size-3.5" aria-hidden /> Ngày chơi
          </Label>
          <Input
            id="bk-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <div className="space-y-1.5 w-44">
          <Label htmlFor="bk-status">Trạng thái</Label>
          <select
            id="bk-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Tất cả</option>
            {(Object.keys(STATUS_LABELS) as OwnerBookingStatus[]).map((key) => (
              <option key={key} value={key}>
                {STATUS_LABELS[key].label}
              </option>
            ))}
          </select>
        </div>
        <Button
          className="rounded-lg font-bold"
          onClick={() => {
            setCode('');
            setCheckinOpen(true);
          }}
        >
          <CheckCircle2 className="size-4" aria-hidden /> Check-in
        </Button>
      </div>

      <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
        <CardContent className="p-0">
          {bookingsQuery.isError ? (
            <p role="alert" className="p-4 text-sm text-destructive">
              {friendlyApiMessage(bookingsQuery.error)}
            </p>
          ) : null}
          {rows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-score text-[11px] font-semibold uppercase tracking-widest">
                    Mã đơn
                  </TableHead>
                  <TableHead className="font-score text-[11px] font-semibold uppercase tracking-widest">
                    Khách
                  </TableHead>
                  <TableHead className="font-score text-[11px] font-semibold uppercase tracking-widest">
                    Ngày & giờ chơi
                  </TableHead>
                  <TableHead className="font-score text-[11px] font-semibold uppercase tracking-widest">
                    Thanh toán
                  </TableHead>
                  <TableHead className="font-score text-[11px] font-semibold uppercase tracking-widest">
                    Trạng thái
                  </TableHead>
                  <TableHead className="text-right font-score text-[11px] font-semibold uppercase tracking-widest">
                    Hành động
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((booking) => {
                  const badge = STATUS_LABELS[booking.status];
                  const actionable = booking.status === 'CONFIRMED';
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-score text-xs font-semibold uppercase tracking-wide">
                        {booking.code}
                      </TableCell>
                      <TableCell>{booking.customerName}</TableCell>
                      <TableCell className="whitespace-nowrap font-score text-xs">
                        {formatDate(booking.date)} · {minutesToTime(booking.startMinute)}–
                        {minutesToTime(booking.endMinute)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-score text-xs tabular-nums">
                        {formatVnd(booking.amountPaid)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={badge.variant}
                          className="rounded-full px-2.5 py-1 font-score text-[10px] uppercase tracking-wide"
                        >
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!actionable || noShowMutation.isPending}
                            onClick={() => setNoShowTarget(booking)}
                          >
                            <UserX className="size-3.5" aria-hidden /> No-show
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={!actionable || cancelMutation.isPending}
                            onClick={() => {
                              if (window.confirm(`Huỷ đơn ${booking.code}?`))
                                cancelMutation.mutate(booking.id);
                            }}
                          >
                            Huỷ hộ
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : null}
          {!bookingsQuery.isPending && !bookingsQuery.isError && rows.length === 0 ? (
            <p className="m-4 rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
              Không có đơn nào khớp bộ lọc.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Check-in dialog */}
      <Dialog open={checkinOpen} onOpenChange={setCheckinOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Check-in bằng mã đơn</DialogTitle>
            <DialogDescription>
              Nhập mã in trên đơn của khách, vd CH-20260824-0007.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Input
              autoFocus
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="CH-…"
            />
            {checkInMutation.isError ? (
              <p role="alert" className="text-xs text-destructive">
                {friendlyApiMessage(checkInMutation.error)}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckinOpen(false)}>
              Đóng
            </Button>
            <Button
              disabled={code.trim() === '' || checkInMutation.isPending}
              onClick={() =>
                checkInMutation.mutate(code.trim(), {
                  onSuccess: () => {
                    setCheckinOpen(false);
                    setCode('');
                  },
                })
              }
            >
              Xác nhận check-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* No-show confirm dialog */}
      <Dialog
        open={noShowTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setNoShowTarget(undefined);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Đánh dấu không đến?</DialogTitle>
            <DialogDescription>
              Đơn {noShowTarget?.code} sẽ chuyển sang trạng thái NO_SHOW. Hành động này không thể
              hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoShowTarget(undefined)}>
              Quay lại
            </Button>
            <Button
              variant="destructive"
              disabled={noShowMutation.isPending}
              onClick={() => {
                if (noShowTarget)
                  noShowMutation.mutate(noShowTarget.id, {
                    onSuccess: () => setNoShowTarget(undefined),
                  });
              }}
            >
              Xác nhận NO_SHOW
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
