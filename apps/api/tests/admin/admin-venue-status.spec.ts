/**
 * Unit test treo/kích hoạt cụm sân (task t3):
 * - AdminService.updateVenueStatus: chỉ chuyển APPROVED <-> SUSPENDED;
 *   PENDING/REJECTED phải qua approve/reject -> 400 INVALID_STATUS_TRANSITION.
 * - UpdateVenueStatusSchema: body chỉ nhận APPROVED | SUSPENDED.
 * - BookingsService.createHold: venue không APPROVED thì không đặt được (VENUE_NOT_BOOKABLE).
 */
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AdminService } from '../../src/admin/admin.service';
import { UpdateVenueStatusSchema } from '../../src/admin/dto/admin.dto';
import { BookingsService } from '../../src/bookings/bookings.service';
import type { PrismaService } from '../../src/prisma/prisma.service';

jest.mock('../../src/prisma/prisma.service', () => ({
  PrismaService: class {},
}));

const VENUE_ID = '11111111-1111-4111-8111-111111111111';
const COURT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function venueRow(status: string) {
  return {
    id: VENUE_ID,
    ownerId: '22222222-2222-4222-8222-222222222222',
    name: 'Sân Treo',
    status,
    rejectReason: null,
    owner: {
      id: '22222222-2222-4222-8222-222222222222',
      email: 'o@sango.vn',
      fullName: 'Owner',
      phone: null,
    },
    courts: [],
  };
}

describe('AdminService.updateVenueStatus', () => {
  let prisma: { venue: { findUnique: jest.Mock; update: jest.Mock } };
  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = { venue: { findUnique: jest.fn(), update: jest.fn() } };
    service = new AdminService(prisma as unknown as PrismaService);
    prisma.venue.update.mockImplementation(async (args: { data: { status: string } }) =>
      venueRow(args.data.status),
    );
  });

  it('APPROVED -> SUSPENDED thành công', async () => {
    prisma.venue.findUnique.mockResolvedValue(venueRow('APPROVED'));
    const res = await service.updateVenueStatus(VENUE_ID, { status: 'SUSPENDED' });
    expect(prisma.venue.update).toHaveBeenCalledWith({
      where: { id: VENUE_ID },
      data: { status: 'SUSPENDED' },
    });
    expect(res.status).toBe('SUSPENDED');
  });

  it('SUSPENDED -> APPROVED kích hoạt lại thành công', async () => {
    prisma.venue.findUnique.mockResolvedValue(venueRow('SUSPENDED'));
    const res = await service.updateVenueStatus(VENUE_ID, { status: 'APPROVED' });
    expect(prisma.venue.update).toHaveBeenCalledWith({
      where: { id: VENUE_ID },
      data: { status: 'APPROVED' },
    });
    expect(res.status).toBe('APPROVED');
  });

  it.each(['PENDING', 'REJECTED'])(
    'venue %s -> 400 INVALID_STATUS_TRANSITION, không update',
    async (from) => {
      prisma.venue.findUnique.mockResolvedValue(venueRow(from));
      for (const to of ['APPROVED', 'SUSPENDED'] as const) {
        await expect(service.updateVenueStatus(VENUE_ID, { status: to })).rejects.toMatchObject({
          response: { code: 'INVALID_STATUS_TRANSITION' },
        });
      }
      expect(prisma.venue.update).not.toHaveBeenCalled();
    },
  );

  it('venue không tồn tại -> 404 VENUE_NOT_FOUND', async () => {
    prisma.venue.findUnique.mockResolvedValue(null);
    await expect(
      service.updateVenueStatus(VENUE_ID, { status: 'SUSPENDED' }),
    ).rejects.toMatchObject({
      constructor: NotFoundException,
      response: { code: 'VENUE_NOT_FOUND' },
    });
    expect(prisma.venue.update).not.toHaveBeenCalled();
  });

  it('BadRequestException đúng lớp lỗi cho transition sai', async () => {
    prisma.venue.findUnique.mockResolvedValue(venueRow('PENDING'));
    await expect(
      service.updateVenueStatus(VENUE_ID, { status: 'SUSPENDED' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('UpdateVenueStatusSchema', () => {
  it('chỉ nhận APPROVED | SUSPENDED', () => {
    expect(UpdateVenueStatusSchema.parse({ status: 'APPROVED' })).toEqual({ status: 'APPROVED' });
    expect(UpdateVenueStatusSchema.parse({ status: 'SUSPENDED' })).toEqual({
      status: 'SUSPENDED',
    });
    expect(() => UpdateVenueStatusSchema.parse({ status: 'PENDING' })).toThrow();
    expect(() => UpdateVenueStatusSchema.parse({ status: 'REJECTED' })).toThrow();
    expect(() => UpdateVenueStatusSchema.parse({})).toThrow();
  });
});

describe('BookingsService.createHold chặn venue không APPROVED', () => {
  function makeCourt(venueStatus: string) {
    return {
      id: COURT_ID,
      status: 'ACTIVE',
      slotMinutes: 60,
      venue: { openMinute: 360, closeMinute: 1320, depositPercent: 30, status: venueStatus },
    };
  }

  function buildDeps(court: unknown) {
    const prisma = { court: { findUnique: jest.fn().mockResolvedValue(court) } };
    // createHold sau guard sẽ đi tiếp tới validate slot — dùng slots không liền kề
    // để dừng sớm mà không đụng pricing/transaction.
    const service = new BookingsService(
      prisma as unknown as PrismaService,
      {} as never,
      {} as never,
    );
    return service;
  }

  const baseDto = {
    courtId: COURT_ID,
    date: '2026-09-01',
    slots: [600, 601], // cố tình không liền kề để chặn ở bước kế tiếp nếu qua được guard
  };

  it('venue SUSPENDED -> 409 VENUE_NOT_BOOKABLE', async () => {
    const service = buildDeps(makeCourt('SUSPENDED'));
    await expect(service.createHold({ id: 'u1' }, baseDto as never)).rejects.toMatchObject({
      constructor: ConflictException,
      response: { code: 'VENUE_NOT_BOOKABLE' },
    });
  });

  it('venue APPROVED -> qua được guard (lỗi tiếp theo là SLOTS_NOT_CONTIGUOUS)', async () => {
    const service = buildDeps(makeCourt('APPROVED'));
    await expect(service.createHold({ id: 'u1' }, baseDto as never)).rejects.toMatchObject({
      response: { code: 'SLOTS_NOT_CONTIGUOUS' },
    });
  });

  it('venue PENDING cũng bị chặn đặt', async () => {
    const service = buildDeps(makeCourt('PENDING'));
    await expect(service.createHold({ id: 'u1' }, baseDto as never)).rejects.toMatchObject({
      response: { code: 'VENUE_NOT_BOOKABLE' },
    });
  });
});
