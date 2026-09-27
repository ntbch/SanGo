import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { Notification } from '@prisma/client';
import type { NotificationType } from '@sango/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.module';
import { MAILER_PORT, type MailerPort, type SendMailInput } from './mailer/mailer.port';
import type { MailContent } from './mail-templates';

/** Dữ liệu đơn đã render sẵn cho email — caller lấy qua bookingMailData(). */
export type BookingMailContext = {
  /** null khi là đơn quầy (khách vãng lai, không có tài khoản). */
  customerId: string | null;
  venueOwnerId: string;
  code: string;
  customerName: string;
  customerEmail: string | null;
  courtName: string;
  venueName: string;
  venueAddress: string;
  dateIso: string;
  startMinute: number;
  endMinute: number;
  subtotal: number;
  depositAmount: number;
};

/**
 * Gộp một lần phát thông báo: ghi in-app + (tuỳ chọn) gửi email.
 * LUÔN gọi SAU khi transaction nghiệp vụ commit — không bao giờ đặt trong tx,
 * để lỗi mail/kẹt queue không làm vỡ luồng đặt sân/thanh toán.
 * Mail ném lỗi chỉ log warn: in-app là nguồn chân lý, email là best-effort.
 */
@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MAILER_PORT) private readonly mailer: MailerPort,
    // Optional: test construct NotifyService thủ công (2 tham số) không có realtime.
    @Optional() private readonly realtime?: RealtimeService,
  ) {}

  /** Nạp đủ dữ liệu đơn (khách, sân con, venue) phục vụ render 3 loại mail. */
  async bookingMailData(bookingId: string): Promise<BookingMailContext> {
    const b = await this.prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      select: {
        customerId: true,
        guestName: true,
        code: true,
        date: true,
        startMinute: true,
        endMinute: true,
        subtotal: true,
        depositAmount: true,
        customer: { select: { fullName: true, email: true } },
        court: {
          select: {
            name: true,
            venue: { select: { name: true, address: true, ownerId: true } },
          },
        },
      },
    });
    // Khách vãng lai không có tài khoản nhận inbox/email, nhưng dữ liệu cụm sân và
    // chủ venue vẫn cần cho thông báo hủy đơn — nên KHÔNG trả null ở đây.
    const guestName = b.guestName?.trim();
    return {
      customerId: b.customerId,
      venueOwnerId: b.court.venue.ownerId,
      code: b.code,
      customerName: b.customer?.fullName ?? guestName ?? 'Khách',
      customerEmail: b.customer?.email ?? null,
      courtName: b.court.name,
      venueName: b.court.venue.name,
      venueAddress: b.court.venue.address,
      dateIso: b.date.toISOString().slice(0, 10),
      startMinute: b.startMinute,
      endMinute: b.endMinute,
      subtotal: b.subtotal,
      depositAmount: b.depositAmount,
    };
  }

  /**
   * Tạo thông báo in-app; nếu kèm `mail` thì gửi thêm email cho user đó
   * (fire-and-forget có log — không await để response không chờ SMTP).
   */
  async dispatch(input: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    link?: string;
    mail?: SendMailInput | MailContent;
  }): Promise<Notification | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true, notifyEmail: true, notifyInApp: true },
    });
    if (!user) return null;
    let created: Notification | null = null;
    if (user.notifyInApp) {
      created = await this.prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          link: input.link,
        },
      });
      this.realtime?.emitToUser(input.userId, 'notification:new', {
        id: created.id,
        type: created.type,
        title: created.title,
        body: created.body,
        link: created.link,
        readAt: created.readAt,
        createdAt: created.createdAt,
      });
    }
    if (input.mail && user.notifyEmail) {
      if (user.email) {
        void this.sendMailSafe({ ...input.mail, to: user.email });
      } else this.logger.warn(`Không gửi được mail: user ${input.userId} thiếu email`);
    }
    return created;
  }

  /** Gửi mail bắt mọi lỗi — chỉ warn ra log, không nổi lên caller. */
  async sendMailSafe(mail: SendMailInput | MailContent): Promise<void> {
    try {
      // dispatch luôn gắn 'to' trước khi gọi; fallback '' chỉ để thỏa kiểu.
      const out = {
        to: 'to' in mail ? mail.to : '',
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      };
      await this.mailer.send(out);
    } catch (e) {
      this.logger.warn(`Gửi mail thất bại (bỏ qua): ${(e as Error).message}`);
    }
  }

  /**
   * F8 wave-1: phát MỘT loại thông báo cho NHIỀU user (N2 hủy hàng loạt ngày mưa,
   * F7 mở giải...). Best-effort per người nhận: một user lỗi không chặn những user
   * còn lại; trả về số thông báo tạo thành công để caller log/đối soát.
   * LUÔN gọi SAU khi transaction nghiệp vụ commit (cùng nguyên tắc với dispatch).
   */
  async dispatchBroadcast(
    userIds: string[],
    payload: {
      type: NotificationType;
      title: string;
      body: string;
      link?: string;
    },
  ): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;
    for (const userId of [...new Set(userIds)]) {
      try {
        if (await this.dispatch({ userId, ...payload })) created++;
        else skipped++;
      } catch (e) {
        skipped++;
        this.logger.warn(`Broadcast tới user ${userId} thất bại (bỏ qua): ${(e as Error).message}`);
      }
    }
    return { created, skipped };
  }
}
