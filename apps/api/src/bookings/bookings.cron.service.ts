import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { slotDateTime } from './pricing.util';
import { BookingsService } from './bookings.service';

const TICK_MS = 60_000;

/**
 * Cron mỗi phút — spec §6.1:
 * 1) Hold ACTIVE quá hạn -> EXPIRED (nhả slot)
 * 2) Booking CONFIRMED qua giờ kết thúc -> COMPLETED
 * 3) t-2h trước giờ chơi -> gửi email nhắc (chưa có RESEND_API_KEY -> log console)
 */
@Injectable()
export class BookingsCronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BookingsCronService.name);
  private timer?: NodeJS.Timeout;
  /** In-memory dedup nhắc lịch (đủ demo; TODO: thêm cột reminderSentAt nếu cần bền). */
  private readonly reminded = new Set<string>();

  constructor(private readonly bookings: BookingsService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.tick(), TICK_MS);
    this.logger.log('Booking cron đã bật (mỗi 60s)');
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.reminded.clear();
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

  private async sendReminders(): Promise<void> {
    const now = Date.now();
    const upcoming = await this.bookings['prisma'].booking.findMany({
      where: { status: BookingStatus.CONFIRMED },
      select: { id: true, code: true, customerId: true, date: true, startMinute: true },
    });
    for (const b of upcoming) {
      const startAt = slotDateTime(b.date, b.startMinute).getTime();
      const untilStart = startAt - now;
      // Cửa sổ nhắc: còn <=2h và chưa qua giờ chơi
      if (untilStart > 0 && untilStart <= 2 * 3_600_000 && !this.reminded.has(b.id)) {
        this.reminded.add(b.id);
        this.logger.warn(
          `[DEV-ONLY] Email nhắc lịch (chưa có RESEND_API_KEY): đơn ${b.code} bắt đầu sau ${Math.round(untilStart / 60000)} phút nữa`,
        );
      }
      // Dọn bộ nhớ cho đơn đã qua
      if (untilStart < -24 * 3_600_000) this.reminded.delete(b.id);
    }
  }
}
