import { NotificationsService } from './notifications.service';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class {},
}));

const NOTI = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'n1',
  userId: 'u1',
  type: 'BOOKING_CONFIRMED',
  title: 'Đặt sân thành công',
  body: 'Đơn CH-... đã xác nhận',
  link: '/bookings/CH-...',
  readAt: null,
  createdAt: new Date('2026-08-25T10:00:00Z'),
  ...over,
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: {
    $transaction: jest.Mock;
    notification: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      // Mô phỏng $transaction mảng: chạy tuần tự từng truy vấn như Prisma thật.
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops.map((op) => op))),
      notification: {
        create: jest.fn().mockImplementation(({ data }) => NOTI(data)),
        findMany: jest.fn().mockResolvedValue([NOTI()]),
        count: jest.fn().mockResolvedValue(3),
        findFirst: jest.fn(),
        update: jest.fn().mockImplementation(({ data }) => NOTI({ ...data })),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    service = new NotificationsService(prisma as never);
  });

  describe('create()', () => {
    it('lưu đúng payload nội bộ (userId/type/title/body/link)', async () => {
      const created = await service.create({
        userId: 'u1',
        type: 'PAYMENT_RECEIVED' as never,
        title: 'Đã nhận thanh toán',
        body: '250.000₫',
        link: '/bookings/CH-20260825-0001',
      });
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          type: 'PAYMENT_RECEIVED',
          title: 'Đã nhận thanh toán',
          body: '250.000₫',
          link: '/bookings/CH-20260825-0001',
        },
      });
      expect(created.title).toBe('Đã nhận thanh toán');
    });

    it('cho phép link bỏ trống', async () => {
      await service.create({ userId: 'u1', type: 'REMINDER' as never, title: 't', body: 'b' });
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: { userId: 'u1', type: 'REMINDER', title: 't', body: 'b', link: undefined },
      });
    });
  });

  describe('list()', () => {
    it('phân trang mới nhất trước + kèm unreadCount và total', async () => {
      const res = await service.list('u1', 2);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      });
      expect(res).toMatchObject({ page: 2, pageSize: 10, total: 3, unreadCount: 3 });
      expect(res.items).toHaveLength(1);
    });

    it('trang 1 -> skip = 0', async () => {
      await service.list('u1', 1);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });
  });

  describe('markRead()', () => {
    it('đánh dấu đã đọc khi thông báo thuộc về user', async () => {
      prisma.notification.findFirst.mockResolvedValue(NOTI());
      const updated = await service.markRead('u1', 'n1');
      expect(prisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'n1', userId: 'u1' },
      });
      expect(updated.readAt).toBeInstanceOf(Date);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { readAt: expect.any(Date) },
      });
    });

    it('404 NOTIFICATION_NOT_FOUND khi không tồn tại hoặc của người khác', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);
      await expect(service.markRead('u1', 'ghost')).rejects.toMatchObject({
        response: { code: 'NOTIFICATION_NOT_FOUND' },
      });
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it('idempotent: đã đọc rồi thì giữ nguyên readAt cũ, không update lại', async () => {
      const readAt = new Date('2026-08-24T00:00:00Z');
      prisma.notification.findFirst.mockResolvedValue(NOTI({ readAt }));
      const res = await service.markRead('u1', 'n1');
      expect(prisma.notification.update).not.toHaveBeenCalled();
      expect(res.readAt).toBe(readAt);
    });
  });

  describe('markAllRead()', () => {
    it('updateMany chỉ đích các thông báo chưa đọc -> trả số dòng', async () => {
      const res = await service.markAllRead('u1');
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', readAt: null },
        data: { readAt: expect.any(Date) },
      });
      expect(res.updated).toBe(2);
    });
  });
});
