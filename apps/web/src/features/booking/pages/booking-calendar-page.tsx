import React from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getVenueDetailApi } from '../../venues/api/venues-api';
import {
  getCourtSlotsApi,
  createBookingHoldApi,
  getActiveBookingHoldApi,
} from '../api/booking-api';
import { SlotMatrix, type SelectedSlot } from '../components/slot-matrix';
import { BookingCourtTabs } from '../components/booking-court-tabs';
import { BookingDateSelector } from '../components/booking-date-selector';
import { BookingSummaryBar } from '../components/booking-summary-bar';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { useAuthStore } from '../../../lib/auth-store';
import { MapPin } from 'lucide-react';

export function BookingCalendarPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const courtIdParam = searchParams.get('courtId');

  const { data: venue, isLoading: venueLoading } = useQuery({
    queryKey: ['venue-detail', slug],
    queryFn: () => getVenueDetailApi(slug || ''),
    enabled: Boolean(slug),
  });

  const courts = venue?.courts || [];
  const selectedCourtId = courtIdParam || courts[0]?.id;
  const currentCourt = courts.find((c) => c.id === selectedCourtId) || courts[0];

  const [weekOffset, setWeekOffset] = React.useState<number>(0);

  const weekInfo = React.useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
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

  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = React.useState<string>(todayStr);
  const [selectedSlot, setSelectedSlot] = React.useState<SelectedSlot | null>(null);

  React.useEffect(() => {
    const isSelectedInWeek = weekInfo.days.some((d) => d.dateStr === selectedDate);
    if (!isSelectedInWeek) {
      const firstAvailableDay = weekInfo.days.find((d) => !d.isPast) || weekInfo.days[0];
      setSelectedDate(firstAvailableDay.dateStr);
      setSelectedSlot(null);
    }
  }, [weekInfo, selectedDate]);

  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['court-slots', selectedCourtId, weekInfo.mondayStr],
    queryFn: () => getCourtSlotsApi(selectedCourtId, weekInfo.mondayStr, 7),
    enabled: Boolean(selectedCourtId),
  });

  const daySlots = slotsData?.byDate?.find((d) => d.date === selectedDate)?.slots || [];

  const [holdError, setHoldError] = React.useState<string | null>(null);

  const { data: activeHold } = useQuery({
    queryKey: ['active-booking-hold'],
    queryFn: getActiveBookingHoldApi,
    enabled: Boolean(user),
    staleTime: 10_000,
  });

  const holdMutation = useMutation({
    mutationFn: createBookingHoldApi,
    onSuccess: (hold) => {
      setHoldError(null);
      navigate(`/checkout/hold/${hold.id}`);
    },
    onError: async (err: any) => {
      if (err.code === 'HOLD_LIMIT') {
        try {
          const existingHold = await getActiveBookingHoldApi();
          if (existingHold) {
            navigate(`/checkout/hold/${existingHold.id}`);
            return;
          }
        } catch {
          // Hiển thị thông báo backend gốc nếu không thể lấy lại hold.
        }
      }
      setHoldError(err.message || 'Không thể giữ chỗ. Vui lòng thử lại sau.');
    },
  });

  const handleHoldSubmit = () => {
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    if (!selectedSlot || !selectedCourtId) return;

    setHoldError(null);
    holdMutation.mutate({
      courtId: selectedCourtId,
      date: selectedSlot.date,
      slots: [selectedSlot.startMinute],
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

      {activeHold && (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">Bạn đang giữ một khung giờ</p>
            <p className="text-xs text-muted-foreground">Hoàn tất thanh toán trước khi thời gian giữ chỗ kết thúc.</p>
          </div>
          <Button size="sm" onClick={() => navigate(`/checkout/hold/${activeHold.id}`)}>Tiếp tục thanh toán</Button>
        </div>
      )}

      {/* 1. Court Selector Tabs */}
      <BookingCourtTabs
        courts={courts}
        selectedCourtId={selectedCourtId || ''}
        onSelectCourt={(courtId) => {
          setSearchParams({ courtId });
          setSelectedSlot(null);
        }}
      />

      {/* 2. Week Navigator & 7-Day Date Selector */}
      <BookingDateSelector
        weekInfo={weekInfo}
        weekOffset={weekOffset}
        onWeekOffsetChange={setWeekOffset}
        selectedDate={selectedDate}
        onSelectDate={(dateStr) => {
          setSelectedDate(dateStr);
          setSelectedSlot(null);
        }}
        slotsData={slotsData}
      />

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
          onSelectSlot={(slot) => {
            setSelectedSlot(slot);
            setHoldError(null);
          }}
          isLoading={slotsLoading}
          courtName={currentCourt?.name}
        />
      </div>

      {/* Floating Bottom Summary & Hold CTA Bar */}
      <BookingSummaryBar
        selectedSlot={selectedSlot}
        courtName={currentCourt?.name}
        isPending={holdMutation.isPending}
        errorMessage={holdError}
        onSubmitHold={handleHoldSubmit}
      />
    </div>
  );
}
