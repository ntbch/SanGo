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
      user: { findUnique: jest.fn().mockResolvedValue({ email: 'khach@sango.vn', notifyEmail: true, notifyInApp: true }) },
    };
    mailer = { send: jest.fn().mockResolvedValue(undefined) };
    service = new NotifyService(prisma as never, mailer);
  });

  it('không kèm mail -> chỉ ghi in-app, không gửi email', async () => {
    await service.dispatch({
      userId: 'u1',
      type: 'NEW_BOOKING_OWNER' as never,
      title: 'Có đơn mới',
      body: 'b',
    });
    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
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
    expect(mailer.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'khach@sango.vn',
        subject: '[SanGo] Đã xác nhận đơn CH-1',
      }),
    );
  });

  it('user thiếu email -> bỏ qua gửi, vẫn ghi in-app thành công', async () => {
    prisma.user.findUnique.mockResolvedValue({ email: '', notifyEmail: true, notifyInApp: true });
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

  it('walk-in booking yields a guest context with no account, so owner alerts still render', async () => {
    // Khách vãng lai không có tài khoản nhận inbox/email, NHƯNG thông báo cho chủ
    // venue (dùng code/courtName) vẫn cần dữ liệu này — nên không được trả null.
    const guestPrisma = {
      booking: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          customerId: null,
          guestName: 'Khách tại quầy',
          customer: null,
          code: 'CH-20350101-0001',
          date: new Date('2035-01-01T00:00:00.000Z'),
          startMinute: 360,
          endMinute: 420,
          subtotal: 100000,
          depositAmount: 0,
          court: { name: 'Sân 1', venue: { name: 'Cụm sân', address: '1 Đường', ownerId: 'owner-1' } },
        }),
      },
    };
    const guestService = new NotifyService(guestPrisma as never, mailer);
    const ctx = await guestService.bookingMailData('guest-booking');
    expect(ctx.customerId).toBeNull();
    expect(ctx.customerEmail).toBeNull();
    expect(ctx.customerName).toBe('Khách tại quầy');
    expect(ctx.venueOwnerId).toBe('owner-1');
    expect(ctx.code).toBe('CH-20350101-0001');
  });

  it('notifyEmail=false keeps inbox delivery but suppresses email', async () => {
    prisma.user.findUnique.mockResolvedValue({ email: 'test@example.invalid', notifyEmail: false, notifyInApp: true });
    await service.dispatch({ userId: 'u1', type: 'REMINDER' as never, title: 't', body: 'b', mail: { subject: 's', html: 'h', text: 't' } });
    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
    expect(mailer.send).not.toHaveBeenCalled();
  });

  it('notifyInApp=false keeps email delivery but suppresses inbox and socket delivery', async () => {
    prisma.user.findUnique.mockResolvedValue({ email: 'test@example.invalid', notifyEmail: true, notifyInApp: false });
    const realtime = { emitToUser: jest.fn() };
    const configured = new NotifyService(prisma as never, mailer, realtime as never);
    const result = await configured.dispatch({ userId: 'u1', type: 'REMINDER' as never, title: 't', body: 'b', mail: { subject: 's', html: 'h', text: 't' } });
    expect(result).toBeNull();
    expect(prisma.notification.create).not.toHaveBeenCalled();
    expect(realtime.emitToUser).not.toHaveBeenCalled();
    expect(mailer.send).toHaveBeenCalledTimes(1);
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
