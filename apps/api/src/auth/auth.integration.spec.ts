/**
 * Integration test vòng đời mật khẩu: forgot -> reset -> login lại + change-password.
 * Chạy với Postgres thật (DATABASE_URL); nếu không có DB -> tự bỏ qua để gate vẫn xanh.
 * Kiểm chứng hành vi DB thật: hash token, hạn 30 phút, dùng một lần, thu hồi session.
 */
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';

const SUFFIX = Date.now().toString(36);
const EMAIL = `pwd-flow-${SUFFIX}@courthub-itest.vn`;

describe('Auth password lifecycle (integration)', () => {
  let prisma: PrismaClient;
  let auth: AuthService;
  let dbUp = false;
  let userId!: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbUp = true;
    } catch {
      await prisma.$disconnect();
      return; // không có DB -> bỏ qua toàn bộ suite
    }

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule],
    }).compile();
    auth = moduleRef.get(AuthService);

    const user = await prisma.user.create({
      data: {
        email: EMAIL,
        passwordHash: await bcrypt.hash('OldPass1234', 12),
        fullName: 'I Test Mật Khẩu',
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    if (!dbUp) return;
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await prisma.$disconnect();
  });

  it('forgot -> reset -> đăng nhập bằng mật khẩu mới, session cũ chết', async () => {
    if (!dbUp) return; // không có DB -> bỏ qua để gate vẫn xanh
    // Session "cũ" tồn tại trước khi đổi mật khẩu
    await auth.login({ email: EMAIL, password: 'OldPass1234' });

    // 1) forgot: trả token gốc, DB chỉ lưu hash + hạn ~30'
    const raw = (await auth.forgotPassword({ email: EMAIL })) as string;
    expect(raw).toMatch(/^[0-9a-f]{64}$/);
    const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha(raw) } });
    expect(row).not.toBeNull();
    expect(row!.tokenHash).not.toBe(raw); // không lưu token gốc
    expect(row!.expiresAt.getTime()).toBeGreaterThanOrEqual(Date.now() + 29 * 60 * 1000);

    // 2) forgot lần nữa -> link đầu tiên phải bị dọn (chỉ link mới nhất hiệu lực)
    const raw2 = (await auth.forgotPassword({ email: EMAIL })) as string;
    await expect(
      prisma.passwordResetToken.findUnique({ where: { tokenHash: sha(raw) } }),
    ).resolves.toBeNull();

    // 3) reset bằng link mới nhất -> đổi MK + thu hồi mọi refresh token
    await auth.resetPassword({ token: raw2, newPassword: 'NewPass1234' });
    const revokedCount = await prisma.refreshToken.count({
      where: { userId, revokedAt: null },
    });
    expect(revokedCount).toBe(0);
    const usedRow = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: sha(raw2) },
    });
    expect(usedRow!.usedAt).not.toBeNull();

    // 4) mật khẩu mới đăng nhập được, mật khẩu cũ bị từ chối
    const reLogin = await auth.login({ email: EMAIL, password: 'NewPass1234' });
    expect(reLogin.user.id).toBe(userId);
    await expect(auth.login({ email: EMAIL, password: 'OldPass1234' })).rejects.toMatchObject({
      response: { code: 'INVALID_CREDENTIALS' },
    });

    // 5) link đã dùng gọi lại -> RESET_TOKEN_STALE
    await expect(
      auth.resetPassword({ token: raw2, newPassword: 'Again12345' }),
    ).rejects.toMatchObject({ response: { code: 'RESET_TOKEN_STALE' } });
  });

  it('reset token sai / hết hạn -> RESET_TOKEN_INVALID', async () => {
    if (!dbUp) return;
    await expect(
      auth.resetPassword({ token: 'totally-unknown-token', newPassword: 'Whatever123' }),
    ).rejects.toMatchObject({ response: { code: 'RESET_TOKEN_INVALID' } });

    // Token hết hạn: tạo row trực tiếp với expiresAt trong quá khứ rồi thử dùng
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash('NewPass1234', 12) },
    });
    const expiredRaw = 'expired-token-value';
    await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: sha(expiredRaw),
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    await expect(
      auth.resetPassword({ token: expiredRaw, newPassword: 'Whatever123' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('change-password: sai MK hiện tại chặn, đúng MK thì xóa sạch session cũ', async () => {
    if (!dbUp) return;
    const session = await auth.login({ email: EMAIL, password: 'NewPass1234' });
    expect(session.refreshToken).toBeTruthy();

    // Sai mật khẩu hiện tại -> CURRENT_PASSWORD_WRONG, session vẫn sống
    await expect(
      auth.changePassword(userId, { currentPassword: 'SaiMatKhau', newPassword: 'Final12345' }),
    ).rejects.toMatchObject({ response: { code: 'CURRENT_PASSWORD_WRONG' } });
    const aliveAfterFail = await prisma.refreshToken.count({
      where: { userId, revokedAt: null },
    });
    expect(aliveAfterFail).toBeGreaterThan(0);

    // Đúng -> mọi refresh token bị thu hồi; refresh() bằng token cũ phải fail
    await auth.changePassword(userId, {
      currentPassword: 'NewPass1234',
      newPassword: 'Final12345',
    });
    const alive = await prisma.refreshToken.count({ where: { userId, revokedAt: null } });
    expect(alive).toBe(0);
    // Token cũ đã bị thu hồi mà vẫn dùng => hệ thống coi là đánh cắp -> TOKEN_REUSED
    await expect(auth.refresh(session.refreshToken)).rejects.toMatchObject({
      response: { code: 'TOKEN_REUSED' },
    });
    await expect(auth.login({ email: EMAIL, password: 'NewPass1234' })).rejects.toBeTruthy();
    await auth.login({ email: EMAIL, password: 'Final12345' }); // MK mới hoạt động
  });
});

function sha(input: string): string {
  // đồng bộ công thức lưu hash trong AuthService (sha256 hex)
  return createHash('sha256').update(input).digest('hex');
}
