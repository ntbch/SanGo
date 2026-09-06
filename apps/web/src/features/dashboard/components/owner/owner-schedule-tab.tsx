import React from 'react';
import {
  type Court,
  type OwnerBookingItem,
  type SportType,
} from '../../api/owner-api';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { formatVND, formatMinutesToTime, cn } from '../../../../lib/utils';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Plus,
} from 'lucide-react';

const SPORT_TYPE_LABELS: Record<SportType, string> = {
  FOOTBALL5: 'Bóng đá 5',
  FOOTBALL7: 'Bóng đá 7',
  PICKLEBALL: 'Pickleball',
  BADMINTON: 'Cầu lông',
  TENNIS: 'Tennis',
};

const TIMELINE_HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6 to 23

interface OwnerScheduleTabProps {
  courts: Court[];
  bookings: OwnerBookingItem[];
  bookingDate: string;
  setBookingDate: (date: string) => void;
  onOpenWalkIn: (courtId?: string, startHour?: string, endHour?: string) => void;
  onQuickCheckIn: (code: string) => void;
}

export function OwnerScheduleTab({
  courts,
  bookings,
  bookingDate,
  setBookingDate,
  onOpenWalkIn,
  onQuickCheckIn,
}: OwnerScheduleTabProps): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Top Bar: Title, Date Navigator & Walk-in Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            Ma Trận Lịch Sân
            <Badge variant="primary" className="text-xs font-bold gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> Trục thời gian 06:00 - 23:00
            </Badge>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Lịch Hoạt Động Cụm Sân. Theo dõi tình trạng từng sân con theo thời gian thực. Bấm vào slot trống để đặt quầy.
          </p>
        </div>

        {/* Date Picker & Action */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-xl border border-border/60">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                const d = new Date(bookingDate);
                d.setDate(d.getDate() - 1);
                setBookingDate(d.toISOString().slice(0, 10));
              }}
              className="h-8 w-8 rounded-lg"
              title="Ngày trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={bookingDate === new Date().toISOString().slice(0, 10) ? 'default' : 'ghost'}
              onClick={() => setBookingDate(new Date().toISOString().slice(0, 10))}
              className="h-8 text-xs font-bold px-3 rounded-lg"
            >
              Hôm Nay
            </Button>
            <Button
              size="sm"
              variant={bookingDate === new Date(Date.now() + 86400000).toISOString().slice(0, 10) ? 'default' : 'ghost'}
              onClick={() => setBookingDate(new Date(Date.now() + 86400000).toISOString().slice(0, 10))}
              className="h-8 text-xs font-bold px-3 rounded-lg"
            >
              Ngày Mai
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                const d = new Date(bookingDate);
                d.setDate(d.getDate() + 1);
                setBookingDate(d.toISOString().slice(0, 10));
              }}
              className="h-8 w-8 rounded-lg"
              title="Ngày sau"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Input
            type="date"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            className="h-10 w-36 text-xs font-bold font-mono"
          />

          <Button
            onClick={() => onOpenWalkIn()}
            className="h-10 px-4 font-bold text-xs gap-1.5 shadow-xs bg-primary text-primary-foreground"
          >
            <UserPlus className="h-4 w-4" /> Tạo Đơn Quầy (Walk-in)
          </Button>
        </div>
      </div>

      {/* Color Legend Bar */}
      <div className="flex items-center gap-3 sm:gap-6 flex-wrap p-3 rounded-xl bg-card/60 border border-border/60 text-xs">
        <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Chú thích:</span>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
          <span>Đang đá / Đã check-in</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" />
          <span>Đã cọc / Chờ khách đến</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="h-3 w-3 rounded-full bg-sky-500 inline-block" />
          <span>Giữ chỗ online (10p)</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="h-3 w-3 rounded-md border border-dashed border-border bg-card inline-block" />
          <span>Slot trống (Click để đặt quầy)</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="h-3 w-3 rounded-md bg-rose-500/20 border border-rose-500/40 inline-block" />
          <span className="text-rose-500 font-semibold">Bảo trì sân</span>
        </div>
      </div>

      {/* Timeline Matrix Grid Table */}
      <Card className="border-border/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[1200px]">
            <thead>
              <tr className="bg-secondary/40 border-b border-border/80">
                <th className="sticky left-0 z-20 bg-secondary p-3.5 text-xs font-black uppercase tracking-wider text-foreground w-48 border-r border-border/80 shadow-xs">
                  Sân Con ({courts.length})
                </th>
                {TIMELINE_HOURS.map((hour) => (
                  <th
                    key={hour}
                    className="p-2.5 text-center text-xs font-mono font-bold text-muted-foreground border-r border-border/40 min-w-[68px]"
                  >
                    {hour.toString().padStart(2, '0')}:00
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {courts.length === 0 ? (
                <tr>
                  <td colSpan={19} className="py-12 text-center text-xs text-muted-foreground">
                    Chưa có sân con nào được cấu hình cho cụm sân này.
                  </td>
                </tr>
              ) : (
                courts.map((court) => {
                  const courtBookings = bookings.filter((b) => b.courtId === court.id);
                  return (
                    <tr key={court.id} className="hover:bg-secondary/15 transition-colors">
                      {/* Sticky Left Court Info */}
                      <td className="sticky left-0 z-10 bg-card p-3.5 border-r border-border/80 shadow-xs">
                        <div className="space-y-0.5">
                          <p className="font-bold text-xs text-foreground truncate">{court.name}</p>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] py-0 px-1 font-semibold">
                              {SPORT_TYPE_LABELS[court.sportType]}
                            </Badge>
                            {court.status === 'MAINTENANCE' ? (
                              <Badge variant="destructive" className="text-[9px] py-0 px-1 font-bold">
                                Bảo trì
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {formatVND(court.defaultPricePerSlot)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Time Slots */}
                      {TIMELINE_HOURS.map((hour) => {
                        const slotStart = hour * 60;
                        const slotEnd = (hour + 1) * 60;
                        const matchingBooking = courtBookings.find(
                          (b) => b.startMinute < slotEnd && b.endMinute > slotStart
                        );

                        if (court.status === 'MAINTENANCE') {
                          return (
                            <td
                              key={hour}
                              className="p-1 border-r border-border/40 bg-rose-500/10 text-center"
                              title="Sân đang bảo trì"
                            >
                              <span className="text-[10px] text-rose-500/60 font-bold">BẢO TRÌ</span>
                            </td>
                          );
                        }

                        if (matchingBooking) {
                          const isCheckedIn = matchingBooking.status === 'CHECKED_IN';
                          return (
                            <td
                              key={hour}
                              className="p-1 border-r border-border/40 text-center"
                            >
                              <div
                                onClick={() => matchingBooking.status === 'CONFIRMED' && onQuickCheckIn(matchingBooking.code)}
                                className={cn(
                                  'p-1.5 rounded-lg text-[10px] font-bold text-left transition-all cursor-pointer shadow-xs',
                                  isCheckedIn
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                                )}
                                title={`Đơn: ${matchingBooking.code} - ${matchingBooking.customer.fullName} (${formatMinutesToTime(matchingBooking.startMinute)} - ${formatMinutesToTime(matchingBooking.endMinute)})`}
                              >
                                <p className="truncate font-black">{matchingBooking.customer.fullName}</p>
                                <p className="font-mono text-[9px] opacity-80">{matchingBooking.code.slice(-6)}</p>
                              </div>
                            </td>
                          );
                        }

                        // Empty Slot
                        return (
                          <td
                            key={hour}
                            className="p-1 border-r border-border/40 text-center group/slot relative"
                          >
                            <button
                              onClick={() =>
                                onOpenWalkIn(
                                  court.id,
                                  `${hour.toString().padStart(2, '0')}:00`,
                                  `${(hour + 1).toString().padStart(2, '0')}:30`
                                )
                              }
                              className="w-full h-11 rounded-lg border border-dashed border-border/40 hover:border-primary hover:bg-primary/10 flex items-center justify-center text-muted-foreground/30 hover:text-primary transition-all text-[10px] font-bold"
                              title={`Bấm để đặt quầy slot ${hour}:00`}
                            >
                              <Plus className="h-3.5 w-3.5 opacity-0 group-hover/slot:opacity-100 transition-opacity" />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
