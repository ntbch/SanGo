/**
 * Unit test AdminService — quản lý người dùng (task t2):
 * - listUsers: where search contains insensitive trên fullName/email, lọc
 *   role/status, phân trang pageSize<=100, bookingCount từ _count(bookings).
 * - updateUserStatus: cấm tự khoá (CANNOT_LOCK_SELF), cấm khoá ADMIN khác
 *   (CANNOT_LOCK_ADMIN), mở khoá luôn cho phép, 404 USER_NOT_FOUND, trả safe user.
 */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserStatus, UserRole } from '@sango/shared';
import { AdminService } from '../../src/admin/admin.service';
import { AdminUserListQuerySchema, UpdateUserStatusSchema } from '../../src/admin/dto/admin.dto';
import type { PrismaService } from '../../src/prisma/prisma.service';

jest.mock('../../src/prisma/prisma.service', () => ({
  PrismaService: class {},
}));

const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const OWNER_ID = '33333333-3333-4333-8333-333333333333';

function userRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: USER_ID,
    email: 'khach@sango.vn',
    passwordHash: '$2a$10$hash',
    fullName: 'Nguyễn Văn Khách',
    phone: '0900000000',
    avatarUrl: null,
    role: 'CUSTOMER',
    status: 'ACTIVE',
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('AdminService.listUsers', () => {
  let prisma: { user: { findMany: jest.Mock; count: jest.Mock } };
  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = { user: { findMany: jest.fn(), count: jest.fn() } };
    service = new AdminService(prisma as unknown as PrismaService);
    prisma.user.findMany.mockResolvedValue([userRow({ _count: { bookings: 12 } })]);
    prisma.user.count.mockResolvedValue(41);
  });

  it('where đúng: search OR insensitive fullName/email + lọc role/status; skip/take theo page/pageSize', async () => {
    const res = await service.listUsers({
      search: 'nguyen',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      page: 3,
      pageSize: 20,
    });
    const arg = prisma.user.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({
      OR: [
        { fullName: { contains: 'nguyen', mode: 'insensitive' } },
        { email: { contains: 'nguyen', mode: 'insensitive' } },
      ],
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });
    expect(arg.skip).toBe(40);
    expect(arg.take).toBe(20);
    expect(arg.select._count.select.bookings).toBe(true);
    expect(res).toEqual({
      items: [expect.objectContaining({ bookingCount: 12, createdAt: '2026-08-01T00:00:00.000Z' })],
      total: 41,
    });
    // Không lộ passwordHash trong item.
    expect(res.items[0]).not.toHaveProperty('passwordHash');
  });

  it('không truyền filter -> where rỗng, mặc định page=1/pageSize=20', async () => {
    await service.listUsers({ page: 1, pageSize: 20 });
    const arg = prisma.user.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({});
    expect(arg.skip).toBe(0);
    expect(arg.take).toBe(20);
  });
});

describe('AdminService.updateUserStatus', () => {
  let prisma: { user: { findUnique: jest.Mock; update: jest.Mock } };
  let service: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = { user: { findUnique: jest.fn(), update: jest.fn() } };
    service = new AdminService(prisma as unknown as PrismaService);
    prisma.user.update.mockImplementation(async (args: { data: { status: string } }) =>
      userRow({ status: args.data.status }),
    );
  });

  it('khoá CUSTOMER thành công -> update LOCKED, trả safe user không có passwordHash', async () => {
    prisma.user.findUnique.mockResolvedValue(userRow());
    const res = await service.updateUserStatus(ADMIN_ID, USER_ID, {
      status: UserStatus.LOCKED,
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { status: 'LOCKED' },
    });
    expect(res.status).toBe('LOCKED');
    expect(res).not.toHaveProperty('passwordHash');
  });

  it('tự khoá chính mình -> 400 CANNOT_LOCK_SELF, không đụng DB update', async () => {
    prisma.user.findUnique.mockResolvedValue(userRow({ id: ADMIN_ID, role: 'ADMIN' }));
    await expect(
      service.updateUserStatus(ADMIN_ID, ADMIN_ID, { status: UserStatus.LOCKED }),
    ).rejects.toMatchObject({
      constructor: BadRequestException,
      response: { code: 'CANNOT_LOCK_SELF' },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('khoá ADMIN khác -> 400 CANNOT_LOCK_ADMIN', async () => {
    prisma.user.findUnique.mockResolvedValue(userRow({ id: OWNER_ID, role: 'ADMIN' }));
    await expect(
      service.updateUserStatus(ADMIN_ID, OWNER_ID, { status: UserStatus.LOCKED }),
    ).rejects.toMatchObject({
      response: { code: 'CANNOT_LOCK_ADMIN' },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('mở khoá (ACTIVE) admin bị khoá bởi admin khác -> cho phép', async () => {
    prisma.user.findUnique.mockResolvedValue(
      userRow({ id: OWNER_ID, role: 'ADMIN', status: 'LOCKED' }),
    );
    const res = await service.updateUserStatus(ADMIN_ID, OWNER_ID, {
      status: UserStatus.ACTIVE,
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: OWNER_ID },
      data: { status: 'ACTIVE' },
    });
    expect(res.status).toBe('ACTIVE');
  });

  it('user không tồn tại -> 404 USER_NOT_FOUND', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.updateUserStatus(ADMIN_ID, USER_ID, { status: UserStatus.ACTIVE }),
    ).rejects.toMatchObject({
      constructor: NotFoundException,
      response: { code: 'USER_NOT_FOUND' },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

describe('Admin user schemas', () => {
  it('AdminUserListQuerySchema: mặc định phân trang, chặn pageSize > 100', () => {
    expect(AdminUserListQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(AdminUserListQuerySchema.parse({ search: '  a  ', pageSize: '100' })).toEqual({
      search: 'a',
      page: 1,
      pageSize: 100,
    });
    expect(() => AdminUserListQuerySchema.parse({ pageSize: 101 })).toThrow();
    expect(() => AdminUserListQuerySchema.parse({ role: 'SUPERADMIN' })).toThrow();
    expect(() => AdminUserListQuerySchema.parse({ status: 'HIDDEN' })).toThrow();
  });

  it('UpdateUserStatusSchema: chỉ nhận ACTIVE | LOCKED', () => {
    expect(UpdateUserStatusSchema.parse({ status: 'LOCKED' })).toEqual({ status: 'LOCKED' });
    expect(() => UpdateUserStatusSchema.parse({ status: 'DELETED' })).toThrow();
    expect(() => UpdateUserStatusSchema.parse({})).toThrow();
  });
});
