import React from 'react';
import { BookingTicketItem } from '../api/booking-api';
import { Button } from '../../../components/ui/button';
import { SPORT_LABELS } from '../../../lib/constants';
import { formatMinutesToTime, formatVND, cn } from '../../../lib/utils';
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  X,
  AlertCircle,
  Share2,
  Check,
} from 'lucide-react';
import {
  listBookingAddOnsApi,
  type BookingAddOnsSummary,
} from '../../venues/api/venue-services-api';

export interface TicketCardProps {
  ticket: BookingTicketItem;
  onCancel?: (bookingId: string, reason: string) => Promise<void>;
}

const STATUS_CONFIG: Record<string, { label: string; dotClass: string; badgeClass: string }> = {
  CONFIRMED: {
    label: 'Đã xác nhận',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
  },
  CHECKED_IN: {
    label: 'Chờ check-in',
    dotClass: 'bg-primary',
    badgeClass: 'bg-primary/10 text-primary border border-primary/20',
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    dotClass: 'bg-muted-foreground',
    badgeClass: 'bg-muted text-muted-foreground border border-border',
  },
  CANCELLED: {
    label: 'Đã hủy',
    dotClass: 'bg-destructive',
    badgeClass: 'bg-destructive/10 text-destructive border border-destructive/20',
  },
};

export function TicketCard({ ticket, onCancel }: TicketCardProps): React.ReactElement {
  const [showQrModal, setShowQrModal] = React.useState(false);
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState('');
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Hiển thị các dịch vụ đã chọn lúc đặt sân
  const [currentAddOns, setCurrentAddOns] = React.useState<BookingAddOnsSummary | null>(null);

  const isConfirmed = ticket.status === 'CONFIRMED';
  const isCheckedIn = ticket.status === 'CHECKED_IN';
  const isCompleted = ticket.status === 'COMPLETED';

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

  const handleShare = async () => {
    const shareText = `Lịch thi đấu: ${ticket.court.venue.name} - ${ticket.court.name}\nNgày: ${new Date(ticket.date).toLocaleDateString('vi-VN')} (${formatMinutesToTime(ticket.startMinute)} - ${formatMinutesToTime(ticket.endMinute)})\nMã vé: ${ticket.code}`;
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback silently if clipboard fails
      }
    }
  };

  const remainingDue = Math.max(0, ticket.totalPrice - ticket.paidAmount);
  const statusInfo = STATUS_CONFIG[ticket.status] || {
    label: ticket.status,
    dotClass: 'bg-muted-foreground',
    badgeClass: 'bg-secondary text-secondary-foreground border border-border',
  };

  return (
    <>
      {/* Modern Athletic Passbook Card: 2 flat distinct surfaces */}
      <div className="flex flex-col sm:flex-row rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        {/* Left Side: Match Details & Actions */}
        <div className="sm:w-2/3 p-5 bg-card flex flex-col justify-between gap-4">
          <div className="space-y-3">
            {/* Header: Sport badge & status dot + badge */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border text-[11px] font-bold uppercase tracking-wider">
                {SPORT_LABELS[ticket.court.sportType] || ticket.court.sportType}
              </span>
              <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold', statusInfo.badgeClass)}>
                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', statusInfo.dotClass)} />
                <span>{statusInfo.label}</span>
              </span>
            </div>

            {/* Venue & Court Name */}
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                {ticket.court.venue.name} · {ticket.court.name}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>{ticket.court.venue.address}, {ticket.court.venue.district}, {ticket.court.venue.city}</span>
              </p>
            </div>

            {/* Big Date and Time match schedule */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-2 px-3 rounded-xl bg-secondary/20 border border-border/50">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <span className="font-mono-num font-extrabold text-base sm:text-lg text-foreground">
                  {new Date(ticket.date).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <span className="text-border hidden sm:inline">|</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span className="font-mono-num font-extrabold text-base sm:text-lg text-foreground">
                  {formatMinutesToTime(ticket.startMinute)} - {formatMinutesToTime(ticket.endMinute)}
                </span>
              </div>
            </div>

            {/* Add-ons list if any */}
            {currentAddOns && currentAddOns.items.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
                <span className="text-muted-foreground font-semibold">Dịch vụ đi kèm:</span>
                {currentAddOns.items.map((it) => (
                  <span key={it.id} className="px-2 py-0.5 rounded-md bg-secondary text-foreground font-medium border border-border">
                    {it.serviceName} x{it.quantity} (<span className="font-mono-num">{formatVND(it.totalPriceVnd)}</span>)
                  </span>
                ))}
              </div>
            )}

            {/* Payment breakdown */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs pt-2 border-t border-border/60">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Đã cọc:</span>
                <span className="font-mono-num font-bold text-foreground">
                  {formatVND(ticket.paidAmount)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Còn lại:</span>
                <span className="font-mono-num font-bold text-foreground">
                  {formatVND(remainingDue)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Tổng:</span>
                <span className="font-mono-num font-bold text-foreground">
                  {formatVND(ticket.totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="text-xs font-semibold text-foreground border-border hover:bg-secondary/60 active:scale-[0.98] transition-transform gap-1.5"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Chia sẻ vé'}</span>
            </Button>

            {isConfirmed && onCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="text-xs font-semibold text-destructive border-border hover:bg-destructive/10 active:scale-[0.98] transition-transform"
              >
                Hủy đặt sân
              </Button>
            )}
          </div>
        </div>

        {/* Right Side: QR Pass & Booking Code */}
        <div className="sm:w-1/3 p-5 bg-secondary/30 border-t sm:border-t-0 sm:border-l border-border flex flex-col items-center justify-center gap-3">
          <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-white p-2 shadow-xs border border-border/80">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(ticket.code)}`}
              alt={`QR Check-in ${ticket.code}`}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="text-center space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
              Mã vé
            </span>
            <span className="font-mono-num font-bold text-xs sm:text-sm text-foreground uppercase tracking-widest">
              {ticket.code}
            </span>
          </div>
          {(isConfirmed || isCheckedIn) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowQrModal(true)}
              className="w-full max-w-[180px] text-xs font-semibold gap-1.5 active:scale-[0.98] transition-transform"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Mã QR Check-in</span>
            </Button>
          )}
        </div>
      </div>

      {/* QR Check-in Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="relative w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-xl space-y-5 text-center">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground active:scale-[0.98] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-foreground">Mã Check-in Vào Sân</h4>
              <p className="text-xs text-muted-foreground">Đưa mã cho quản lý sân quét check-in</p>
            </div>

            {/* QR Code Container */}
            <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl bg-white p-3 border border-border/80 shadow-xs">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  ticket.code,
                )}`}
                alt={`QR Check-in ${ticket.code}`}
                className="h-full w-full object-contain"
              />
            </div>

            <div className="p-3 rounded-xl bg-secondary/50 border border-border">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                Mã Đơn Vé
              </span>
              <span className="font-mono-num font-black text-lg text-foreground tracking-widest">
                {ticket.code}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Có mặt trước giờ bắt đầu 10-15 phút để chuẩn bị trang phục và nhận sân.
            </p>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl space-y-4">
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground active:scale-[0.98] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 text-destructive">
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
                className="text-xs active:scale-[0.98]"
              >
                Giữ lại đơn
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={!cancelReason.trim() || isCancelling}
                onClick={handleCancelSubmit}
                className="text-xs font-bold active:scale-[0.98]"
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
