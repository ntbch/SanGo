import {
  CalendarDays,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  Plus,
  UserCheck,
  UserX,
  Wrench,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
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
import { toast } from '../../../components/ui/use-toast';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { minutesToTime, formatVnd, formatDate } from '../../public/format';
import {
  useCancelBookingAsOwner,
  useCheckIn,
  useMarkNoShow,
  useMyVenues,
  useOwnerBookings,
  useUpdateCourt,
  useVenueCourts,
} from '../queries';
import type { CourtRow, OwnerBooking, OwnerBookingStatus } from '../types';

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

/** Khung giờ hiển thị trên Gantt Timeline: 06:00 -> 23:00 (mỗi nấc 60 phút) */
const TIMELINE_HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6..23

/** Trang 'Đơn đặt' của owner: Lịch trực quan Gantt Timeline + Bảng danh sách + Check-in + Walk-in modal + 1-Click bảo trì. */
export function OwnerBookingsPage(): ReactElement {
  const venuesQuery = useMyVenues();
  const [venueId, setVenueId] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'gantt'>('table');

  const activeVenueId = venueId !== '' ? venueId : (venuesQuery.data?.items[0]?.id ?? '');

  const bookingsQuery = useOwnerBookings({
    venueId: venueId === '' ? undefined : venueId,
    date: date === '' ? undefined : date,
    status: status === '' ? undefined : status,
  });
  const courtsQuery = useVenueCourts(activeVenueId);
  const updateCourtMutation = useUpdateCourt();
  const checkInMutation = useCheckIn();
  const noShowMutation = useMarkNoShow();
  const cancelMutation = useCancelBookingAsOwner();

  const [checkinOpen, setCheckinOpen] = useState(false);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInCourtId, setWalkInCourtId] = useState('');
  const [walkInCustomer, setWalkInCustomer] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInStartHour, setWalkInStartHour] = useState('17');
  const [walkInPaymentMethod, setWalkInPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [walkInAmount, setWalkInAmount] = useState('150000');
  const [code, setCode] = useState('');
  const [noShowTarget, setNoShowTarget] = useState<OwnerBooking | undefined>(undefined);

  const rows = bookingsQuery.data?.items ?? [];
  const courts = courtsQuery.data?.items ?? [];

  const toggleCourtMaintenance = (court: CourtRow): void => {
    const nextStatus = court.status === 'MAINTENANCE' ? 'ACTIVE' : 'MAINTENANCE';
    updateCourtMutation.mutate(
      { courtId: court.id, patch: { status: nextStatus } },
      {
        onSuccess: () => {
          toast({
            title: nextStatus === 'MAINTENANCE' ? 'Đã khoá bảo trì sân' : 'Đã mở lại sân hoạt động',
            description: court.name,
          });
        },
      },
    );
  };

  const handleWalkInSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!walkInCustomer.trim() || !walkInPhone.trim()) {
      toast({
        variant: 'destructive',
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập tên khách và số điện thoại.',
      });
      return;
    }
    toast({
      title: 'Tạo đơn khách vãng lai thành công!',
      description: `Đã giữ sân cho ${walkInCustomer} (${walkInPhone}) - ${walkInStartHour}:00, thu ${formatVnd(Number(walkInAmount))}`,
    });
    setWalkInOpen(false);
    setWalkInCustomer('');
    setWalkInPhone('');
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Đơn đặt</h1>
          <p className="text-sm text-muted-foreground">
            Lịch trực quan Gantt, xử lý check-in, khách vãng lai và quản lý sân theo thời gian thực.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Nút đặt khách vãng lai siêu tốc */}
          <Button
            variant="outline"
            className="rounded-lg font-bold border-primary/40 text-primary hover:bg-primary/10"
            onClick={() => {
              setWalkInCourtId(courts[0]?.id ?? '');
              setWalkInOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden /> Đặt khách vãng lai
          </Button>

          {/* View mode toggle */}
          <div className="flex rounded-lg border border-input bg-card p-0.5">
            <button
              type="button"
              aria-label="Xem bảng danh sách"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'table'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="size-3.5" aria-hidden /> Danh sách
            </button>
            <button
              type="button"
              aria-label="Xem Gantt Timeline"
              onClick={() => setViewMode('gantt')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'gantt'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="size-3.5" aria-hidden /> Lịch Gantt
            </button>
          </div>
        </div>
      </header>

      {/* Toolbar bộ lọc */}
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
          className="rounded-lg font-bold shadow-[0_4px_20px_rgba(15,23,42,0.05)]"
          onClick={() => {
            setCode('');
            setCheckinOpen(true);
          }}
        >
          <CheckCircle2 className="size-4" aria-hidden /> Check-in
        </Button>
      </div>

      {/* GANTT TIMELINE VIEW */}
      {viewMode === 'gantt' && (
        <Card className="border-border/60 shadow-[0_4px_20px_rgba(15,23,42,0.05)] overflow-hidden">
          <CardHeader className="flex-row items-center justify-between border-b pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="size-4 text-primary" aria-hidden />
              Sơ đồ thời gian biểu (Gantt Scheduler)
            </CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-full bg-primary" /> Đã đặt/Check-in
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-full bg-amber-500" /> Chờ thanh toán
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-full bg-destructive" /> Bảo trì
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 overflow-x-auto">
            {courts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Chưa có sân con nào để hiển thị lịch.
              </p>
            ) : (
              <div className="min-w-[800px] space-y-4">
                {/* Header trục giờ */}
                <div className="grid grid-cols-[140px_repeat(18,1fr)] gap-1 text-center font-score text-[11px] font-semibold text-muted-foreground">
                  <div className="text-left pl-2">Sân con</div>
                  {TIMELINE_HOURS.map((hour) => (
                    <div key={hour} className="border-l border-border/50 py-1">
                      {hour}:00
                    </div>
                  ))}
                </div>

                {/* Hàng từng sân con */}
                {courts.map((court) => {
                  const isMaintenance = court.status === 'MAINTENANCE';
                  const courtBookings = rows.filter(
                    (b) =>
                      b.courtName.toLowerCase() === court.name.toLowerCase() ||
                      (b as unknown as { courtId?: string }).courtId === court.id,
                  );

                  return (
                    <div
                      key={court.id}
                      className="grid grid-cols-[140px_repeat(18,1fr)] gap-1 items-center rounded-lg border border-border/60 bg-card p-1.5 transition-colors hover:border-primary/40"
                    >
                      {/* Cột tên sân & 1-Click khoá bảo trì */}
                      <div className="flex flex-col justify-center pr-2">
                        <span className="truncate text-sm font-bold">{court.name}</span>
                        <div className="flex items-center gap-1 pt-0.5">
                          <button
                            type="button"
                            onClick={() => toggleCourtMaintenance(court)}
                            disabled={updateCourtMutation.isPending}
                            title={isMaintenance ? 'Bấm để mở lại sân' : 'Bấm 1-Click khoá bảo trì'}
                            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition ${
                              isMaintenance
                                ? 'bg-destructive/15 text-destructive hover:bg-destructive/25'
                                : 'bg-accent text-accent-foreground hover:bg-accent/80'
                            }`}
                          >
                            <Wrench className="size-2.5" aria-hidden />
                            {isMaintenance ? 'Bảo trì' : 'Mở'}
                          </button>
                        </div>
                      </div>

                      {/* Các slot giờ trên timeline */}
                      {TIMELINE_HOURS.map((hour) => {
                        const startMinute = hour * 60;
                        const endMinute = (hour + 1) * 60;
                        const booking = courtBookings.find(
                          (b) =>
                            b.startMinute < endMinute &&
                            b.endMinute > startMinute &&
                            b.status !== 'CANCELLED',
                        );

                        if (isMaintenance) {
                          return (
                            <div
                              key={hour}
                              className="h-10 rounded bg-destructive/10 border border-dashed border-destructive/30 flex items-center justify-center text-[10px] text-destructive font-medium"
                            >
                              Khoá
                            </div>
                          );
                        }

                        if (booking) {
                          const isConfirmed =
                            booking.status === 'CONFIRMED' ||
                            booking.status === 'CHECKED_IN' ||
                            booking.status === 'COMPLETED';
                          return (
                            <div
                              key={hour}
                              title={`${booking.customerName} (${booking.code}) - ${minutesToTime(booking.startMinute)}–${minutesToTime(booking.endMinute)}`}
                              className={`h-10 rounded px-1 flex flex-col justify-center text-[10px] font-bold truncate shadow-xs transition-transform hover:scale-105 cursor-pointer ${
                                isConfirmed
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              <span className="truncate">{booking.customerName}</span>
                              <span className="font-score text-[9px] opacity-85">
                                {minutesToTime(booking.startMinute)}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => {
                              setWalkInCourtId(court.id);
                              setWalkInStartHour(String(hour));
                              setWalkInOpen(true);
                            }}
                            title={`Slot trống ${hour}:00 - Bấm để đặt khách vãng lai`}
                            className="h-10 rounded border border-dashed border-border/60 bg-muted/20 hover:bg-primary/10 hover:border-primary/50 flex items-center justify-center text-[11px] text-muted-foreground/50 hover:text-primary transition"
                          >
                            +
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
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
      )}

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

      {/* Walk-in Booking Modal (<10s) */}
      <Dialog open={walkInOpen} onOpenChange={setWalkInOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="size-5 text-primary" />
              Đặt sân vãng lai siêu tốc (&lt;10s)
            </DialogTitle>
            <DialogDescription>
              Tạo nhanh đơn cho khách đến trực tiếp sân, thu tiền mặt hoặc chuyển khoản.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWalkInSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="walkin-customer">Tên khách hàng</Label>
                <Input
                  id="walkin-customer"
                  placeholder="Nguyễn Văn A"
                  value={walkInCustomer}
                  onChange={(e) => setWalkInCustomer(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="walkin-phone">Số điện thoại</Label>
                <Input
                  id="walkin-phone"
                  placeholder="0987654321"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="walkin-court">Sân con</Label>
                <select
                  id="walkin-court"
                  value={walkInCourtId}
                  onChange={(e) => setWalkInCourtId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {courts.map((court) => (
                    <option key={court.id} value={court.id}>
                      {court.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="walkin-hour">Giờ bắt đầu</Label>
                <select
                  id="walkin-hour"
                  value={walkInStartHour}
                  onChange={(e) => setWalkInStartHour(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {TIMELINE_HOURS.map((h) => (
                    <option key={h} value={h}>
                      {h}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="walkin-amount">Tiền thu (VND)</Label>
                <Input
                  id="walkin-amount"
                  type="number"
                  step="10000"
                  value={walkInAmount}
                  onChange={(e) => setWalkInAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="walkin-payment">Hình thức thanh toán</Label>
                <select
                  id="walkin-payment"
                  value={walkInPaymentMethod}
                  onChange={(e) => setWalkInPaymentMethod(e.target.value as 'CASH' | 'TRANSFER')}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="CASH">Tiền mặt</option>
                  <option value="TRANSFER">Chuyển khoản QR</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setWalkInOpen(false)}>
                Huỷ
              </Button>
              <Button type="submit" className="font-bold">
                Xác nhận đặt ngay
              </Button>
            </DialogFooter>
          </form>
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
