/**
 * Unit test AdminService.listBookings (GET /admin/bookings) — mock Prisma.
 * Kiểm chứng: filter từng loại (date/status/venueId/search OR insensitive),
 * phân trang skip/take, include tránh N+1, mapping startTime/endTime từ
 * date+minute, totalPriceVnd = subtotal.
 */
import { AdminService } from '../../src/admin/admin.service';
import { AdminBookingsQuerySchema } from '../../src/admin/dto/admin.dto';
import { BookingStatus } from '@sango/shared';
import type { PrismaService } from '../../src/prisma/prisma.service';

jest.mock('../../src/prisma/prisma.service', () => ({
  PrismaService: class {},
}));

const VENUE_ID = '11111111-1111-4111-8111-111111111111';

function bookingRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    code: 'CH-20260901-0007',
    date: new Date('2026-09-01T00:00:00.000Z'),
    startMinute: 1020, // 17:00
    endMinute: 1110, // 18:30
    status: 'CONFIRMED',
    subtotal: 450_000,
    depositAmount: 135_000,
    createdAt: new Date('2026-08-31T10:00:00.000Z'),
    court: {
      name: 'Sân 5 số 1',
      venueId: VENUE_ID,
      venue: { id: VENUE_ID, name: 'Sân Cầu Giấy' },
    },
    customer: { fullName: 'Nguyễn Văn A', email: 'a@sango.vn' },
    ...overrides,
  };
}

describe('AdminService.listBookings', () => {
  let prisma: { booking: { findMany: jest.Mock; count: jest.Mock } };
  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = { booking: { findMany: jest.fn(), count: jest.fn() } };
    service = new AdminService(prisma as unknown as PrismaService);
    prisma.booking.findMany.mockResolvedValue([bookingRow()]);
    prisma.booking.count.mockResolvedValue(57);
  });

  it('filter date + status + venueId tạo where đúng; include court.venue + customer chống N+1', async () => {
    const res = await service.listBookings({
      date: '2026-09-01',
      status: BookingStatus.CONFIRMED,
      venueId: VENUE_ID,
      page: 2,
      pageSize: 50,
    });
    const arg = prisma.booking.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({
      date: new Date('2026-09-01T00:00:00.000Z'),
      status: 'CONFIRMED',
      court: { venueId: VENUE_ID },
    });
    expect(arg.skip).toBe(50);
    expect(arg.take).toBe(50);
    expect(arg.include.court.select.venue.select.name).toBe(true);
    expect(arg.include.customer.select.email).toBe(true);
    expect(res.total).toBe(57);
  });

  it('search khớp code HOẶC tên khách contains insensitive', async () => {
    await service.listBookings({ search: 'CH-2026', page: 1, pageSize: 20 });
    expect(prisma.booking.findMany.mock.calls[0][0].where).toEqual({
      OR: [
        { code: { contains: 'CH-2026', mode: 'insensitive' } },
        { customer: { fullName: { contains: 'CH-2026', mode: 'insensitive' } } },
      ],
    });
  });

  it('map item đúng contract: startTime/endTime ISO từ date+phút, totalPriceVnd = subtotal', async () => {
    const res = await service.listBookings({ page: 1, pageSize: 20 });
    expect(res.items[0]).toEqual({
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      code: 'CH-20260901-0007',
      venueId: VENUE_ID,
      venueName: 'Sân Cầu Giấy',
      courtName: 'Sân 5 số 1',
      customerName: 'Nguyễn Văn A',
      customerEmail: 'a@sango.vn',
      // 2026-09-01T17:00Z và 18:30Z theo biên bucket UTC thống nhất analytics
      startTime: '2026-09-01T17:00:00.000Z',
      endTime: '2026-09-01T18:30:00.000Z',
      status: 'CONFIRMED',
      totalPriceVnd: 450_000,
      createdAt: '2026-08-31T10:00:00.000Z',
    });
  });

  it('orderBy date desc trước, createdAt desc sau; không filter -> where rỗng', async () => {
    await service.listBookings({ page: 1, pageSize: 20 });
    const arg = prisma.booking.findMany.mock.calls[0][0];
    expect(arg.orderBy).toEqual([{ date: 'desc' }, { createdAt: 'desc' }]);
    expect(arg.where).toEqual({});
  });
});

describe('AdminBookingsQuerySchema', () => {
  it('mặc định page=1/pageSize=20, chặn pageSize>100 và date sai định dạng', () => {
    expect(AdminBookingsQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(AdminBookingsQuerySchema.parse({ status: 'COMPLETED', pageSize: '100' })).toEqual({
      status: 'COMPLETED',
      page: 1,
      pageSize: 100,
    });
    expect(() => AdminBookingsQuerySchema.parse({ pageSize: 101 })).toThrow();
    // Regression t18/B1: date hợp lệ YYYY-MM-DD phải PASS (regex từng mất \d làm mọi request date bị 400).
    expect(AdminBookingsQuerySchema.parse({ date: '2026-08-26' })).toEqual({
      date: '2026-08-26',
      page: 1,
      pageSize: 20,
    });
    expect(() => AdminBookingsQuerySchema.parse({ date: '01-09-2026' })).toThrow();
    expect(() => AdminBookingsQuerySchema.parse({ venueId: 'khong-phai-uuid' })).toThrow();
    expect(() => AdminBookingsQuerySchema.parse({ status: 'UNKNOWN' })).toThrow();
  });
});
