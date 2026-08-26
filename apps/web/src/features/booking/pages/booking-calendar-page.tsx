import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Loader2,
  MapPin,
} from 'lucide-react';
import { useMemo, useState, type ReactElement } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { useToast } from '../../../components/ui/use-toast';
import { formatVnd, minutesToTime } from '../../public/format';
import { formatDate, toInputDateFormat } from '../../../lib/date-utils';
import { useVenue } from '../../public/queries';
import { useAuthStore } from '../../../lib/auth/auth-store';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { WeeklyGrid } from '../components/weekly-grid';
import { useCourtWeeklySlots, useCreateBookingHold } from '../queries';
import { useMyTeams } from '../../teams/queries';
import { useFilteredAiSuggestions } from '../../ai/filtered-suggestions';
import { cn } from '../../../lib/utils';
import { validateContiguousSlots } from '../slot-utils';
import { validateOpenMatchInput } from '../../matches/match-utils';
import type { SelectedSlot, TimeSlot } from '../types';

export function BookingCalendarPage(): ReactElement {
  const { slug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
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
    return toInputDateFormat(new Date());
  });

  const slotsQuery = useCourtWeeklySlots(activeCourt?.id, fromDate);
  const holdMutation = useCreateBookingHold();
  // AI-2 (§3.13) + G2-FIX (t11): chip được lọc theo trạng thái slot hiện tại,
  // còn lại <=1 chip hợp lệ thì hook trả rỗng -> ẩn cả dải.
  const aiSuggestions = useFilteredAiSuggestions(activeCourt?.id, fromDate);

  // Các slot đang chọn
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);

  // Ghép trận mở (§3.11): công khai tìm người ghép + số người cần.
  const [isPublicMatch, setIsPublicMatch] = useState(false);
  const [slotsNeeded, setSlotsNeeded] = useState(4);

  // S2-F1: Đặt dưới tư cách Đội — chọn từ danh sách đội tôi tham gia (tuỳ chọn).
  const myTeamsQuery = useMyTeams();
  const [teamId, setTeamId] = useState<string>('');

  // Đổi tuần
  const changeWeek = (offsetDays: number) => {
    const [y, m, d] = fromDate.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    curr.setDate(curr.getDate() + offsetDays);
    setFromDate(toInputDateFormat(curr));
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
      // P1-F1: khách bấm Giữ chỗ -> /login?next=<đường hiện tại> để quay lại đúng trang.
      navigate('/login?next=' + encodeURIComponent(location.pathname + location.search));
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

    const matchValidation = validateOpenMatchInput(isPublicMatch, slotsNeeded);
    if (!matchValidation.valid) {
      toast({
        variant: 'destructive',
        title: 'Ghép trận chưa hợp lệ',
        description: matchValidation.message,
      });
      return;
    }

    const date = selectedSlots[0].date;
    const sortedSlots = [...selectedSlots].sort((a, b) => a.startMinute - b.startMinute);

    try {
      const hold = await holdMutation.mutateAsync({
        courtId: activeCourt.id,
        date,
        // CreateHoldSchema backend: mảng phút BẮT ĐẦU int, KHÔNG gửi slot object.
        slots: sortedSlots.map((s) => s.startMinute),
        ...(isPublicMatch ? { isPublicMatch: true, slotsNeeded } : {}),
        // S2-F1: gắn đội để đơn xuất hiện trong lịch sử & quỹ chia tiền của đội.
        ...(teamId ? { teamId } : {}),
      });

      navigate(`/thanh-toan/checkout/${hold.holdId}`);
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
      <div className="space-y-6" aria-busy="true">
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
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
            <Link to={`/venues/${slug}`}>
              <ArrowLeft className="size-4" aria-hidden /> {venue.name}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Chọn giờ đặt sân</h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
            <span>
              {venue.address} · Giờ mở cửa: {minutesToTime(venue.openMinute)} –{' '}
              {minutesToTime(venue.closeMinute)}
            </span>
          </p>
        </div>
      </header>

      {/* Court Tabs & Week navigator */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        {/* Danh sách court */}
        <div
          className="inline-flex flex-wrap gap-1 rounded-lg bg-muted p-1"
          role="group"
          aria-label="Chọn sân con"
        >
          {courts.map((court) => {
            const isActive = court.id === activeCourt?.id;
            return (
              <Button
                key={court.id}
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={isActive}
                onClick={() => {
                  setSelectedCourtId(court.id);
                  setSelectedSlots([]);
                  // Đổi sân con -> reset lựa chọn ghép trận (người chơi theo từng sân).
                  setIsPublicMatch(false);
                }}
                className={cn(
                  'rounded-md',
                  isActive
                    ? 'bg-card font-semibold text-foreground shadow-sm hover:bg-card'
                    : 'text-muted-foreground hover:bg-transparent hover:text-foreground',
                )}
              >
                {court.name} ({court.slotMinutes}')
              </Button>
            );
          })}
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
          <div className="flex items-center gap-1.5 px-2 text-xs font-semibold">
            <Calendar className="size-4 text-primary" aria-hidden />
            <span>
              Bắt đầu:{' '}
              <span className="font-score">
                {formatDate(fromDate)}
              </span>
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => changeWeek(7)} aria-label="Tuần sau">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Weekly Slot Grid */}
      {/* Dải gợi ý khung giờ AI-2 (§3.13) — đã lọc slot còn trống (t11) */}
      {aiSuggestions.suggestions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <Lightbulb className="size-4" aria-hidden />
            Gợi ý cho bạn
          </span>
          {aiSuggestions.suggestions.map((suggestion) => (
            <button
              key={suggestion.label + String(suggestion.startMinute)}
              type="button"
              data-testid="ai-suggestion-chip"
              title={suggestion.reason}
              onClick={() => {
                const days = slotsQuery.data?.byDate ?? [];
                for (const day of days) {
                  const match = day.slots.find(
                    (slot) =>
                      slot.startMinute === suggestion.startMinute && slot.state === 'AVAILABLE',
                  );
                  if (match !== undefined) {
                    handleToggleSlot(day.date, match);
                    return;
                  }
                }
                toast({
                  variant: 'destructive',
                  title: 'Khung giờ này không còn trống trong tuần đang xem.',
                });
              }}
              className="rounded-full border border-primary/40 bg-card px-3 py-1 text-xs font-semibold text-primary shadow-xs transition-colors hover:bg-accent"
            >
              <span className="font-score">{suggestion.label}</span>
            </button>
          ))}
        </div>
      ) : null}
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
      <Card className="sticky bottom-4 rounded-xl border-border/60 bg-card/95 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-xs">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
          {selectedSlots.length > 0 ? (
            <div className="w-full rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5">
              <label
                htmlFor="open-match-toggle"
                className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium"
              >
                <input
                  id="open-match-toggle"
                  type="checkbox"
                  data-testid="open-match-checkbox"
                  checked={isPublicMatch}
                  onChange={(event) => setIsPublicMatch(event.target.checked)}
                  className="size-4 accent-primary"
                />
                Công khai tìm người ghép
              </label>
              {isPublicMatch ? (
                <div className="mt-2 flex items-center gap-2 pl-6">
                  <Label htmlFor="slots-needed" className="text-xs text-muted-foreground">
                    Cần ghép
                  </Label>
                  <select
                    id="slots-needed"
                    data-testid="slots-needed-select"
                    value={slotsNeeded}
                    onChange={(event) => setSlotsNeeded(Number(event.target.value))}
                    className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} người
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {/* S2-F1: Đặt dưới tư cách Đội — gắn đơn vào đội thể thao của bạn. */}
              {(myTeamsQuery.data?.length ?? 0) > 0 ? (
                <div className="mt-2 flex items-center gap-2 pl-6">
                  <Label htmlFor="team-as" className="text-xs text-muted-foreground">
                    Tư cách
                  </Label>
                  <select
                    id="team-as"
                    data-testid="team-as-select"
                    value={teamId}
                    onChange={(event) => setTeamId(event.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="">Cá nhân</option>
                    {(myTeamsQuery.data ?? []).map((m) => (
                      <option key={m.team.id} value={m.team.id}>
                        Đội {m.team.name}
                        {m.role === 'CAPTAIN' ? ' (đội trưởng)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-1">
            {selectedSlots.length > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="success">Đã chọn {selectedSlots.length} slot</Badge>
                  <span className="font-score text-xs text-muted-foreground">
                    {selectedSlots[0].date} (
                    {minutesToTime(Math.min(...selectedSlots.map((s) => s.startMinute)))} –{' '}
                    {minutesToTime(Math.max(...selectedSlots.map((s) => s.endMinute)))})
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Tạm tính: </span>
                  <strong className="font-score text-base font-bold text-primary">
                    {formatVnd(subtotal)}
                  </strong>
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Cọc {venue.depositPercent}% = {formatVnd(depositAmount)})
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nhấp vào các ô còn trống để chọn khung giờ bạn muốn chơi (chọn liền kề).
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
              className="font-bold"
            >
              {holdMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Giữ chỗ & Thanh toán
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
