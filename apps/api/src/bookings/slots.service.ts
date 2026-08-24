import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { slotDateTime } from './pricing.util';

export type SlotState = 'AVAILABLE' | 'BOOKED' | 'HELD' | 'MAINTENANCE';

interface DaySlots {
  date: string;
  slots: { startMinute: number; endMinute: number; state: SlotState }[];
}

/**
 * Lịch trống theo tuần cho một sân con (spec §3.4):
 * TRỐNG / BOOKED (Booking CONFIRMED|CHECKED_IN) / HELD (Hold ACTIVE còn hạn) /
 * MAINTENANCE (toàn ngày nếu sân đang bảo trì); grid theo slotMinutes trong giờ mở cửa.
 */
@Injectable()
export class SlotsService {
  constructor(private readonly prisma: PrismaService) {}

  async week(courtId: string, fromStr: string, days: number) {
    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
      include: { venue: { select: { openMinute: true, closeMinute: true } } },
    });
    if (!court)
      throw new NotFoundException({ message: 'Không tìm thấy sân con', code: 'COURT_NOT_FOUND' });

    const fromDate = new Date(fromStr + 'T00:00:00.000Z');
    const toDate = new Date(fromDate.getTime() + days * 86_400_000);

    const [bookings, holds] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          courtId,
          date: { gte: fromDate, lt: toDate },
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        },
        select: { date: true, startMinute: true, endMinute: true },
      }),
      this.prisma.bookingHold.findMany({
        where: {
          courtId,
          date: { gte: fromDate, lt: toDate },
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
        },
        select: { date: true, startMinute: true, endMinute: true },
      }),
    ]);

    const step = court.slotMinutes;
    const result: DaySlots[] = [];
    for (let d = 0; d < days; d++) {
      const date = new Date(fromDate.getTime() + d * 86_400_000);
      const slots: DaySlots['slots'] = [];
      for (
        let start = court.venue.openMinute;
        start + step <= court.venue.closeMinute;
        start += step
      ) {
        let state: SlotState = court.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'AVAILABLE';
        if (state === 'AVAILABLE') {
          const overlaps = (x: { startMinute: number; endMinute: number }) =>
            start < x.endMinute && x.startMinute < start + step;
          if (bookings.some((b) => b.date.getTime() === date.getTime() && overlaps(b))) {
            state = 'BOOKED';
          } else if (holds.some((h) => h.date.getTime() === date.getTime() && overlaps(h))) {
            state = 'HELD';
          }
        }
        slots.push({ startMinute: start, endMinute: start + step, state });
      }
      result.push({ date: date.toISOString().slice(0, 10), slots });
    }

    return {
      courtId,
      courtStatus: court.status,
      slotMinutes: step,
      from: fromStr,
      days,
      byDate: result,
    };
  }

  /** Thời điểm kết thúc muộn nhất của slot cuối trong tuần (hỗ trợ cron COMPLETED). */
  static endOf(date: Date, endMinute: number): Date {
    return slotDateTime(date, endMinute);
  }
}
