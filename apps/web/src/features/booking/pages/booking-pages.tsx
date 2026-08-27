import React from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVenueDetailApi } from '../../venues/api/venues-api';
import {
  getCourtSlotsApi,
  createBookingHoldApi,
  getBookingHoldApi,
  applyHoldVoucherApi,
  createCheckoutApi,
  getMyBookingsApi,
  cancelBookingApi,
} from '../api/booking-api';
import { SlotMatrix, SelectedSlot } from '../components/slot-matrix';
import { HoldTimer } from '../components/hold-timer';
import { TicketCard } from '../components/ticket-card';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/skeleton';
import { useAuthStore } from '../../../lib/auth-store';
import { formatMinutesToTime, formatVND, cn } from '../../../lib/utils';
import { SPORT_LABELS } from '../../../lib/constants';
import {
  Calendar,
  CheckCircle2,
  Ticket,
  ShieldCheck,
  CreditCard,
  Wallet,
  Tag,
  ArrowRight,
  MapPin,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function BookingCalendarPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const courtIdParam = searchParams.get('courtId');

  // Lấy thông tin cụm sân và danh sách sân con
  const { data: venue, isLoading: venueLoading } = useQuery({
    queryKey: ['venue-detail', slug],
    queryFn: () => getVenueDetailApi(slug || ''),
    enabled: Boolean(slug),
  });

  const courts = venue?.courts || [];
  const selectedCourtId = courtIdParam || courts[0]?.id;
  const currentCourt = courts.find((c) => c.id === selectedCourtId) || courts[0];

  // Quản lý tuần (0 = tuần hiện tại, 1 = tuần sau, tối đa 8 tuần tới)
  const [weekOffset, setWeekOffset] = React.useState<number>(0);

  // Tính toán 7 ngày của tuần đang chọn từ Thứ 2 đến Chủ Nhật
  const weekInfo = React.useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 là CN, 1 là T2...
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + weekOffset * 7);

    const days: { dateStr: string; dayLabel: string; dateNum: string; isToday: boolean; isPast: boolean }[] = [];
    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    const todayDateStr = now.toISOString().slice(0, 10);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getTime() + i * 86_400_000);
      const dateStr = d.toISOString().slice(0, 10);
      const isToday = dateStr === todayDateStr;
      const isPast = dateStr < todayDateStr;
      const dayLabel = isToday ? 'Hôm nay' : dayNames[i];
      const dateNum = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      days.push({ dateStr, dayLabel, dateNum, isToday, isPast });
    }

    const sunday = new Date(monday.getTime() + 6 * 86_400_000);
    const rangeLabel = `${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')} - ${String(sunday.getDate()).padStart(2, '0')}/${String(sunday.getMonth() + 1).padStart(2, '0')}/${sunday.getFullYear()}`;

    return {
      mondayStr: days[0].dateStr,
      rangeLabel,
      days,
    };
  }, [weekOffset]);

  // Khởi tạo ngày chọn (mặc định hôm nay hoặc ngày đầu khả dụng của tuần)
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = React.useState<string>(todayStr);
  const [selectedSlot, setSelectedSlot] = React.useState<SelectedSlot | null>(null);

  // Tự động chuyển ngày chọn khi đổi tuần
  React.useEffect(() => {
    const isSelectedInWeek = weekInfo.days.some((d) => d.dateStr === selectedDate);
    if (!isSelectedInWeek) {
      const firstAvailableDay = weekInfo.days.find((d) => !d.isPast) || weekInfo.days[0];
      setSelectedDate(firstAvailableDay.dateStr);
      setSelectedSlot(null);
    }
  }, [weekInfo, selectedDate]);

  // Lấy ma trận slot trống trọn vẹn 7 ngày trong tuần từ server
  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['court-slots', selectedCourtId, weekInfo.mondayStr],
    queryFn: () => getCourtSlotsApi(selectedCourtId, weekInfo.mondayStr, 7),
    enabled: Boolean(selectedCourtId),
  });

  const daySlots = slotsData?.byDate?.find((d) => d.date === selectedDate)?.slots || [];

  // Mutation tạo giữ chỗ 10 phút
  const holdMutation = useMutation({
    mutationFn: createBookingHoldApi,
    onSuccess: (hold) => {
      navigate(`/checkout/hold/${hold.id}`);
    },
  });

  const handleHoldSubmit = () => {
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    if (!selectedSlot || !selectedCourtId) return;

    holdMutation.mutate({
      courtId: selectedCourtId,
      date: selectedSlot.date,
      startMinute: selectedSlot.startMinute,
      endMinute: selectedSlot.endMinute,
    });
  };

  if (venueLoading) {
    return (
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="w-full px-4 py-16 text-center space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Không tìm thấy cụm sân.</p>
        <Link to="/venues">
          <Button size="sm" variant="outline">Quay lại</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 space-y-8 pb-32">
      {/* Top Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to={`/venues/${venue.slug || venue.id}`} className="hover:text-primary transition-colors">
            {venue.name}
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold">Chọn Lịch Đặt Sân</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-black text-foreground">
          Ma Trận Đặt Sân Thời Gian Thực
        </h1>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>{venue.address}, {venue.district}, {venue.city}</span>
        </p>
      </div>

      {/* 1. Court Selector Tabs */}
      {courts.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            1. Chọn sân con ({courts.length} sân)
          </label>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {courts.map((court) => {
              const isSelected = (selectedCourtId || courts[0].id) === court.id;
              return (
                <button
                  key={court.id}
                  type="button"
                  onClick={() => {
                    setSearchParams({ courtId: court.id });
                    setSelectedSlot(null);
                  }}
                  className={cn(
                    'px-4 py-2.5 rounded-2xl border text-left shrink-0 transition-all cursor-pointer',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-emerald-500/20'
                      : 'bg-card border-border/80 text-foreground hover:bg-secondary/60',
                  )}
                >
                  <p className="text-xs sm:text-sm font-bold">{court.name}</p>
                  <p
                    className={cn(
                      'text-[10px]',
                      isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground',
                    )}
                  >
                    {SPORT_LABELS[court.sportType] || court.sportType} · {court.slotMinutes || 60}p
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Week Navigator & 7-Day Date Selector */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            2. Chọn ngày & tuần thi đấu
          </label>

          {/* Week Controls */}
          <div className="flex items-center gap-2 bg-secondary/40 border border-border/70 p-1 rounded-2xl">
            <button
              type="button"
              disabled={weekOffset <= 0}
              onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-xs font-bold font-mono-num px-2 text-foreground">
              Tuần: {weekInfo.rangeLabel}
            </span>

            <button
              type="button"
              disabled={weekOffset >= 8}
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {weekOffset > 0 && (
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className="ml-1 px-2.5 py-1 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold shadow-xs cursor-pointer"
              >
                Tuần này
              </button>
            )}
          </div>
        </div>

        {/* 7 Days of Selected Week Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {weekInfo.days.map((d) => {
            const isSelected = selectedDate === d.dateStr;
            const daySlotItems = slotsData?.byDate?.find((x) => x.date === d.dateStr)?.slots || [];
            const availableCount = daySlotItems.filter((s) => s.state === 'AVAILABLE').length;

            return (
              <button
                key={d.dateStr}
                type="button"
                disabled={d.isPast}
                onClick={() => {
                  setSelectedDate(d.dateStr);
                  setSelectedSlot(null);
                }}
                className={cn(
                  'p-3 rounded-2xl border text-center transition-all cursor-pointer relative flex flex-col justify-between min-h-[76px]',
                  d.isPast && 'opacity-40 bg-muted/20 border-border/30 cursor-not-allowed',
                  isSelected &&
                    'bg-primary text-primary-foreground border-primary shadow-md shadow-emerald-500/20 ring-2 ring-primary/30 scale-[1.02] z-10',
                  !isSelected &&
                    !d.isPast &&
                    'bg-card border-border/80 text-foreground hover:bg-secondary/60 hover:border-primary/50',
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={cn(
                      'text-[11px] font-bold',
                      isSelected ? 'text-primary-foreground' : d.isToday ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {d.dayLabel}
                  </span>
                  {d.isToday && (
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        isSelected ? 'bg-white' : 'bg-primary animate-pulse',
                      )}
                    />
                  )}
                </div>

                <span className="font-mono-num font-black text-sm sm:text-base block my-0.5">
                  {d.dateNum}
                </span>

                <span
                  className={cn(
                    'text-[10px] font-mono-num block truncate',
                    isSelected
                      ? 'text-primary-foreground/80'
                      : availableCount > 0
                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-muted-foreground',
                  )}
                >
                  {d.isPast ? 'Đã qua' : availableCount > 0 ? `${availableCount} slot trống` : 'Hết slot'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Slot Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            3. Chọn khung giờ thi đấu ({currentCourt?.name || 'Sân con'})
          </label>
          <span className="text-xs text-muted-foreground font-mono-num">
            {new Date(selectedDate).toLocaleDateString('vi-VN')}
          </span>
        </div>

        <SlotMatrix
          date={selectedDate}
          slots={daySlots}
          defaultPrice={currentCourt?.defaultPricePerSlot || 250000}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
          isLoading={slotsLoading}
          courtName={currentCourt?.name}
        />
      </div>

      {/* Floating Bottom Summary & Hold CTA Bar */}
      {selectedSlot && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-8 sm:right-8 lg:left-16 lg:right-16 z-40 animate-in slide-in-from-bottom-5 duration-200">
          <div className="rounded-3xl border border-primary/40 bg-card/95 backdrop-blur-md p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  {currentCourt?.name} · {formatMinutesToTime(selectedSlot.startMinute)} - {formatMinutesToTime(selectedSlot.endMinute)}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono-num">
                  Ngày {new Date(selectedSlot.date).toLocaleDateString('vi-VN')} · Tạm tính: <strong className="text-primary font-bold">{formatVND(selectedSlot.price)}</strong>
                </p>
              </div>
            </div>

            <Button
              size="lg"
              disabled={holdMutation.isPending}
              onClick={handleHoldSubmit}
              className="w-full sm:w-auto font-bold gap-2 shadow-lg shadow-emerald-500/25 px-6"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{holdMutation.isPending ? 'Đang khóa slot...' : 'Giữ Chỗ 10 Phút & Thanh Toán'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CheckoutHoldPage(): React.ReactElement {
  const { holdId } = useParams<{ holdId: string }>();
  const [voucherCode, setVoucherCode] = React.useState('');
  const [voucherError, setVoucherError] = React.useState<string | null>(null);
  const [voucherSuccess, setVoucherSuccess] = React.useState<string | null>(null);
  const [paymentType, setPaymentType] = React.useState<'DEPOSIT' | 'FULL'>('DEPOSIT');
  const [paymentGateway, setPaymentGateway] = React.useState<'WALLET' | 'VNPAY'>('WALLET');

  const { data: hold, isLoading, isError, refetch } = useQuery({
    queryKey: ['booking-hold', holdId],
    queryFn: () => getBookingHoldApi(holdId || ''),
    enabled: Boolean(holdId),
    refetchInterval: 10000, // Cập nhật trạng thái mỗi 10 giây
  });

  const voucherMutation = useMutation({
    mutationFn: ({ holdId, code }: { holdId: string; code: string }) =>
      applyHoldVoucherApi(holdId, code),
    onSuccess: (data) => {
      setVoucherSuccess(`Đã áp dụng mã thành công! Giảm ${formatVND(data.discountAmount || 50000)}`);
      setVoucherError(null);
      refetch();
    },
    onError: (err: any) => {
      setVoucherError(err.message || 'Mã giảm giá không hợp lệ hoặc không áp dụng cho khung giờ này');
      setVoucherSuccess(null);
    },
  });

  const handleApplyVoucher = (codeToApply?: string) => {
    const code = (codeToApply || voucherCode).trim().toUpperCase();
    if (!code || !holdId) return;
    setVoucherCode(code);
    voucherMutation.mutate({ holdId, code });
  };

  const checkoutMutation = useMutation({
    mutationFn: createCheckoutApi,
    onSuccess: (data) => {
      if (data.mode === 'mock' || data.paymentUrl.includes('/api/v1/payments/mock/callback')) {
        window.location.href = data.paymentUrl;
      } else {
        window.location.href = data.paymentUrl;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !hold) {
    return (
      <div className="w-full px-4 py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <XCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Không tìm thấy phiên giữ chỗ</h2>
        <p className="text-xs text-muted-foreground">
          Phiên giữ chỗ này có thể đã hết hạn hoặc đã được thanh toán hoàn tất.
        </p>
        <Link to="/venues">
          <Button size="sm">Đặt lại sân</Button>
        </Link>
      </div>
    );
  }

  const subtotal = hold.subtotal || 250000;
  const discount = hold.discountAmount || 0;
  const finalTotal = hold.finalAmount ?? Math.max(0, subtotal - discount);
  const depositPercent = hold.court?.venue.depositPercent ?? 30;
  const depositAmount = Math.round((finalTotal * depositPercent) / 100);

  const amountToPay = paymentType === 'FULL' ? finalTotal : depositAmount;

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 space-y-6 max-w-4xl mx-auto">
      {/* 1. 10:00 Hold Countdown Timer */}
      <HoldTimer
        expiresAt={hold.expiresAt}
        onExpire={() => {
          refetch();
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Order Details & Payment Method */}
        <div className="md:col-span-2 space-y-6">
          {/* Booking Summary */}
          <Card className="p-5 border border-border/80 bg-card space-y-4">
            <h3 className="text-sm font-bold text-foreground">Chi Tiết Đơn Đặt Sân</h3>

            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/50 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cụm sân:</span>
                <span className="font-bold text-foreground">{hold.court?.venue.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sân con:</span>
                <span className="font-bold text-foreground">{hold.court?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Thời gian:</span>
                <span className="font-mono-num font-bold text-primary">
                  {formatMinutesToTime(hold.startMinute)} - {formatMinutesToTime(hold.endMinute)} ({new Date(hold.date).toLocaleDateString('vi-VN')})
                </span>
              </div>
            </div>
          </Card>

          {/* Payment Type Selection (Deposit 30% vs Full 100%) */}
          <Card className="p-5 border border-border/80 bg-card space-y-3">
            <h3 className="text-sm font-bold text-foreground">Chọn Mức Thanh Toán</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentType('DEPOSIT')}
                className={cn(
                  'p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1',
                  paymentType === 'DEPOSIT'
                    ? 'bg-primary/10 border-primary ring-2 ring-primary/30'
                    : 'bg-card border-border/70 hover:bg-secondary/40',
                )}
              >
                <span className="text-xs font-bold text-foreground block">
                  Đặt cọc {depositPercent}%
                </span>
                <span className="font-mono-num font-black text-sm text-primary block">
                  {formatVND(depositAmount)}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Trả phần còn lại tại sân khi check-in
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('FULL')}
                className={cn(
                  'p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1',
                  paymentType === 'FULL'
                    ? 'bg-primary/10 border-primary ring-2 ring-primary/30'
                    : 'bg-card border-border/70 hover:bg-secondary/40',
                )}
              >
                <span className="text-xs font-bold text-foreground block">
                  Thanh toán toàn bộ 100%
                </span>
                <span className="font-mono-num font-black text-sm text-primary block">
                  {formatVND(finalTotal)}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Không cần thanh toán thêm tại quầy
                </span>
              </button>
            </div>
          </Card>

          {/* Voucher Promotion Code Box */}
          <Card className="p-5 border border-border/80 bg-card space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Tag className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Mã Ưu Đãi &amp; Voucher Giảm Giá</h3>
              </div>
              {hold.voucherId && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                  Đã Áp Dụng
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Nhập mã voucher (ví dụ: SANGOVIP)"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  className="h-9 text-xs uppercase font-mono-num bg-background pl-8"
                />
                <Ticket className="h-4 w-4 text-muted-foreground absolute left-2.5 top-2.5" />
              </div>
              <Button
                type="button"
                size="sm"
                disabled={!voucherCode.trim() || voucherMutation.isPending}
                onClick={() => handleApplyVoucher()}
                className="h-9 px-4 text-xs font-bold shrink-0 cursor-pointer"
              >
                {voucherMutation.isPending ? 'Đang kiểm tra...' : 'Áp Dụng'}
              </Button>
            </div>

            {/* Quick voucher suggestion chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-muted-foreground font-semibold block">Mã gợi ý cho bạn:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { code: 'SANGOVIP', desc: 'Giảm 50.000 đ' },
                  { code: 'GIAM20', desc: 'Giảm 20%' },
                  { code: 'SANGOHE2026', desc: 'Giảm 30.000 đ' },
                ].map((v) => (
                  <button
                    key={v.code}
                    type="button"
                    onClick={() => handleApplyVoucher(v.code)}
                    className="px-2.5 py-1 rounded-lg bg-secondary/70 hover:bg-primary/15 hover:border-primary/40 border border-border text-[11px] font-bold text-foreground transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="font-mono-num text-primary">{v.code}</span>
                    <span className="text-[9px] text-muted-foreground">({v.desc})</span>
                  </button>
                ))}
              </div>
            </div>

            {voucherSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{voucherSuccess}</span>
              </div>
            )}

            {voucherError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
                <XCircle className="h-4 w-4 shrink-0" />
                <span>{voucherError}</span>
              </div>
            )}
          </Card>

          {/* Payment Gateway Selector */}
          <Card className="p-5 border border-border/80 bg-card space-y-3">
            <h3 className="text-sm font-bold text-foreground">Phương Thức Thanh Toán</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentGateway('WALLET')}
                className={cn(
                  'p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3',
                  paymentGateway === 'WALLET'
                    ? 'bg-primary/10 border-primary ring-2 ring-primary/30'
                    : 'bg-card border-border/70 hover:bg-secondary/40',
                )}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block">Ví SanGo</span>
                  <span className="text-[10px] text-muted-foreground block">Thanh toán tức thì 0đ phí</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentGateway('VNPAY')}
                className={cn(
                  'p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3',
                  paymentGateway === 'VNPAY'
                    ? 'bg-primary/10 border-primary ring-2 ring-primary/30'
                    : 'bg-card border-border/70 hover:bg-secondary/40',
                )}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block">Cổng VNPAY QR</span>
                  <span className="text-[10px] text-muted-foreground block">Quét mã Banking & Thẻ ATM</span>
                </div>
              </button>
            </div>
          </Card>
        </div>

        {/* Right 1 Column: Cost Breakdown & Checkout CTA */}
        <div className="md:col-span-1 space-y-4">
          <Card className="p-5 border border-border/80 bg-card space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border/60">
              Tổng Kết Chi Phí
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Tiền sân niêm yết</span>
                <span className="font-mono-num font-semibold text-foreground">{formatVND(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Giảm giá voucher</span>
                  <span className="font-mono-num">- {formatVND(discount)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-border/60 flex items-center justify-between font-bold text-sm">
                <span>Tổng giá trị đơn</span>
                <span className="font-mono-num text-foreground">{formatVND(finalTotal)}</span>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] font-bold text-primary block">
                    Số tiền cần thanh toán
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ({paymentType === 'DEPOSIT' ? `Cọc ${depositPercent}%` : 'Toàn bộ'})
                  </span>
                </div>
                <span className="font-mono-num font-black text-lg sm:text-xl text-primary">
                  {formatVND(amountToPay)}
                </span>
              </div>
            </div>

            <Button
              size="lg"
              disabled={checkoutMutation.isPending || hold.status !== 'ACTIVE'}
              onClick={() => checkoutMutation.mutate({ holdId: hold.id, type: paymentType })}
              className="w-full font-bold gap-2 shadow-lg shadow-emerald-500/25"
            >
              <CreditCard className="h-4 w-4" />
              <span>{checkoutMutation.isPending ? 'Đang tạo giao dịch...' : 'Xác Nhận Thanh Toán'}</span>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function PaymentResultPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const txnRef = searchParams.get('txnRef') || 'TXN-SUCCESS';
  const amount = Number(searchParams.get('amount')) || 0;

  return (
    <div className="w-full px-4 py-16 text-center space-y-6 max-w-md mx-auto animate-in fade-in duration-200">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-inner">
        <CheckCircle2 className="h-8 w-8" />
      </div>

      <div className="space-y-1.5">
        <h1 className="text-xl sm:text-2xl font-black text-foreground">
          Thanh Toán Đặt Sân Thành Công!
        </h1>
        <p className="text-xs text-muted-foreground">
          Vé đặt sân của bạn đã được xác nhận. Mã QR Check-in đã sẵn sàng.
        </p>
      </div>

      <Card className="p-4 border border-border/80 bg-card space-y-2 text-xs text-left">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Mã giao dịch:</span>
          <span className="font-mono-num font-bold text-foreground">{txnRef}</span>
        </div>
        {amount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Số tiền đã trả:</span>
            <span className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
              {formatVND(amount)}
            </span>
          </div>
        )}
      </Card>

      <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
        <Link to="/bookings">
          <Button size="lg" className="w-full sm:w-auto font-bold gap-2 shadow-xs">
            <Ticket className="h-4 w-4" />
            <span>Xem Vé Của Tôi</span>
          </Button>
        </Link>
        <Link to="/">
          <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold">
            <span>Về Trang Chủ</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function MyBookingsPage(): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-bookings', activeTab],
    queryFn: () =>
      getMyBookingsApi({
        status:
          activeTab === 'UPCOMING'
            ? 'CONFIRMED'
            : activeTab === 'COMPLETED'
            ? 'COMPLETED'
            : 'CANCELLED',
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelBookingApi(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      refetch();
    },
  });

  const handleCancelBooking = async (bookingId: string, reason: string) => {
    await cancelMutation.mutateAsync({ id: bookingId, reason });
  };

  const tickets = data?.items || [];

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-foreground">Vé Đặt Sân Của Tôi</h1>
          <p className="text-xs text-muted-foreground">
            Quản lý lịch thi đấu, mã QR check-in vào sân và lịch sử đặt sân
          </p>
        </div>

        <Link to="/venues">
          <Button size="sm" className="font-bold text-xs gap-1.5 shadow-xs">
            <Calendar className="h-4 w-4" />
            <span>Đặt thêm sân mới</span>
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('UPCOMING')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
            activeTab === 'UPCOMING'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
          )}
        >
          Sắp Tới
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('COMPLETED')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
            activeTab === 'COMPLETED'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
          )}
        >
          Đã Hoàn Thành
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CANCELLED')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
            activeTab === 'CANCELLED'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
          )}
        >
          Đã Hủy
        </button>
      </div>

      {/* Ticket List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <div className="py-16 text-center space-y-3">
          <p className="text-xs font-semibold text-destructive">Không thể tải danh sách vé.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      ) : tickets.length > 0 ? (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onCancel={activeTab === 'UPCOMING' ? handleCancelBooking : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-3xl border border-border/80 bg-card p-8 space-y-3 max-w-md mx-auto">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <Ticket className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Chưa có vé nào trong mục này</h3>
          <p className="text-xs text-muted-foreground">
            Khám phá các cụm sân và chọn khung giờ thích hợp để bắt đầu trận đấu.
          </p>
          <div className="pt-2">
            <Link to="/venues">
              <Button size="sm" className="font-bold text-xs">
                Tìm sân ngay
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
