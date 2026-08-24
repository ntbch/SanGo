import { ChevronLeft, ChevronRight, ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { useMemo, useState, type ReactElement } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { useToast } from '../../../components/ui/use-toast';
import { formatVnd, minutesToTime } from '../../public/format';
import { useVenue } from '../../public/queries';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { WeeklyGrid } from '../components/weekly-grid';
import { useCourtWeeklySlots, useCreateBookingHold } from '../queries';
import { validateContiguousSlots } from '../slot-utils';
import type { SelectedSlot, TimeSlot } from '../types';

export function BookingCalendarPage(): ReactElement {
  const { slug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  const venueQuery = useVenue(slug);
  const venue = venueQuery.data;
  const courts = useMemo(() => venue?.courts ?? [], [venue]);

  // Chọn court: từ query param courtId hoặc court đầu tiên
  const initialCourtId = searchParams.get('courtId') || courts[0]?.id || '';
  const [selectedCourtId, setSelectedCourtId] = useState<string>(initialCourtId);

  const activeCourt = useMemo(() => {
    return courts.find((c) => c.id === selectedCourtId) || courts[0];
  }, [courts, selectedCourtId]);

  // Ngày bắt đầu tuần (mặc định hôm nay YYYY-MM-DD)
  const [fromDate, setFromDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const slotsQuery = useCourtWeeklySlots(activeCourt?.id, fromDate);
  const holdMutation = useCreateBookingHold();

  // Các slot đang chọn
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);

  // Đổi tuần
  const changeWeek = (offsetDays: number) => {
    const [y, m, d] = fromDate.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    curr.setDate(curr.getDate() + offsetDays);
    setFromDate(curr.toISOString().slice(0, 10));
    setSelectedSlots([]);
  };

  // Chọn/bỏ chọn slot
  const handleToggleSlot = (date: string, slot: TimeSlot) => {
    if (slot.state !== 'AVAILABLE') return;

    const isSelected = selectedSlots.some(
      (s) => s.date === date && s.startMinute === slot.startMinute,
    );

    let nextSlots: SelectedSlot[];
    if (isSelected) {
      nextSlots = selectedSlots.filter(
        (s) => !(s.date === date && s.startMinute === slot.startMinute),
      );
    } else {
      // Nếu chọn khác ngày với slot hiện tại -> reset ngày mới
      const sameDaySlots = selectedSlots.filter((s) => s.date === date);
      const price = slot.price ?? activeCourt?.defaultPricePerSlot ?? 0;
      nextSlots = [
        ...sameDaySlots,
        { date, startMinute: slot.startMinute, endMinute: slot.endMinute, price },
      ];
    }

    // Kiểm tra tính liền kề
    if (nextSlots.length > 1) {
      const validation = validateContiguousSlots(nextSlots);
      if (!validation.valid) {
        toast({
          variant: 'destructive',
          title: 'Slot không liền kề',
          description: validation.message ?? 'Vui lòng chọn các khung giờ liền kề nhau liên tục.',
        });
        return;
      }
    }

    setSelectedSlots(nextSlots);
  };

  // Tính tổng tiền & cọc
  const { subtotal, depositAmount } = useMemo(() => {
    const total = selectedSlots.reduce(
      (sum, s) => sum + (s.price ?? activeCourt?.defaultPricePerSlot ?? 0),
      0,
    );
    const percent = venue?.depositPercent ?? 30;
    const deposit = Math.round((total * percent) / 100);
    return { subtotal: total, depositAmount: deposit };
  }, [selectedSlots, activeCourt, venue]);

  // Xử lý Giữ chỗ & Thanh toán
  const handleHoldAndPay = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Yêu cầu đăng nhập',
        description: 'Vui lòng đăng nhập để tiến hành giữ chỗ và thanh toán.',
      });
      navigate(
        `/login?redirect=/venues/${slug}/book${activeCourt ? `?courtId=${activeCourt.id}` : ''}`,
      );
      return;
    }

    if (selectedSlots.length === 0 || !activeCourt) return;

    const validation = validateContiguousSlots(selectedSlots);
    if (!validation.valid) {
      toast({
        variant: 'destructive',
        title: 'Không thể giữ chỗ',
        description: validation.message,
      });
      return;
    }

    const date = selectedSlots[0].date;
    const sortedSlots = [...selectedSlots].sort((a, b) => a.startMinute - b.startMinute);

    try {
      const hold = await holdMutation.mutateAsync({
        courtId: activeCourt.id,
        date,
        slots: sortedSlots.map((s) => ({ startMinute: s.startMinute, endMinute: s.endMinute })),
      });

      navigate(`/thanh-toan/checkout/${hold.id}`);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Giữ chỗ không thành công',
        description: friendlyApiMessage(err),
      });
    }
  };

  if (venueQuery.isPending) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (venueQuery.isError || !venue) {
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-4">
        <p className="text-muted-foreground">Không tìm thấy thông tin cụm sân.</p>
        <Button asChild variant="outline">
          <Link to="/venues">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
            <Link to={`/venues/${slug}`}>
              <ArrowLeft className="size-4" aria-hidden /> {venue.name}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Chọn giờ đặt sân</h1>
          <p className="text-sm text-muted-foreground">
            {venue.address} · Giờ mở cửa: {minutesToTime(venue.openMinute)} –{' '}
            {minutesToTime(venue.closeMinute)}
          </p>
        </div>
      </header>

      {/* Court Tabs & Week navigator */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        {/* Danh sách court */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Chọn sân con">
          {courts.map((court) => (
            <Button
              key={court.id}
              type="button"
              variant={court.id === activeCourt?.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedCourtId(court.id);
                setSelectedSlots([]);
              }}
              className="rounded-full font-medium"
            >
              {court.name} ({court.slotMinutes}')
            </Button>
          ))}
        </div>

        {/* Chuyển tuần */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeWeek(-7)}
            aria-label="Tuần trước"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2">
            <Calendar className="size-4 text-primary" aria-hidden />
            <span>
              Bắt đầu: {fromDate.slice(8, 10)}/{fromDate.slice(5, 7)}/{fromDate.slice(0, 4)}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => changeWeek(7)} aria-label="Tuần sau">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Weekly Slot Grid */}
      {slotsQuery.isPending ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : slotsQuery.isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">
          Không tải được lịch tuần của sân con. Vui lòng thử lại sau.
        </div>
      ) : (
        <WeeklyGrid
          byDate={slotsQuery.data?.byDate ?? []}
          fromDate={fromDate}
          slotMinutes={activeCourt?.slotMinutes ?? 60}
          openMinute={venue.openMinute}
          closeMinute={venue.closeMinute}
          selectedSlots={selectedSlots}
          onToggleSlot={handleToggleSlot}
        />
      )}

      {/* Sticky Bottom Bar / Action card */}
      <Card className="sticky bottom-4 border-primary/40 shadow-lg bg-card/95 backdrop-blur-xs">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="space-y-1">
            {selectedSlots.length > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="success">Đã chọn {selectedSlots.length} slot</Badge>
                  <span className="text-xs text-muted-foreground">
                    {selectedSlots[0].date} (
                    {minutesToTime(Math.min(...selectedSlots.map((s) => s.startMinute)))} –{' '}
                    {minutesToTime(Math.max(...selectedSlots.map((s) => s.endMinute)))})
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Tạm tính: </span>
                  <strong className="text-foreground text-base">{formatVnd(subtotal)}</strong>
                  <span className="text-xs text-muted-foreground ml-2">
                    (Cọc {venue.depositPercent}% = {formatVnd(depositAmount)})
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nhấp vào các ô màu xanh để chọn khung giờ bạn muốn chơi (chọn liền kề).
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedSlots.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => setSelectedSlots([])}>
                Xoá chọn
              </Button>
            ) : null}
            <Button
              disabled={selectedSlots.length === 0 || holdMutation.isPending}
              onClick={() => {
                void handleHoldAndPay();
              }}
              className="font-semibold"
            >
              {holdMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Giữ chỗ & Thanh toán →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
