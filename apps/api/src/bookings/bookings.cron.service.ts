import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NotificationType } from '@courthub/shared';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { slotDateTime } from './pricing.util';
import { BookingsService } from './bookings.service';
import { NotifyService } from '../notifications/notify.service';
import { reminderEmail } from '../notifications/mail-templates';

const TICK_MS = 60_000; // expire holds + hoàn tất đơn — cần độ trễ thấp
const REMINDER_TICK_MS = 15 * 60_000; // job nhắc lịch chạy mỗi 15 phút (P2-B2)
const HOUR_MS = 3_600_000;

/** Hai mốc nhắc lịch theo đặc tả Đợt 2. */
const REMINDER_MARKS = [
  {
    label: 'T-24h' as const,
    column: 'remindedAt24h' as const,
    windowMs: 24 * HOUR_MS,
    title: 'Nhắc lịch: ngày mai bạn có trận',
  },
  {
    label: 'T-2h' as const,
    column: 'remindedAt2h' as const,
    windowMs: 2 * HOUR_MS,
    title: 'Sắp tới giờ chơi!',
  },
];

/**
 * Cron nền của booking engine — spec §6.1 + P2-B2:
 * 1) MỖI PHÚT: hold ACTIVE quá hạn -> EXPIRED (nhả slot); đơn qua giờ -> COMPLETED.
 * 2) MỖI 15 PHÚT: nhắc lịch chơi tại mốc T-24h và T-2h trước giờ bắt đầu.
 *
 * Chống gửi trùng bằng 2 cột Booking.remindedAt24h / remindedAt2h:
 * claim ATOMIC updateMany(where {id, col: null}) -> ai thắng count=1 mới được
 * gửi. Bền vững qua restart, an toàn khi nhiều instance/tick dồn — khác hẳn
 * Set in-memory cũ. Gửi lỗi thì nhả claim để tick sau thử lại.
 */
@Injectable()
export class BookingsCronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BookingsCronService.name);
  private timer?: NodeJS.Timeout;
  private reminderTimer?: NodeJS.Timeout;

  constructor(
    private readonly bookings: BookingsService,
    private readonly prisma: PrismaService,
    private readonly notify: NotifyService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.tick(), TICK_MS);
    this.reminderTimer = setInterval(() => void this.sendReminders(), REMINDER_TICK_MS);
    this.logger.log(
      `Booking cron đã bật: expire/complete mỗi ${TICK_MS / 1000}s, nhắc lịch mỗi ${REMINDER_TICK_MS / 60_000}phút`,
    );
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.reminderTimer) clearInterval(this.reminderTimer);
  }

  /** Tick nhanh: dọn hold hết hạn + hoàn tất đơn qua giờ. */
  async tick(): Promise<void> {
    try {
      const expired = await this.bookings.expireStaleHolds();
      if (expired > 0) this.logger.log(`Cron: ${expired} hold quá hạn -> EXPIRED`);

      const completed = await this.bookings.completePastBookings();
      if (completed > 0) this.logger.log(`Cron: ${completed} booking qua giờ -> COMPLETED`);
    } catch (e) {
      this.logger.error(`Cron tick lỗi: ${(e as Error).message}`);
    }
  }

  /**
   * Job nhắc lịch (mỗi 15'): quét đơn CONFIRMED sắp chơi và phát từng mốc.
   * Pha độc lập: T-24h chỉ áp dụng khi còn > T-2h window — đơn tạo muộn
   * không nhận mail "ngày mai bạn có trận" vô nghĩa.
   */
  async sendReminders(): Promise<void> {
    const now = Date.now();
    const upcoming = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        date: { gte: new Date(now - 48 * HOUR_MS) },
      },
      select: {
        id: true,
        code: true,
        customerId: true,
        date: true,
        startMinute: true,
        endMinute: true,
        remindedAt24h: true,
        remindedAt2h: true,
        court: { select: { name: true, venue: { select: { name: true } } } },
      },
    });

    for (const b of upcoming) {
      const startAt = slotDateTime(b.date, b.startMinute).getTime();
      const untilStart = startAt - now;
      if (untilStart <= 0 || untilStart > 24 * HOUR_MS) continue;

      for (const mark of REMINDER_MARKS) {
        if (untilStart > mark.windowMs) continue; // chưa tới mốc
        if (mark.label === 'T-24h' && untilStart <= REMINDER_MARKS[1].windowMs) continue;
        if (b[mark.column]) continue; // đã nhắc mốc này (đọc nhanh, vẫn có claim bên dưới)
        await this.remindOnce(b, startAt, mark);
      }
    }
  }

  /** Claim atomic cột mốc rồi gửi — count=0 nghĩa là instance/kick khác đã gửi. */
  private async remindOnce(
    booking: {
      id: string;
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
    const now = new Date();
    const claim =
      mark.label === 'T-24h'
        ? await this.prisma.booking.updateMany({
            where: { id: booking.id, remindedAt24h: null },
            data: { remindedAt24h: now },
          })
        : await this.prisma.booking.updateMany({
            where: { id: booking.id, remindedAt2h: null },
            data: { remindedAt2h: now },
          });
    if (claim.count === 0) return;

    try {
      const minutesLeft = Math.max(0, Math.round((startAt - Date.now()) / 60_000));
      await this.notify.dispatch({
        userId: booking.customerId,
        type: NotificationType.REMINDER,
        title: mark.title,
        body: `Đơn ${booking.code} · ${booking.court.name} bắt đầu sau khoảng ${minutesLeft} phút (${mark.label})`,
        link: '/dashboard/my-bookings', // QA-T4-P2-01: route web có sẵn, tránh 404
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
      // Nhả claim để tick sau thử lại — ưu tiên đúng hơn là im lặng bỏ sót.
      await this.prisma.booking.updateMany({
        where: { id: booking.id },
        data: mark.label === 'T-24h' ? { remindedAt24h: null } : { remindedAt2h: null },
      });
      this.logger.warn(`Nhắc lịch thất bại đơn ${booking.code}: ${(e as Error).message}`);
    }
  }
}
