import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { VenueItem } from '../api/venues-api';
import {
  getCourtSlotsApi,
  createBookingHoldApi,
  getActiveBookingHoldApi,
} from '../../booking/api/booking-api';
import { SlotMatrix, type SelectedSlot } from '../../booking/components/slot-matrix';
import { BookingCourtTabs } from '../../booking/components/booking-court-tabs';
import { BookingDateSelector } from '../../booking/components/booking-date-selector';
import { BookingSummaryBar } from '../../booking/components/booking-summary-bar';
import { Button } from '../../../components/ui/button';
import { useAuthStore } from '../../../lib/auth-store';
import { formatLocalDateToYMD, cn } from '../../../lib/utils';
import { Calendar, ShieldAlert } from 'lucide-react';

export interface VenueBookingSectionProps {
  venue: VenueItem;
  initialCourtId?: string;
  className?: string;
  showHeader?: boolean;
}

export function VenueBookingSection({
  venue,
  initialCourtId,
  className,
  showHeader = true,
}: VenueBookingSectionProps): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const courts = venue.courts || [];
  const courtIdParam = searchParams.get('courtId');
  const selectedCourtId = courtIdParam || initialCourtId || courts[0]?.id;
  const currentCourt = courts.find((c) => c.id === selectedCourtId) || courts[0];

  const [weekOffset, setWeekOffset] = React.useState<number>(0);

  const weekInfo = React.useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + weekOffset * 7);

    const days: { dateStr: string; dayLabel: string; dateNum: string; isToday: boolean; isPast: boolean }[] = [];
    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    const todayDateStr = formatLocalDateToYMD(now);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const dateStr = formatLocalDateToYMD(d);
      const isToday = dateStr === todayDateStr;
      const isPast = dateStr < todayDateStr;
      const dayLabel = isToday ? 'Hôm nay' : dayNames[i];
      const dateNum = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      days.push({ dateStr, dayLabel, dateNum, isToday, isPast });
    }

    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    const rangeLabel = `${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')} - ${String(sunday.getDate()).padStart(2, '0')}/${String(sunday.getMonth() + 1).padStart(2, '0')}/${sunday.getFullYear()}`;

    return {
      mondayStr: days[0].dateStr,
      rangeLabel,
      days,
    };
  }, [weekOffset]);

  const todayStr = formatLocalDateToYMD(new Date());
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
  const [requiresApproval, setRequiresApproval] = React.useState<boolean>(false);

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
      if (err?.code === 'HOLD_LIMIT') {
        try {
          const existingHold = await getActiveBookingHoldApi();
          if (existingHold) {
            navigate(`/checkout/hold/${existingHold.id}`);
            return;
          }
        } catch {
          // ignore
        }
      }
      setHoldError(err?.message || 'Không thể giữ chỗ. Vui lòng thử lại sau.');
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
      requiresApproval,
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Optional Top Section Header */}
      {showHeader && (
        <div className="space-y-1 pb-4 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              Ma Trận Đặt Sân Thời Gian Thực
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Chọn sân con, ngày thi đấu và khung giờ còn trống để giữ chỗ 10 phút.
          </p>
        </div>
      )}

      {/* Active Hold Alert */}
      {activeHold && (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">Bạn đang có 1 khung giờ đang giữ chỗ</p>
              <p className="text-xs text-muted-foreground font-mono-num">
                Hoàn tất thanh toán trước khi thời gian giữ chỗ kết thúc.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate(`/checkout/hold/${activeHold.id}`)}
            className="shrink-0 font-bold"
          >
            Tiếp tục thanh toán
          </Button>
        </div>
      )}

      {/* 1. Court Selector Tabs */}
      <BookingCourtTabs
        courts={courts}
        selectedCourtId={selectedCourtId || ''}
        onSelectCourt={(courtId) => {
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.set('courtId', courtId);
              return next;
            },
            { replace: true },
          );
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

      {/* Toggle duyệt thành viên trước (kèo công khai) */}
      <label className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-4 py-3 cursor-pointer select-none hover:bg-secondary/40 transition-colors">
        <input
          type="checkbox"
          checked={requiresApproval}
          onChange={(e) => setRequiresApproval(e.target.checked)}
          className="h-4 w-4 accent-primary rounded cursor-pointer"
        />
        <span className="text-xs sm:text-sm">
          <span className="font-semibold text-foreground">Duyệt thành viên trước</span>
          <span className="text-muted-foreground"> (kèo cần bạn duyệt người tham gia trước khi cho phép vào sân)</span>
        </span>
      </label>

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
