import { BookingsCronService } from '../../src/bookings/bookings.cron.service';
import type { NotifyService } from '../../src/notifications/notify.service';

jest.mock('../../src/prisma/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('../../src/bookings/bookings.service', () => ({ BookingsService: class {} }));

const HOUR = 3_600_000;

/** date/startMinute sao cho giờ chơi = now + offsetMs (UTC, không lệch múi giờ). */
function slotIn(offsetMs: number) {
  const start = new Date(Date.now() + offsetMs);
  const dateIso = start.toISOString().slice(0, 10);
  const startMinute = start.getUTCHours() * 60 + start.getUTCMinutes();
  return { date: new Date(dateIso + 'T00:00:00.000Z'), startMinute };
}

describe('BookingsCronService — nhắc T-24h/T-2h chống trùng bằng cột remindedAt*', () => {
  let cron: BookingsCronService;
  let row: Record<string, unknown>;
  let prisma: {
    booking: {
      findMany: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let notify: { dispatch: jest.Mock };

  beforeEach(() => {
    row = {};
    prisma = {
      booking: {
        findMany: jest.fn().mockImplementation(() => Promise.resolve(row.id ? [row] : [])),
        /**
         * Mô phỏng claim ATOMIC của DB: chỉ thắng khi cột mốc còn null.
         * Trả về {count:0} nếu đã được claim trước đó (giống chạy song song).
         */
        updateMany: jest
          .fn()
          .mockImplementation(({ where }: { where: Record<string, unknown> }) => {
            // Dạng nhả claim: where chỉ có id -> xóa cả hai cột mốc
            if (!('remindedAt24h' in where) && !('remindedAt2h' in where)) {
              row.remindedAt24h = null;
              row.remindedAt2h = null;
              return Promise.resolve({ count: 1 });
            }
            const col = 'remindedAt24h' in where ? 'remindedAt24h' : 'remindedAt2h';
            if (where.id !== row.id || row[col]) return Promise.resolve({ count: 0 });
            row[col] = new Date();
            return Promise.resolve({ count: 1 });
          }),
      },
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

  const seedBooking = (offsetMs: number, flags: Record<string, unknown> = {}) => {
    const { date, startMinute } = slotIn(offsetMs);
    Object.assign(row, {
      id: 'b1',
      code: 'CH-20260825-0001',
      customerId: 'u1',
      date,
      startMinute,
      endMinute: startMinute + 90,
      remindedAt24h: null,
      remindedAt2h: null,
      court: { name: 'Sân 5A', venue: { name: 'KĐT Sân Cỏ' } },
      ...flags,
    });
  };

  it('còn ~30 phút -> nhắc T-2h đúng 1 lần; tick lần 2 KHÔNG lặp', async () => {
    seedBooking(30 * 60_000);
    await cron.sendReminders();
    expect(notify.dispatch).toHaveBeenCalledTimes(1);
    expect(notify.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Sắp tới giờ chơi!' }),
    );

    // Tick kế tiếp: claim trả count=0 (đã nhắc) -> không dispatch thêm
    await cron.sendReminders();
    expect(notify.dispatch).toHaveBeenCalledTimes(1);
  });

  it('claim thua cuộc (instance khác gửi rồi) -> không dispatch', async () => {
    seedBooking(30 * 60_000);
    await cron.sendReminders(); // tick A gửi
    row.remindedAt24h = null;
    row.remindedAt2h = new Date(); // mô phỏng đã claim ở tick khác
    await cron.sendReminders(); // tick B
    expect(notify.dispatch).toHaveBeenCalledTimes(1);
  });

  it('còn ~20 tiếng -> chỉ nhắc T-24h (pha T-24h loại trừ cửa sổ T-2h)', async () => {
    seedBooking(20 * HOUR);
    await cron.sendReminders();
    expect(notify.dispatch).toHaveBeenCalledTimes(1);
    expect(notify.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Nhắc lịch: ngày mai bạn có trận' }),
    );
  });

  it('gửi lỗi -> nhả claim để tick sau thử lại', async () => {
    seedBooking(30 * 60_000);
    notify.dispatch.mockRejectedValueOnce(new Error('SMTP down'));
    await cron.sendReminders();
    expect(row.remindedAt2h).toBeNull(); // đã được nhả lại

    // Tick sau: claim thắng trở lại và gửi thành công (lần 1 lỗi + lần 2 ok = 2)
    await cron.sendReminders();
    expect(notify.dispatch).toHaveBeenCalledTimes(2);
    expect(row.remindedAt2h).toBeInstanceOf(Date);
  });

  it('còn hơn 24 tiếng hoặc đã qua giờ -> không nhắc gì', async () => {
    seedBooking(30 * HOUR);
    await cron.sendReminders();
    expect(notify.dispatch).not.toHaveBeenCalled();

    seedBooking(-HOUR); // đã qua giờ bắt đầu
    await cron.sendReminders();
    expect(notify.dispatch).not.toHaveBeenCalled();
  });
});
