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
  Coffee,
  Plus,
  Minus,
} from 'lucide-react';
import {
  listPublicVenueServicesApi,
  listBookingAddOnsApi,
  addBookingAddOnsApi,
  type VenueServiceItem,
  type BookingAddOnsSummary,
} from '../../venues/api/venue-services-api';

export interface TicketCardProps {
  ticket: BookingTicketItem;
  onCancel?: (bookingId: string, reason: string) => Promise<void>;
}

export function TicketCard({ ticket, onCancel }: TicketCardProps): React.ReactElement {
  const [showQrModal, setShowQrModal] = React.useState(false);
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [showAddonsModal, setShowAddonsModal] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState('');
  const [isCancelling, setIsCancelling] = React.useState(false);

  // Add-ons State
  const [availableServices, setAvailableServices] = React.useState<VenueServiceItem[]>([]);
  const [currentAddOns, setCurrentAddOns] = React.useState<BookingAddOnsSummary | null>(null);
  const [selectedQuantities, setSelectedQuantities] = React.useState<Record<string, number>>({});
  const [isLoadingAddons, setIsLoadingAddons] = React.useState(false);
  const [isSubmittingAddons, setIsSubmittingAddons] = React.useState(false);
  const [addonSuccessMsg, setAddonSuccessMsg] = React.useState<string | null>(null);

  const isConfirmed = ticket.status === 'CONFIRMED';
  const isCheckedIn = ticket.status === 'CHECKED_IN';
  const isCompleted = ticket.status === 'COMPLETED';
  const isCancelled = ticket.status === 'CANCELLED';

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

  const handleOpenAddons = async () => {
    setShowAddonsModal(true);
    setIsLoadingAddons(true);
    try {
      const [services, addOnsSummary] = await Promise.all([
        listPublicVenueServicesApi(ticket.court.venue.id),
        listBookingAddOnsApi(ticket.id),
      ]);
      setAvailableServices(services.filter((s) => s.isActive));
      setCurrentAddOns(addOnsSummary);
      const initialQty: Record<string, number> = {};
      services.forEach((s) => {
        const found = addOnsSummary.items.find((i) => i.serviceId === s.id);
        initialQty[s.id] = found ? found.quantity : 0;
      });
      setSelectedQuantities(initialQty);
    } finally {
      setIsLoadingAddons(false);
    }
  };

  const handleSaveAddons = async () => {
    const itemsToSave = Object.entries(selectedQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([serviceId, quantity]) => ({ serviceId, quantity }));

    setIsSubmittingAddons(true);
    try {
      await addBookingAddOnsApi(ticket.id, itemsToSave);
      setAddonSuccessMsg('Đã cập nhật danh sách dịch vụ đi kèm thành công!');
      const updated = await listBookingAddOnsApi(ticket.id);
      setCurrentAddOns(updated);
      setTimeout(() => {
        setAddonSuccessMsg(null);
        setShowAddonsModal(false);
      }, 1200);
    } finally {
      setIsSubmittingAddons(false);
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

            {isConfirmed && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAddons}
                className="gap-1.5 font-bold text-xs border-primary/40 text-primary hover:bg-primary/10 cursor-pointer"
              >
                <Coffee className="h-4 w-4" />
                <span>Đặt Thêm Dịch Vụ / Nước Uống</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
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
              <p className="text-xs text-muted-foreground">Đưa mã này cho quản lý sân để quét xác nhận</p>
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
              Vui lòng có mặt trước giờ bắt đầu 10-15 phút để chuẩn bị trang phục và nhận sân.
            </p>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
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

      {/* Add-ons & Extra Services Modal */}
      {showAddonsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col justify-between">
            <button
              type="button"
              onClick={() => setShowAddonsModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <Coffee className="h-4 w-4" />
                <span>Tiện Ích Sân Bóng</span>
              </div>
              <h4 className="text-lg font-black text-foreground">
                Đặt Dịch Vụ &amp; Nước Uống Cho Đơn {ticket.code}
              </h4>
              <p className="text-xs text-muted-foreground">
                Dịch vụ được chuẩn bị sẵn tại sân trước giờ thi đấu. Thanh toán bằng Ví SanGo hoặc tại quầy.
              </p>
            </div>

            {/* List of Services */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {isLoadingAddons ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Đang tải menu dịch vụ của sân...
                </div>
              ) : availableServices.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Sân này hiện chưa kích hoạt dịch vụ đặt trước.
                </div>
              ) : (
                availableServices.map((service) => {
                  const qty = selectedQuantities[service.id] || 0;
                  return (
                    <div
                      key={service.id}
                      className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-xs font-bold text-foreground block truncate">
                          {service.name}
                        </span>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="font-mono-num font-bold text-primary">
                            {formatVND(service.unitPriceVnd)}
                          </span>
                          <span className="text-muted-foreground">/ {service.unit}</span>
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2 bg-background border border-border p-1 rounded-xl shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedQuantities((prev) => ({
                              ...prev,
                              [service.id]: Math.max(0, (prev[service.id] || 0) - 1),
                            }))
                          }
                          disabled={qty <= 0}
                          className="h-6 w-6 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-primary/20 hover:text-primary transition-colors disabled:opacity-30 cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-mono-num font-black text-xs w-6 text-center text-foreground">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedQuantities((prev) => ({
                              ...prev,
                              [service.id]: (prev[service.id] || 0) + 1,
                            }))
                          }
                          className="h-6 w-6 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {addonSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{addonSuccessMsg}</span>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground block font-semibold">Tạm tính dịch vụ:</span>
                <span className="font-mono-num font-black text-base text-primary">
                  {formatVND(
                    availableServices.reduce(
                      (sum, s) => sum + s.unitPriceVnd * (selectedQuantities[s.id] || 0),
                      0,
                    ),
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddonsModal(false)}
                  className="text-xs"
                >
                  Đóng
                </Button>
                <Button
                  size="sm"
                  disabled={isSubmittingAddons}
                  onClick={handleSaveAddons}
                  className="text-xs font-bold shadow-md shadow-emerald-500/20"
                >
                  {isSubmittingAddons ? 'Đang lưu...' : 'Xác Nhận Đặt'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
