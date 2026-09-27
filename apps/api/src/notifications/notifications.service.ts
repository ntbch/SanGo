import { Injectable, NotFoundException } from '@nestjs/common';
import type { Notification, Prisma } from '@prisma/client';
import type { NotificationType } from '@sango/shared';
import { PrismaService } from '../prisma/prisma.service';

/** Số thông báo mỗi trang của GET /notifications. */
export const NOTIFICATIONS_PAGE_SIZE = 10;

/** Phản hồi GET /notifications: trang mới nhất trước + số chưa đọc toàn hộp thư. */
export interface NotificationListResponse {
  items: Notification[];
  page: number;
  pageSize: number;
  total: number;
  unreadCount: number;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo thông báo nội bộ — chỉ gọi từ các luồng nghiệp vụ (đặt sân, thanh toán,
   * ghép trận, cron reminder). Không gửi mail ở đây; mail do caller kết hợp
   * MailerPort + template riêng để giữ transaction ngắn.
   */
  create(input: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    link?: string;
  }): Promise<Notification> {
    return this.prisma.notification.create({ data: input });
  }

  /** Hộp thư của user, mới nhất trước, kèm unreadCount và total để phân trang. */
  async list(userId: string, page: number): Promise<NotificationListResponse> {
    const where: Prisma.NotificationWhereInput = { userId };
    const [items, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * NOTIFICATIONS_PAGE_SIZE,
        take: NOTIFICATIONS_PAGE_SIZE,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { items, page, pageSize: NOTIFICATIONS_PAGE_SIZE, total, unreadCount };
  }

  /** Đánh dấu một thông báo đã đọc; thông báo phải thuộc về chính user. */
  async markRead(userId: string, id: string): Promise<Notification> {
    const found = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!found) {
      throw new NotFoundException({
        message: 'Không tìm thấy thông báo',
        code: 'NOTIFICATION_NOT_FOUND',
      });
    }
    if (found.readAt) return found; // idempotent: đọc lại vẫn 200, giữ readAt cũ
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  /** Đánh dấu TOÀN BỘ thông báo chưa đọc là đã đọc -> trả về số dòng ảnh hưởng. */
  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  async deleteOne(userId: string, id: string): Promise<{ deleted: number }> {
    const result = await this.prisma.notification.deleteMany({ where: { id, userId } });
    if (!result.count) {
      throw new NotFoundException({
        message: 'Không tìm thấy thông báo',
        code: 'NOTIFICATION_NOT_FOUND',
      });
    }
    return { deleted: result.count };
  }

  async deleteAll(userId: string): Promise<{ deleted: number }> {
    const result = await this.prisma.notification.deleteMany({ where: { userId } });
    return { deleted: result.count };
  }

  /** F8 wave-1: đếm nhánh chưa đọc cho badge — nhẹ hơn GET /notifications (không nạp items). */
  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({ where: { userId, readAt: null } });
    return { count };
  }
}
