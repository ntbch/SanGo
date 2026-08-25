import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NotificationType } from '@courthub/shared';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { slotDateTime } from './pricing.util';
import { BookingsService } from './bookings.service';
import { NotifyService } from '../notifications/notify.service';
import { reminderEmail } from '../notifications/mail-templates';

const TICK_MS = 60_000;
const HOUR_MS = 3_600_000;

/** Hai mốc nhắc lịch theo đặc tả Đợt 2. */
const REMINDER_MARKS = [
  { label: 'T-24h' as const, windowMs: 24 * HOUR_MS, title: 'Nhắc lịch: ngày mai bạn có trận' },
  { label: 'T-2h' as const, windowMs: 2 * HOUR_MS, title: 'Sắp tới giờ chơi!' },
];

/**
 * Cron mỗi phút — spec §6.1:
 * 1) Hold ACTIVE quá hạn -> EXPIRED (nhả slot)
 * 2) Booking CONFIRMED qua giờ kết thúc -> COMPLETED
 * 3) Nhắc lịch chơi tại mốc T-24h và T-2h trước giờ bắt đầu (P2-B2)
 *
 * Chống gửi trùng: mỗi mốc nhận một dòng Notification(type=REMINDER) với bộ
 * khóa (userId, link đơn, title mốc). Tra findFirst TRƯỚC khi gửi nên bền vững
 * qua restart và an toàn khi tick dồn nhiều lần — khác hẳn Set in-memory cũ.
 */
@Injectable()
export class BookingsCronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BookingsCronService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly bookings: BookingsService,
    private readonly prisma: PrismaService,
    private readonly notify: NotifyService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.tick(), TICK_MS);
    this.logger.log('Booking cron đã bật (mỗi 60s)');
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async tick(): Promise<void> {
    try {
      const expired = await this.bookings.expireStaleHolds();
      if (expired > 0) this.logger.log(`Cron: ${expired} hold quá hạn -> EXPIRED`);

      const completed = await this.bookings.completePastBookings();
      if (completed > 0) this.logger.log(`Cron: ${completed} booking qua giờ -> COMPLETED`);

      await this.sendReminders();
    } catch (e) {
      this.logger.error(`Cron tick lỗi: ${(e as Error).message}`);
    }
  }

  /** Quét đơn CONFIRMED còn chưa chơi trong vòng 24h -> phát nhắc từng mốc. */
  private async sendReminders(): Promise<void> {
    const now = Date.now();
    const upcoming = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        // Sơ lọc SQL: chỉ đơn bắt đầu trong tương lai và không quá xa 24h+1 ngày
        date: { gte: new Date(now - 48 * HOUR_MS) },
      },
      select: {
        id: true,
        code: true,
        customerId: true,
        date: true,
        startMinute: true,
        endMinute: true,
        court: { select: { name: true, venue: { select: { name: true } } } },
      },
    });

    for (const b of upcoming) {
      const startAt = slotDateTime(b.date, b.startMinute).getTime();
      const untilStart = startAt - now;
      if (untilStart <= 0 || untilStart > 24 * HOUR_MS) continue;

      for (const mark of REMINDER_MARKS) {
        // Chưa tới mốc -> bỏ; T-24h bị bỏ luôn khi đã lọt vào cửa sổ T-2h
        // (đơn tạo muộn không nhận mail "ngày mai bạn có trận" vô nghĩa).
        if (untilStart > mark.windowMs) continue;
        if (mark.label === 'T-24h' && untilStart <= REMINDER_MARKS[1].windowMs) continue;
        await this.remindOnce(b, startAt, mark);
      }
    }
  }

  /** Gửi đúng MỘT lần cho một mốc — chặn trùng bằng bản ghi REMINDER cùng title. */
  private async remindOnce(
    booking: {
      code: string;
      customerId: string;
      date: Date;
      startMinute: number;
      endMinute: number;
      court: { name: string; venue: { name: string } };
    },
    startAt: number,
    mark: (typeof REMINDER_MARKS)[number],
  ): Promise<void> {
    const link = `/bookings/${booking.code}`;
    const already = await this.prisma.notification.findFirst({
      where: {
        userId: booking.customerId,
        type: 'REMINDER',
        link,
        title: mark.title,
      },
      select: { id: true },
    });
    if (already) return;

    try {
      const minutesLeft = Math.max(0, Math.round((startAt - Date.now()) / 60_000));
      await this.notify.dispatch({
        userId: booking.customerId,
        type: NotificationType.REMINDER,
        title: mark.title,
        body: `Đơn ${booking.code} · ${booking.court.name} bắt đầu sau khoảng ${minutesLeft} phút (${mark.label})`,
        link,
        mail: reminderEmail({
          code: booking.code,
          courtName: booking.court.name,
          venueName: booking.court.venue.name,
          date: booking.date.toISOString().slice(0, 10),
          startMinute: booking.startMinute,
          endMinute: booking.endMinute,
          amountVnd: 0,
          markLabel: mark.label,
        }),
      });
      this.logger.log(`Cron: nhắc ${mark.label} đơn ${booking.code}`);
    } catch (e) {
      this.logger.warn(`Nhắc lịch thất bại đơn ${booking.code}: ${(e as Error).message}`);
    }
  }
}
