import React from 'react';
import { BookingTicketItem } from '../api/booking-api';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { SPORT_LABELS } from '../../../lib/constants';
import { formatMinutesToTime, formatVND } from '../../../lib/utils';
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  listBookingAddOnsApi,
  type BookingAddOnsSummary,
} from '../../venues/api/venue-services-api';

export interface TicketCardProps {
  ticket: BookingTicketItem;
  onCancel?: (bookingId: string, reason: string) => Promise<void>;
}

export function TicketCard({ ticket, onCancel }: TicketCardProps): React.ReactElement {
  const [showQrModal, setShowQrModal] = React.useState(false);
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState('');
  const [isCancelling, setIsCancelling] = React.useState(false);

  // Hiển thị các dịch vụ đã chọn lúc đặt sân
  const [currentAddOns, setCurrentAddOns] = React.useState<BookingAddOnsSummary | null>(null);

  const isConfirmed = ticket.status === 'CONFIRMED';
  const isCheckedIn = ticket.status === 'CHECKED_IN';
  const isCompleted = ticket.status === 'COMPLETED';
  const isCancelled = ticket.status === 'CANCELLED';

  React.useEffect(() => {
    if (isConfirmed || isCheckedIn || isCompleted) {
      listBookingAddOnsApi(ticket.id)
        .then((summary) => {
          if (summary && summary.items && summary.items.length > 0) {
            setCurrentAddOns(summary);
          }
        })
        .catch(() => undefined);
    }
  }, [ticket.id, isConfirmed, isCheckedIn, isCompleted]);

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) return;
    setIsCancelling(true);
    try {
      await onCancel?.(ticket.id, cancelReason);
      setShowCancelModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCancelling(false);
    }
  };

  const remainingDue = Math.max(0, ticket.totalPrice - ticket.paidAmount);

  return (
    <>
      {/* Notch Sports Ticket Card */}
      <Card className="relative overflow-hidden border border-border/80 bg-card p-0 shadow-md hover:shadow-lg transition-all">
        {/* Top Header Strip */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/30 border-b border-border/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono-num font-bold text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                {ticket.code}
              </span>
              <span className="text-[11px] font-bold text-muted-foreground uppercase">
                {SPORT_LABELS[ticket.court.sportType] || ticket.court.sportType}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-foreground">
              {ticket.court.name} · {ticket.court.venue.name}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{ticket.court.venue.address}, {ticket.court.venue.district}, {ticket.court.venue.city}</span>
            </p>
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            {isConfirmed && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Đã xác nhận</span>
              </span>
            )}
            {isCheckedIn && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Đã Check-in</span>
              </span>
            )}
            {isCompleted && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-500/10 text-zinc-400 text-xs font-bold border border-zinc-500/20">
                <span>Hoàn tất trận</span>
              </span>
            )}
            {isCancelled && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold border border-rose-500/20">
                <XCircle className="h-3.5 w-3.5" />
                <span>Đã hủy</span>
              </span>
            )}
          </div>
        </div>

        {/* Middle Date & Financial Metrics */}
        <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Ngày đá / chơi</span>
            </span>
            <p className="font-mono-num font-bold text-sm text-foreground">
              {new Date(ticket.date).toLocaleDateString('vi-VN')}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Khung giờ slot</span>
            </span>
            <p className="font-mono-num font-bold text-sm text-foreground">
              {formatMinutesToTime(ticket.startMinute)} - {formatMinutesToTime(ticket.endMinute)}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground">Đã thanh toán (Cọc)</span>
            <p className="font-mono-num font-bold text-sm text-emerald-600 dark:text-emerald-400">
              {formatVND(ticket.paidAmount)}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground">Còn lại trả tại sân</span>
            <p className="font-mono-num font-bold text-sm text-primary">
              {formatVND(remainingDue)}
            </p>
          </div>
        </div>

        {/* Booked Add-ons summary strip */}
        {currentAddOns && currentAddOns.items.length > 0 && (
          <div className="px-4 sm:px-5 pb-3 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-muted-foreground font-semibold">Dịch vụ đi kèm:</span>
            {currentAddOns.items.map((it) => (
              <span key={it.id} className="px-2 py-0.5 rounded-md bg-secondary text-foreground font-medium border border-border">
                {it.serviceName} x{it.quantity} ({formatVND(it.totalPriceVnd)})
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className="p-4 sm:p-5 bg-card/60 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(isConfirmed || isCheckedIn) && (
              <Button
                size="sm"
                onClick={() => setShowQrModal(true)}
                className="gap-1.5 font-bold text-xs shadow-xs cursor-pointer"
              >
                <QrCode className="h-4 w-4" />
                <span>Mã QR Check-in</span>
              </Button>
            )}
          </div>

          {isConfirmed && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelModal(true)}
              className="text-xs font-semibold text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <span>Hủy đặt sân</span>
            </Button>
          )}
        </div>
      </Card>

      {/* QR Check-in Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-5 text-center">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-foreground">Mã Check-in Vào Sân</h4>
              <p className="text-xs text-muted-foreground">Đưa mã cho quản lý sân quét check-in</p>
            </div>

            {/* QR Code Container */}
            <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl bg-white p-3 shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  ticket.code,
                )}`}
                alt={`QR Check-in ${ticket.code}`}
                className="h-full w-full object-contain"
              />
            </div>

            <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                Mã Đơn Vé
              </span>
              <span className="font-mono-num font-black text-lg text-primary tracking-widest">
                {ticket.code}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground">
              có mặt trước giờ bắt đầu 10-15 phút để chuẩn bị trang phục và nhận sân.
            </p>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 text-rose-500">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <h4 className="text-base font-bold text-foreground">Xác nhận hủy đặt sân</h4>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Theo quy định của cụm sân, việc hủy trước 12-24 giờ sẽ được hoàn tiền cọc tự động về Ví SanGo của bạn.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Lý do hủy đơn <span className="text-destructive">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Đội bận đột xuất, thời tiết xấu..."
                rows={3}
                className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isCancelling}
                onClick={() => setShowCancelModal(false)}
                className="text-xs"
              >
                Giữ lại đơn
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={!cancelReason.trim() || isCancelling}
                onClick={handleCancelSubmit}
                className="text-xs font-bold"
              >
                {isCancelling ? 'Đang xử lý...' : 'Xác nhận hủy sân'}
              </Button>
              </div>
          </div>
        </div>
      )}


    </>
  );
}
