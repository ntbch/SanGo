import { NotFoundException } from '@nestjs/common';
import { NotificationsController } from '../../src/notifications/notifications.controller';

const USER = { id: 'u1', email: 'khach@sango.vn', role: 'CUSTOMER' } as never;

describe('NotificationsController (endpoint)', () => {
  let controller: NotificationsController;
  let service: {
    list: jest.Mock;
    markRead: jest.Mock;
    markAllRead: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(() => {
    service = {
      list: jest.fn().mockResolvedValue({
        items: [{ id: 'n1', title: 'Đặt sân thành công', readAt: null }],
        page: 1,
        pageSize: 10,
        total: 1,
        unreadCount: 1,
      }),
      markRead: jest.fn().mockResolvedValue({ id: 'n1', readAt: new Date() }),
      markAllRead: jest.fn().mockResolvedValue({ updated: 4 }),
      create: jest.fn(),
    };
    controller = new NotificationsController(service as never);
  });

  it('GET /notifications -> list(user.id, page) và trả items + unreadCount', async () => {
    const res = await controller.list(USER, { page: 3 });
    expect(service.list).toHaveBeenCalledWith('u1', 3);
    expect(res.unreadCount).toBe(1);
    expect(res.items[0].title).toContain('Đặt sân');
  });

  it('POST /notifications/:id/read -> truyền đúng id + user.id', async () => {
    await controller.markRead(USER, '9e0b6a2e-1111-4c33-9d44-2f2f5cf9a111');
    expect(service.markRead).toHaveBeenCalledWith('u1', '9e0b6a2e-1111-4c33-9d44-2f2f5cf9a111');
  });

  it('POST /notifications/:id/read -> nổi 404 từ service khi không sở hữu', async () => {
    service.markRead.mockRejectedValue(
      new NotFoundException({
        message: 'Không tìm thấy thông báo',
        code: 'NOTIFICATION_NOT_FOUND',
      }),
    );
    await expect(controller.markRead(USER, 'x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('POST /notifications/read-all -> markAllRead(user.id), KHÔNG đụng markRead', async () => {
    const res = await controller.markAllRead(USER);
    expect(service.markAllRead).toHaveBeenCalledWith('u1');
    expect(service.markRead).not.toHaveBeenCalled();
    expect(res.updated).toBe(4);
  });
});
