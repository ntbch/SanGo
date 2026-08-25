import { BookingsCronService } from './bookings.cron.service';
import type { NotifyService } from '../notifications/notify.service';

jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('./bookings.service', () => ({ BookingsService: class {} }));

const HOUR = 3_600_000;

/** date/startMinute sao cho giờ chơi = now + offsetMs (UTC, không lệch múi giờ). */
function slotIn(offsetMs: number) {
  const start = new Date(Date.now() + offsetMs);
  const dateIso = start.toISOString().slice(0, 10);
  const startMinute = start.getUTCHours() * 60 + start.getUTCMinutes();
  return { date: new Date(dateIso + 'T00:00:00.000Z'), startMinute };
}

describe('BookingsCronService — nhắc lịch T-24h / T-2h chống trùng', () => {
  let cron: BookingsCronService;
  let prisma: {
    booking: { findMany: jest.Mock };
    notification: { findFirst: jest.Mock };
  };
  let notify: { dispatch: jest.Mock };

  beforeEach(() => {
    prisma = {
      booking: { findMany: jest.fn().mockResolvedValue([]) },
      notification: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    notify = { dispatch: jest.fn().mockResolvedValue({ id: 'n' }) };
    cron = new BookingsCronService(
      {
        expireStaleHolds: jest.fn().mockResolvedValue(0),
        completePastBookings: jest.fn().mockResolvedValue(0),
      } as never,
      prisma as never,
      notify as unknown as NotifyService,
    );
  });

  const seedBooking = (offsetMs: number) => {
    const { date, startMinute } = slotIn(offsetMs);
    prisma.booking.findMany.mockResolvedValue([
      {
        id: 'b1',
        code: 'CH-20260825-0001',
        customerId: 'u1',
        date,
        startMinute,
        endMinute: startMinute + 90,
        court: { name: 'Sân 5A', venue: { name: 'KĐT Sân Cỏ' } },
      },
    ]);
  };

  it('còn ~30 phút -> nhắc T-2h đúng 1 lần; tick lần 2 KHÔNG lặp', async () => {
    seedBooking(30 * 60_000);
    await cron.tick();
    expect(notify.dispatch).toHaveBeenCalledTimes(1);
    expect(notify.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Sắp tới giờ chơi!' }),
    );

    // Tick kế tiếp: dedup trả về bản ghi cũ -> không dispatch thêm
    prisma.notification.findFirst.mockResolvedValue({ id: 'dup' });
    await cron.tick();
    expect(notify.dispatch).toHaveBeenCalledTimes(1);
  });

  it('còn ~20 tiếng -> chỉ nhắc T-24h, chưa nhắc T-2h', async () => {
    seedBooking(20 * HOUR);
    await cron.tick();
    expect(notify.dispatch).toHaveBeenCalledTimes(1);
    expect(notify.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Nhắc lịch: ngày mai bạn có trận' }),
    );
  });

  it('còn hơn 24 tiếng hoặc đã qua giờ -> không nhắc gì', async () => {
    seedBooking(30 * HOUR);
    await cron.tick();
    expect(notify.dispatch).not.toHaveBeenCalled();

    seedBooking(-HOUR); // đã qua giờ bắt đầu
    await cron.tick();
    expect(notify.dispatch).not.toHaveBeenCalled();
  });
});
