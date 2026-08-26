import { UsersService } from '../../src/users/users.service';

jest.mock('../../src/prisma/prisma.service', () => ({
  PrismaService: class {},
}));

const USER = {
  id: 'u1',
  email: 'customer@sango.vn',
  passwordHash: '$2a$12$oldhash',
  fullName: 'Lê Thị Khách',
  phone: '0900000003',
  avatarUrl: null,
  role: 'CUSTOMER' as const,
  status: 'ACTIVE' as const,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('UsersService — updateProfile (PATCH /users/me)', () => {
  let service: UsersService;
  let prisma: { user: { findUnique: jest.Mock; update: jest.Mock } };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(USER),
        update: jest.fn().mockImplementation(({ data }) => ({ ...USER, ...data })),
      },
    };
    service = new UsersService(prisma as never);
  });

  it('cập nhật đúng các trường được gửi, giữ nguyên trường còn lại', async () => {
    const updated = await service.updateProfile('u1', {
      fullName: 'Tên Mới',
      avatarUrl: 'https://cdn.sango.vn/a.png',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { fullName: 'Tên Mới', avatarUrl: 'https://cdn.sango.vn/a.png' },
    });
    expect(updated.fullName).toBe('Tên Mới');
    expect(updated.phone).toBe('0900000003'); // không gửi -> không đổi
  });

  it('nhận null để xóa trắng phone/avatarUrl', async () => {
    await service.updateProfile('u1', { phone: null, avatarUrl: null });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { phone: null, avatarUrl: null },
    });
  });

  it('user không tồn tại -> USER_NOT_FOUND, không cập nhật', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.updateProfile('ghost', { fullName: 'X' })).rejects.toMatchObject({
      response: { code: 'USER_NOT_FOUND' },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
