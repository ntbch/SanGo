import { UsersService } from '../../src/users/users.service';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
describe('UsersService — uploadAvatar (POST /users/me/avatar)', () => {
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

  it('stores a real image before persisting its URL and removes an upload if saving fails', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'sango-avatar-'));
    const previous = process.env.AVATAR_UPLOAD_DIR;
    process.env.AVATAR_UPLOAD_DIR = directory;
    const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMxkAAAAASUVORK5CYII=', 'base64');
    try {
      const saved = await service.uploadAvatar('u1', image, 'https://api.example.com/api/v1');
      const filename = new URL(saved.avatarUrl!).pathname.split('/').pop()!;
      expect(await readFile(join(directory, filename))).toEqual(image);
      prisma.user.update.mockRejectedValueOnce(new Error('database unavailable'));
      await expect(service.uploadAvatar('u1', image, 'https://api.example.com/api/v1')).rejects.toThrow('database unavailable');
      expect(await readdir(directory)).toEqual([filename]);
    } finally {
      if (previous === undefined) delete process.env.AVATAR_UPLOAD_DIR;
      else process.env.AVATAR_UPLOAD_DIR = previous;
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('rejects non-image bytes and oversized files without writing anything', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'sango-avatar-'));
    const previous = process.env.AVATAR_UPLOAD_DIR;
    process.env.AVATAR_UPLOAD_DIR = directory;
    try {
      // Chỉ kiểm magic bytes, không tin content-type do client khai báo.
      await expect(service.uploadAvatar('u1', Buffer.from('not an image'), 'https://api.example.com/api/v1'))
        .rejects.toThrow('Chỉ nhận ảnh JPG hoặc PNG tối đa 5MB');
      const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
      await expect(service.uploadAvatar('u1', Buffer.concat([pngHeader, Buffer.alloc(5 * 1024 * 1024)]), 'https://api.example.com/api/v1'))
        .rejects.toThrow('Chỉ nhận ảnh JPG hoặc PNG tối đa 5MB');
      // baseUrl quá dài cũng phải bị chặn trước khi ghi file.
      await expect(service.uploadAvatar('u1', Buffer.concat([pngHeader, Buffer.alloc(10)]), `https://api.example.com/api/v1/${'x'.repeat(500)}`))
        .rejects.toThrow('Địa chỉ máy chủ ảnh không hợp lệ');
      expect(await readdir(directory)).toEqual([]);
    } finally {
      if (previous === undefined) delete process.env.AVATAR_UPLOAD_DIR;
      else process.env.AVATAR_UPLOAD_DIR = previous;
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('deletes the superseded avatar file after a successful re-upload', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'sango-avatar-'));
    const previous = process.env.AVATAR_UPLOAD_DIR;
    process.env.AVATAR_UPLOAD_DIR = directory;
    const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMxkAAAAASUVORK5CYII=', 'base64');
    try {
      const first = await service.uploadAvatar('u1', image, 'https://api.example.com/api/v1');
      const firstName = new URL(first.avatarUrl!).pathname.split('/').pop()!;
      // findById trả về avatarUrl cũ -> file cũ phải bị dọn sau khi trỏ sang file mới.
      prisma.user.findUnique.mockResolvedValueOnce({ ...USER, avatarUrl: first.avatarUrl });
      const second = await service.uploadAvatar('u1', image, 'https://api.example.com/api/v1');
      const secondName = new URL(second.avatarUrl!).pathname.split('/').pop()!;
      expect(secondName).not.toBe(firstName);
      expect(await readdir(directory)).toEqual([secondName]);
    } finally {
      if (previous === undefined) delete process.env.AVATAR_UPLOAD_DIR;
      else process.env.AVATAR_UPLOAD_DIR = previous;
      await rm(directory, { recursive: true, force: true });
    }
  });
});
