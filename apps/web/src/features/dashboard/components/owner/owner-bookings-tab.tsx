import React from 'react';
import {
  type OwnerBookingItem,
  type SportType,
} from '../../api/owner-api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { formatVND, formatMinutesToTime } from '../../../../lib/utils';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Search,
  RefreshCw,
  Phone,
} from 'lucide-react';

const SPORT_TYPE_LABELS: Record<SportType, string> = {
  FOOTBALL5: 'Bóng đá 5',
  FOOTBALL7: 'Bóng đá 7',
  PICKLEBALL: 'Pickleball',
  BADMINTON: 'Cầu lông',
  TENNIS: 'Tennis',
};

interface OwnerBookingsTabProps {
  bookings: OwnerBookingItem[];
  loadingBookings: boolean;
  bookingDate: string;
  setBookingDate: (date: string) => void;
  bookingStatusFilter: string;
  setBookingStatusFilter: (status: string) => void;
  checkInCode: string;
  setCheckInCode: (code: string) => void;
  checkInLoading: boolean;
  checkInError: string | null;
  checkInResult: { message: string; booking: OwnerBookingItem } | null;
  onCheckInSubmit: (e: React.FormEvent) => void;
  onRefreshBookings: () => void;
  onMarkNoShow: (bookingId: string) => void;
}

export function OwnerBookingsTab({
  bookings,
  loadingBookings,
  bookingDate,
  setBookingDate,
  bookingStatusFilter,
  setBookingStatusFilter,
  checkInCode,
  setCheckInCode,
  checkInLoading,
  checkInError,
  checkInResult,
  onCheckInSubmit,
  onRefreshBookings,
  onMarkNoShow,
}: OwnerBookingsTabProps): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Top Check-in Action Card */}
      <Card className="border-primary/20 bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Quầy Check-in 1-Click</CardTitle>
                <CardDescription className="text-xs">
                  Quét mã QR hoặc nhập mã đơn vé CH-YYYYMMDD-NNNN của khách khi đến sân.
                </CardDescription>
              </div>
            </div>
            <Badge variant="available" className="font-semibold">
              Sẵn sàng check-in
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={onCheckInSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Nhập mã đơn vé (ví dụ: CH-20260828-0001)..."
                value={checkInCode}
                onChange={(e) => setCheckInCode(e.target.value)}
                prefixIcon={<Search className="h-4 w-4" />}
                className="h-11 font-mono uppercase font-bold text-sm"
              />
            </div>
            <Button type="submit" loading={checkInLoading} className="h-11 px-6 font-bold shadow-xs">
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Xác Nhận Check-in
            </Button>
          </form>

          {checkInError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{checkInError}</span>
            </div>
          )}

          {checkInResult && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-in fade-in-0 duration-200">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>{checkInResult.message}</span>
                </div>
                <Badge variant="available" className="font-mono">
                  {checkInResult.booking.code}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-card border border-border/60 space-y-1">
                  <span className="text-muted-foreground text-[10px] font-semibold uppercase">Khách Hàng</span>
                  <p className="font-bold text-foreground">{checkInResult.booking.customer?.fullName ?? checkInResult.booking.guestName}</p>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {checkInResult.booking.customer?.phone || checkInResult.booking.guestPhone || 'Chưa cập nhật'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-card border border-border/60 space-y-1">
                  <span className="text-muted-foreground text-[10px] font-semibold uppercase">Sân &amp; Khung Giờ</span>
                  <p className="font-bold text-foreground">{checkInResult.booking.court.name}</p>
                  <p className="text-primary font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatMinutesToTime(checkInResult.booking.startMinute)} - {formatMinutesToTime(checkInResult.booking.endMinute)}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-card border border-border/60 space-y-1">
                  <span className="text-muted-foreground text-[10px] font-semibold uppercase">Tài Chính</span>
                  <p className="font-bold text-foreground">Tổng: {formatVND(checkInResult.booking.subtotal)}</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Đã cọc/thanh toán: {formatVND(checkInResult.booking.depositAmount)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bookings List Section */}
      <Card className="border-border/80">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Lịch Sân &amp; Đơn Đặt Theo Ca ({bookings.length} đơn)
            </CardTitle>
            <CardDescription className="text-xs">
              Theo dõi trạng thái khách đến sân, thanh toán và xử lý đơn.
            </CardDescription>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="h-9 text-xs w-36"
            />

            <select
              value={bookingStatusFilter}
              onChange={(e) => setBookingStatusFilter(e.target.value)}
              className="h-9 px-2.5 rounded-xl bg-card border border-border/80 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="CONFIRMED">CONFIRMED (Chờ đá)</option>
              <option value="CHECKED_IN">CHECKED_IN (Đã đến)</option>
              <option value="COMPLETED">COMPLETED (Hoàn tất)</option>
              <option value="NO_SHOW">NO_SHOW (Bùng kèo)</option>
              <option value="CANCELLED">CANCELLED (Đã hủy)</option>
            </select>

            <Button
              variant="outline"
              size="icon"
              onClick={onRefreshBookings}
              loading={loadingBookings}
              className="h-9 w-9 rounded-xl"
              title="Làm mới danh sách"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loadingBookings ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span>Đang nạp danh sách đơn đặt...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
              <Calendar className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="font-semibold">Không có đơn đặt nào trong ngày đã chọn.</p>
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground text-[11px] uppercase">
                    <th className="py-3 px-3">Mã Đơn</th>
                    <th className="py-3 px-3">Khách Hàng</th>
                    <th className="py-3 px-3">Sân Con</th>
                    <th className="py-3 px-3">Khung Giờ</th>
                    <th className="py-3 px-3">Tổng Tiền</th>
                    <th className="py-3 px-3">Trạng Thái</th>
                    <th className="py-3 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-foreground">
                        {b.code}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-foreground">{b.customer?.fullName ?? b.guestName}</div>
                        <div className="text-[10px] text-muted-foreground">{b.customer?.phone || b.guestPhone || b.customer?.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-foreground">{b.court.name}</span>
                        <Badge variant="outline" className="ml-1 text-[9px] py-0">
                          {SPORT_TYPE_LABELS[b.court.sportType]}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-semibold text-primary">
                        {formatMinutesToTime(b.startMinute)} - {formatMinutesToTime(b.endMinute)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-foreground">{formatVND(b.subtotal)}</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          Cọc: {formatVND(b.depositAmount)}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            b.status === 'CHECKED_IN'
                              ? 'available'
                              : b.status === 'CONFIRMED'
                              ? 'peak'
                              : b.status === 'NO_SHOW' || b.status === 'CANCELLED'
                              ? 'destructive'
                              : 'default'
                          }
                          className="font-semibold"
                        >
                          {b.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5">
                        {b.status === 'CONFIRMED' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setCheckInCode(b.code);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="h-7 text-xs px-2.5 font-bold"
                            >
                              Check-in
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onMarkNoShow(b.id)}
                              className="h-7 text-xs px-2"
                              title="Đánh dấu khách bùng kèo"
                            >
                              No-show
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
