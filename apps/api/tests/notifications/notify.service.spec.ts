import { NotifyService } from '../../src/notifications/notify.service';
import type { MailerPort } from '../../src/notifications/mailer/mailer.port';

jest.mock('../../src/prisma/prisma.service', () => ({ PrismaService: class {} }));

describe('NotifyService — dispatch in-app + mail', () => {
  let service: NotifyService;
  let prisma: { notification: { create: jest.Mock }; user: { findUnique: jest.Mock } };
  let mailer: { send: jest.Mock } & MailerPort;

  const NOTI = { id: 'n1', userId: 'u1', title: 't' };

  beforeEach(() => {
    prisma = {
      notification: { create: jest.fn().mockResolvedValue(NOTI) },
      user: { findUnique: jest.fn().mockResolvedValue({ email: 'khach@sango.vn' }) },
    };
    mailer = { send: jest.fn().mockResolvedValue(undefined) };
    service = new NotifyService(prisma as never, mailer);
  });

  it('không kèm mail -> chỉ ghi in-app, không đụng mailer và không tra user', async () => {
    await service.dispatch({
      userId: 'u1',
      type: 'NEW_BOOKING_OWNER' as never,
      title: 'Có đơn mới',
      body: 'b',
    });
    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(mailer.send).not.toHaveBeenCalled();
  });

  it('kèm mail -> tra email người nhận và gửi đủ to/subject/html/text', async () => {
    await service.dispatch({
      userId: 'u1',
      type: 'BOOKING_CONFIRMED' as never,
      title: 'Đặt sân thành công',
      body: 'b',
      link: '/bookings/CH-1',
      mail: { subject: '[SanGo] Đã xác nhận đơn CH-1', html: '<p/>', text: 'x' },
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'u1' },
      select: { email: true },
    });
    expect(mailer.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'khach@sango.vn',
        subject: '[SanGo] Đã xác nhận đơn CH-1',
      }),
    );
  });

  it('user thiếu email -> bỏ qua gửi, vẫn ghi in-app thành công', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const warn = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      await service.dispatch({
        userId: 'u1',
        type: 'REMINDER' as never,
        title: 'Nhắc',
        body: 'b',
        mail: { subject: 's', html: '<p/>', text: 's' },
      });
      expect(prisma.notification.create).toHaveBeenCalled();
      expect(mailer.send).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('sendMailSafe nuốt lỗi mailer — nghiệp vụ không bao giờ vỡ vì email', async () => {
    mailer.send.mockRejectedValue(new Error('SMTP down'));
    const warn = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      await expect(
        service.sendMailSafe({ to: 'a@b.vn', subject: 's', html: '<p/>' }),
      ).resolves.toBeUndefined();
    } finally {
      warn.mockRestore();
    }
  });
});
