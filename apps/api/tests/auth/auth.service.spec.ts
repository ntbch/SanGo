import { ConflictException, ForbiddenException } from '@nestjs/common';
import { type JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { AuthService } from '../../src/auth/auth.service';
import type { MailerService } from '../../src/auth/mailer.service';

jest.mock('../../src/prisma/prisma.service', () => ({
  PrismaService: class {},
}));

// bcryptjs v3 export kiểu ESM (không thể spyOn) -> mock nguyên module.
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

const USER_ACTIVE = {
  id: 'u1',
  email: 'customer@sango.vn',
  passwordHash: '$2a$12$oldhash',
  fullName: 'Lê Thị Khách',
  phone: '0900000003',
  role: 'CUSTOMER' as const,
  status: 'ACTIVE' as const,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    refreshToken: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    passwordResetToken: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let jwt: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let mailer: { sendPasswordResetLink: jest.Mock };

  const futureDate = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  beforeEach(async () => {
    (bcrypt.hash as jest.Mock).mockImplementation((pw: string) => `hashed(${pw})`);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) => ({ id: 'rt-new', ...data })),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
      passwordResetToken: {
        findUnique: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) => ({ id: 'prt-new', ...data })),
        update: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn().mockImplementation(async (ops: unknown[]) => Promise.all(ops)),
    };
    jwt = {
      signAsync: jest
        .fn()
        .mockImplementation(async (payload) =>
          payload.typ === 'refresh' ? 'raw.refresh.jwt' : 'access.jwt',
        ),
      verifyAsync: jest.fn(),
    };
    mailer = { sendPasswordResetLink: jest.fn() };

    service = new AuthService(
      prisma as never,
      jwt as unknown as JwtService,
      mailer as unknown as MailerService,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  // ---------------------------------------------------------------- register
  describe('register', () => {
    it('tạo user CUSTOMER với mật khẩu bcrypt + cấp session', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(USER_ACTIVE);

      const result = await service.register({
        email: USER_ACTIVE.email,
        password: 'Sup3rSecret!',
        fullName: USER_ACTIVE.fullName,
      });

      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      const data = prisma.user.create.mock.calls[0][0].data;
      expect(data.passwordHash).toBe('hashed(Sup3rSecret!)');
      expect(data.role).toBe('CUSTOMER');

      expect(result.accessToken).toBe('access.jwt');
      expect(result.refreshToken).toBe('raw.refresh.jwt');
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
      const tokenData = prisma.refreshToken.create.mock.calls[0][0].data;
      expect(tokenData.tokenHash).toBe(sha256('raw.refresh.jwt'));
      expect((tokenData.expiresAt as Date).getTime()).toBeGreaterThan(Date.now());
    });

    it('từ chối email đã tồn tại EMAIL_TAKEN và không tạo gì', async () => {
      prisma.user.findUnique.mockResolvedValue(USER_ACTIVE);
      await expect(
        service.register({
          ...{ email: USER_ACTIVE.email, password: 'x'.repeat(10), fullName: 'A B' },
        }),
      ).rejects.toMatchObject({ response: { code: 'EMAIL_TAKEN' } });
      expect(prisma.user.create).not.toHaveBeenCalled();
      await expect(
        service.register({ email: USER_ACTIVE.email, password: 'x'.repeat(10), fullName: 'A B' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  // ------------------------------------------------------------------- login
  describe('login', () => {
    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue(USER_ACTIVE);
      prisma.user.create.mockResolvedValue(USER_ACTIVE);
    });

    it('đăng nhập đúng -> cấp session mới', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await service.login({ email: USER_ACTIVE.email, password: 'right-pass' });
      expect(result.accessToken).toBe('access.jwt');
      expect(result.user.email).toBe(USER_ACTIVE.email);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
    });

    it('sai mật khẩu -> INVALID_CREDENTIALS', async () => {
      await expect(
        service.login({ email: USER_ACTIVE.email, password: 'wrong' }),
      ).rejects.toMatchObject({
        response: { code: 'INVALID_CREDENTIALS' },
      });
    });

    it('email không tồn tại -> cùng mã INVALID_CREDENTIALS (chống dò email)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: 'ghost@sango.vn', password: 'whatever' }),
      ).rejects.toMatchObject({
        response: { code: 'INVALID_CREDENTIALS' },
      });
    });

    it('tài khoản LOCKED -> ACCOUNT_LOCKED dù mật khẩu đúng', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue({ ...USER_ACTIVE, status: 'LOCKED' });
      await expect(
        service.login({ email: USER_ACTIVE.email, password: 'right-pass' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.login({ email: USER_ACTIVE.email, password: 'right-pass' }),
      ).rejects.toMatchObject({
        response: { code: 'ACCOUNT_LOCKED' },
      });
    });
  });

  // ----------------------------------------------------------------- refresh
  describe('refresh — xoay vòng & phát hiện reuse ', () => {
    const rawToken = 'raw.refresh.jwt';

    it('xoay vòng hợp lệ: thu hồi token cũ + cấp token mới trong 1 transaction', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'u1', jti: 'jti-1', typ: 'refresh' });
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-old',
        userId: 'u1',
        tokenHash: sha256(rawToken),
        revokedAt: null,
        expiresAt: futureDate(),
      });
      prisma.user.findUnique.mockResolvedValue(USER_ACTIVE);

      const result = await service.refresh(rawToken);

      // Token cũ bị đánh dấu thu hồi
      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tokenHash: sha256(rawToken) },
          data: { revokedAt: expect.any(Date) },
        }),
      );
      // Token mới được cấp
      expect(prisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'u1', tokenHash: sha256(rawToken) }),
        }),
      );
      // Cả hai trong cùng transaction
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result.refreshToken).toBe('raw.refresh.jwt');
      expect(result.refreshToken).not.toEqual(rawToken === result.refreshToken);
      expect(result.accessToken).toBe('access.jwt');
    });

    it('reuse: token đã thu hồi mà dùng lại -> THU HỒI TOÀN BỘ session của user + TOKEN_REUSED', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'u1', jti: 'jti-1', typ: 'refresh' });
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-old',
        userId: 'u1',
        tokenHash: sha256(rawToken),
        revokedAt: new Date(Date.now() - 1000),
        expiresAt: futureDate(),
      });

      await expect(service.refresh(rawToken)).rejects.toMatchObject({
        response: { code: 'TOKEN_REUSED' },
      });
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('token không tồn tại trong DB -> REFRESH_INVALID, không đụng session khác', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'u1', jti: 'ghost', typ: 'refresh' });
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refresh(rawToken)).rejects.toMatchObject({
        response: { code: 'REFRESH_INVALID' },
      });
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it('jwt hỏng/chữ ký sai/hết hạn -> REFRESH_INVALID', async () => {
      jwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));
      await expect(service.refresh(rawToken)).rejects.toMatchObject({
        response: { code: 'REFRESH_INVALID' },
      });
      expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
    });

    it('typ không phải refresh (dùng access token làm refresh) -> REFRESH_INVALID', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'u1', typ: 'pwd_reset' });
      await expect(service.refresh(rawToken)).rejects.toMatchObject({
        response: { code: 'REFRESH_INVALID' },
      });
    });

    it('row đã hết hạn -> REFRESH_INVALID', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'u1', jti: 'jti-1', typ: 'refresh' });
      prisma.refreshToken.findUnique.mockResolvedValue({
        userId: 'u1',
        tokenHash: sha256(rawToken),
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.refresh(rawToken)).rejects.toMatchObject({
        response: { code: 'REFRESH_INVALID' },
      });
    });

    it('gọi thiếu cookie -> REFRESH_INVALID ngay cả trước khi verify', async () => {
      await expect(service.refresh(undefined)).rejects.toMatchObject({
        response: { code: 'REFRESH_INVALID' },
      });
      expect(jwt.verifyAsync).not.toHaveBeenCalled();
    });

    it('user bị khóa giữa chừng -> REFRESH_INVALID', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'u1', jti: 'jti-1', typ: 'refresh' });
      prisma.refreshToken.findUnique.mockResolvedValue({
        userId: 'u1',
        tokenHash: sha256(rawToken),
        revokedAt: null,
        expiresAt: futureDate(),
      });
      prisma.user.findUnique.mockResolvedValue({ ...USER_ACTIVE, status: 'LOCKED' });
      await expect(service.refresh(rawToken)).rejects.toMatchObject({
        response: { code: 'REFRESH_INVALID' },
      });
    });
  });

  // ------------------------------------------------------------------ logout
  describe('logout', () => {
    it('thu hồi refresh token hiện tại', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({ id: 'rt-1', revokedAt: null });
      await service.logout('some-token');
      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rt-1' }, data: { revokedAt: expect.any(Date) } }),
      );
    });

    it('không có cookie -> không lỗi, không truy vấn', async () => {
      await service.logout(undefined);
      expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
    });

    it('token đã thu hồi từ trước -> bỏ qua im lặng', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({ id: 'rt-1', revokedAt: new Date() });
      await service.logout('some-token');
      expect(prisma.refreshToken.update).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------- forgot / reset
  describe('forgotPassword — token ngẫu nhiên, DB chỉ lưu hash ', () => {
    it('user ACTIVE -> dọn link cũ + tạo row token (chỉ hash) + trả token gốc + gửi link', async () => {
      prisma.user.findUnique.mockResolvedValue(USER_ACTIVE);

      const token = await service.forgotPassword({ email: USER_ACTIVE.email });

      expect(token).toMatch(/^[0-9a-f]{64}$/);
      // Chỉ link MỚI NHẤT có hiệu lực: mọi token cũ bị dọn trước khi tạo
      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
      });
      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          tokenHash: sha256(token as string), // DB KHÔNG lưu token gốc
          expiresAt: expect.any(Date),
        },
      });
      const data = prisma.passwordResetToken.create.mock.calls[0][0].data;
      expect(data.expiresAt.getTime()).toBeGreaterThanOrEqual(Date.now() + 29 * 60 * 1000);
      expect(mailer.sendPasswordResetLink).toHaveBeenCalledTimes(1);
      const [, link] = mailer.sendPasswordResetLink.mock.calls[0];
      expect(link).toContain(`/reset-password?token=${token}`);
    });

    it('email lạ -> im lặng tuyệt đối (chống dò email)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.forgotPassword({ email: 'ghost@sango.vn' })).resolves.toBeNull();
      expect(prisma.passwordResetToken.deleteMany).not.toHaveBeenCalled();
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mailer.sendPasswordResetLink).not.toHaveBeenCalled();
    });

    it('user LOCKED -> cũng không gửi link', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...USER_ACTIVE, status: 'LOCKED' });
      await expect(service.forgotPassword({ email: USER_ACTIVE.email })).resolves.toBeNull();
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mailer.sendPasswordResetLink).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword — verify hash + hạn dùng trong DB ', () => {
    const rowValid = () => ({
      id: 'prt1',
      userId: 'u1',
      tokenHash: sha256('good-token'),
      expiresAt: futureDate(),
      usedAt: null,
      createdAt: new Date(),
    });

    it('token hợp lệ -> đổi mật khẩu + đánh dấu đã dùng + thu hồi mọi session trong 1 transaction', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(rowValid());
      prisma.user.update.mockResolvedValue(USER_ACTIVE);

      await service.resetPassword({ token: 'good-token', newPassword: 'NewPass1234' });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass1234', 12);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { passwordHash: 'hashed(NewPass1234)' },
      });
      expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: 'prt1' },
        data: { usedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('token sai / không tồn tại trong DB -> RESET_TOKEN_INVALID, không ghi gì', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(null);
      await expect(
        service.resetPassword({ token: 'wrong-token-value', newPassword: 'NewPass1234' }),
      ).rejects.toMatchObject({ response: { code: 'RESET_TOKEN_INVALID' } });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('link quá 30 phút -> RESET_TOKEN_INVALID', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        ...rowValid(),
        expiresAt: new Date(Date.now() - 60 * 1000),
      });
      await expect(
        service.resetPassword({ token: 'good-token', newPassword: 'NewPass1234' }),
      ).rejects.toMatchObject({ response: { code: 'RESET_TOKEN_INVALID' } });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('link đã dùng rồi -> RESET_TOKEN_STALE (không dùng lại được)', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        ...rowValid(),
        usedAt: new Date(),
      });
      await expect(
        service.resetPassword({ token: 'good-token', newPassword: 'NewPass1234' }),
      ).rejects.toMatchObject({ response: { code: 'RESET_TOKEN_STALE' } });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('changePassword — đổi MK khi đăng nhập, xóa session cũ ', () => {
    it('đúng mật khẩu hiện tại -> đổi mật khẩu + thu hồi mọi phiên cũ trong 1 transaction', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue(USER_ACTIVE);

      await service.changePassword('u1', {
        currentPassword: 'OldPass1234',
        newPassword: 'NewPass1234',
      });

      expect(bcrypt.compare).toHaveBeenCalledWith('OldPass1234', '$2a$12$oldhash');
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { passwordHash: 'hashed(NewPass1234)' },
      });
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('sai mật khẩu hiện tại -> CURRENT_PASSWORD_WRONG, không ghi gì', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      prisma.user.findUnique.mockResolvedValue(USER_ACTIVE);

      await expect(
        service.changePassword('u1', { currentPassword: 'wrong-pass', newPassword: 'NewPass1234' }),
      ).rejects.toMatchObject({ response: { code: 'CURRENT_PASSWORD_WRONG' } });
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it('user không tồn tại -> CURRENT_PASSWORD_WRONG (không lộ thông tin)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.changePassword('ghost-id', { currentPassword: 'x', newPassword: 'NewPass1234' }),
      ).rejects.toMatchObject({ response: { code: 'CURRENT_PASSWORD_WRONG' } });
    });
  });
});
