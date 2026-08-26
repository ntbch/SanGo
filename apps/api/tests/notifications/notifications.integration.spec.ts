/**
 * Integration test Notifications — chạy Postgres THẬT.
 * Phủ task P2-B1: create nội bộ; GET list mới nhất trước + unreadCount;
 * markRead chặn đọc hộ (404) và idempotent; read-all đếm đúng số dòng.
 * Không có DB -> tự bỏ qua để gate vẫn xanh.
 */
import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import type { PrismaService } from '../../src/prisma/prisma.service';
import {
  NOTIFICATIONS_PAGE_SIZE,
  NotificationsService,
} from '../../src/notifications/notifications.service';

const SUFFIX = Date.now().toString(36);

describe('Notifications trên DB thật (integration)', () => {
  let prisma: PrismaClient;
  let service: NotificationsService;
  let dbUp = false;
  let userId!: string;
  let strangerId!: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbUp = true;
    } catch {
      console.warn('[integration] Không có Postgres -> bỏ qua notifications integration');
      return;
    }
    service = new NotificationsService(prisma as unknown as PrismaService);
    const hash = await bcrypt.hash('IntegrationPass1!', 4);
    const mkUser = (email: string) =>
      prisma.user.create({
        data: { email, passwordHash: hash, fullName: email.split('@')[0] },
      });
    userId = (await mkUser(`itnoti-u-${SUFFIX}@sango.vn`)).id;
    strangerId = (await mkUser(`itnoti-s-${SUFFIX}@sango.vn`)).id;
  });

  afterAll(async () => {
    if (!dbUp) return;
    await prisma.notification.deleteMany({ where: { userId: { in: [userId, strangerId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, strangerId] } } });
    await prisma.$disconnect();
  });

  it('create -> list mới nhất trước + unreadCount đúng; phân trang theo pageSize', async () => {
    // Tạo 12 thông báo cho user (trang đầu đủ 10)
    for (let i = 1; i <= 12; i++) {
      await service.create({
        userId,
        type: 'BOOKING_CONFIRMED' as never,
        title: `Thông báo #${i}`,
        body: 'Nội dung',
      });
      // Đảm bảo createdAt tăng dần (mặc định now() có thể trùng ms)
      await prisma.notification.updateMany({
        where: { userId, title: `Thông báo #${i}` },
        data: { createdAt: new Date(Date.UTC(2026, 7, 25, 10, i)) },
      });
    }
    await service.create({
      userId,
      type: 'REMINDER' as never,
      title: 'Đã đọc sẵn',
      body: 'b',
    });
    const firstRead = await prisma.notification.findFirstOrThrow({
      where: { userId, title: 'Đã đọc sẵn' },
    });
    await service.markRead(userId, firstRead.id);

    const page1 = await service.list(userId, 1);
    expect(page1.total).toBe(13);
    expect(page1.items).toHaveLength(NOTIFICATIONS_PAGE_SIZE);
    expect(page1.unreadCount).toBe(12);
    // Mới nhất trước: ghép cả 2 trang theo thứ tự đọc để so toàn cục
    const page2 = await service.list(userId, 2);
    const titles = [...page1.items.map((n) => n.title), ...page2.items.map((n) => n.title)];
    // 12 bản ghi seeded phải xuất hiện đúng thứ tự mới nhất trước (12 -> 1)
    const pos = Array.from({ length: 12 }, (_, k) => titles.indexOf('Thông báo #' + (12 - k)));
    expect(pos.every((p) => p >= 0)).toBe(true);
    for (let k = 1; k < pos.length; k++) {
      expect(pos[k]).toBeGreaterThan(pos[k - 1]);
    }

    expect(page2.items.length).toBeGreaterThan(0);
    expect(page2.items.length).toBeLessThanOrEqual(NOTIFICATIONS_PAGE_SIZE);
  });

  it('markRead của người khác -> 404; đã đọc rồi -> idempotent giữ readAt cũ', async () => {
    const target = await service.create({
      userId,
      type: 'MATCH_JOINED' as never,
      title: 'Ghép trận',
      body: 'b',
    });

    await expect(service.markRead(strangerId, target.id)).rejects.toBeInstanceOf(NotFoundException);

    const first = await service.markRead(userId, target.id);
    const second = await service.markRead(userId, target.id);
    expect(second.readAt?.getTime()).toBe(first.readAt?.getTime());
  });

  it('read-all -> cập nhật đúng số dòng chưa đọc, unreadCount về 0', async () => {
    await prisma.notification.updateMany({ where: { userId }, data: { readAt: null } });
    const res = await service.markAllRead(userId);
    expect(res.updated).toBe(14); // 12 vòng + reminder + ghép trận
    const box = await service.list(userId, 1);
    expect(box.unreadCount).toBe(0);

    // Gọi lần nữa -> updated = 0 (không có gì chưa đọc)
    expect((await service.markAllRead(userId)).updated).toBe(0);
  });
});
