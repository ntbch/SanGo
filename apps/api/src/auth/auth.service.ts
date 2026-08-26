import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from './mailer.service';
import type {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';

const BCRYPT_COST = 12;
export const REFRESH_COOKIE = 'sango_refresh';
/** Đặc tả §3.1/§7: access 15 phút — refresh 7 ngày xoay vòng. */
export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

export type SafeUser = Pick<
  User,
  | 'id'
  | 'email'
  | 'fullName'
  | 'phone'
  | 'avatarUrl'
  | 'bannerUrl'
  | 'bio'
  | 'favoriteSports'
  | 'preferredPositions'
  | 'preferredFoot'
  | 'selfLevel'
  | 'bankName'
  | 'bankAccountNumber'
  | 'bankAccountName'
  | 'notifyEmail'
  | 'notifyInApp'
  | 'role'
  | 'status'
  | 'createdAt'
>;

/** Reset token chỉ lưu sha256(token) trong DB; token gốc (64 hex) chỉ đi qua email/console dev. */
const RESET_TOKEN_TTL_MINUTES = 30;
const RESET_TOKEN_TTL_MS = RESET_TOKEN_TTL_MINUTES * 60 * 1000;

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailer: MailerService,
  ) {}

  async register(dto: RegisterDto): Promise<SessionTokens> {
    const existed = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existed) {
      throw new ConflictException({ message: 'Email đã được đăng ký', code: 'EMAIL_TAKEN' });
    }
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: await bcrypt.hash(dto.password, BCRYPT_COST),
        fullName: dto.fullName,
        phone: dto.phone,
        // v1: đăng ký công khai chỉ tạo CUSTOMER; OWNER do admin cấp sau.
        role: 'CUSTOMER',
      },
    });
    return this.issueSession(user);
  }

  async login(dto: LoginDto): Promise<SessionTokens> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Cùng một mã lỗi cho cả email sai lẫn mật khẩu sai — tránh dò email.
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException({
        message: 'Email hoặc mật khẩu không đúng',
        code: 'INVALID_CREDENTIALS',
      });
    }
    if (user.status === 'LOCKED') {
      throw new ForbiddenException({
        message: 'Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên',
        code: 'ACCOUNT_LOCKED',
      });
    }
    return this.issueSession(user);
  }

  /**
   * Xoay vòng refresh token (đặc tả §7): thu hồi token cũ, cấp token mới.
   * Nếu token đã bị thu hồi mà vẫn được dùng lại => coi như bị đánh cắp:
   * thu hồi TOÀN BỘ session (mọi refresh token) của user đó.
   */
  async refresh(rawRefreshToken?: string): Promise<SessionTokens> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException({
        message: 'Thiếu refresh token',
        code: 'REFRESH_INVALID',
      });
    }

    let payload: { sub: string; jti: string; typ: string };
    try {
      payload = await this.jwtService.verifyAsync(rawRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException({
        message: 'Refresh token không hợp lệ hoặc đã hết hạn',
        code: 'REFRESH_INVALID',
      });
    }
    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException({
        message: 'Refresh token không hợp lệ',
        code: 'REFRESH_INVALID',
      });
    }

    const tokenHash = sha256(rawRefreshToken);
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!row) {
      throw new UnauthorizedException({
        message: 'Refresh token không hợp lệ hoặc đã hết hạn',
        code: 'REFRESH_INVALID',
      });
    }
    if (row.revokedAt) {
      // Phát hiện reuse => thu hồi cả session của user.
      await this.prisma.refreshToken.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      this.logger.warn(
        `Phát hiện reuse refresh token — đã thu hồi toàn bộ session của user ${row.userId}`,
      );
      throw new UnauthorizedException({
        message: 'Phát hiện sử dụng lại refresh token, vui lòng đăng nhập lại',
        code: 'TOKEN_REUSED',
      });
    }
    if (row.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException({
        message: 'Refresh token đã hết hạn',
        code: 'REFRESH_INVALID',
      });
    }

    const user = await this.prisma.user.findUnique({ where: { id: row.userId } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        message: 'Phiên đăng nhập không còn hiệu lực',
        code: 'REFRESH_INVALID',
      });
    }

    // Xoay vòng trong 1 transaction: thu hồi token cũ + cấp token mới.
    const rotated = await this.issueSession(user, async (createToken) => {
      await this.prisma.$transaction([
        this.prisma.refreshToken.update({ where: { tokenHash }, data: { revokedAt: new Date() } }),
        createToken(),
      ]);
    });
    return rotated;
  }

  /** Đăng xuất: thu hồi refresh token hiện tại (nếu còn hợp lệ). Access token tự hết hạn sau 15'. */
  async logout(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) return;
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(rawRefreshToken) },
    });
    if (row && !row.revokedAt) {
      await this.prisma.refreshToken.update({
        where: { id: row.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  /**
   * Quên mật khẩu: LUÔN im lặng khi email không tồn tại/khóa để tránh dò email (đặc tả §7).
   * Sinh token ngẫu nhiên 64 hex, chỉ lưu sha256(token) vào DB, hết hạn sau 30 phút.
   * Yêu cầu mới sẽ vô hiệu mọi link cũ còn hiệu lực của user.
   * Trả về token gốc để controller expose qua header X-Dev-Reset-Token khi KHÔNG ở production
   * (MAILER chưa cấu hình RESEND_API_KEY => MailerService log link ra console).
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || user.status !== 'ACTIVE') return null;

    // Chỉ link MỚI NHẤT được dùng: dọn mọi token cũ (kể cả đã dùng) của user.
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const webUrl = process.env.WEB_APP_URL ?? 'http://localhost:5173';
    await this.mailer.sendPasswordResetLink(
      user.email,
      `${webUrl}/dat-lai-mat-khau?token=${token}`,
    );
    return token;
  }

  /** Đặt lại mật khẩu bằng token từ link: verify hash + hạn dùng trong DB, thu hồi mọi session. */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const row = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: sha256(dto.token) },
    });
    if (!row || row.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException({
        message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
        code: 'RESET_TOKEN_INVALID',
      });
    }
    if (row.usedAt) {
      throw new BadRequestException({
        message: 'Link đặt lại mật khẩu đã được sử dụng, hãy yêu cầu link mới',
        code: 'RESET_TOKEN_STALE',
      });
    }

    // Nguyên tử: đổi mật khẩu + đánh dấu link đã dùng + thu hồi toàn bộ refresh token.
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash: await bcrypt.hash(dto.newPassword, BCRYPT_COST) },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  /** Đổi mật khẩu khi đang đăng nhập: xác thực mật khẩu hiện tại, thu hồi mọi session cũ. */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException({
        message: 'Mật khẩu hiện tại không đúng',
        code: 'CURRENT_PASSWORD_WRONG',
      });
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await bcrypt.hash(dto.newPassword, BCRYPT_COST) },
      }),
      // Đổi mật khẩu thành công => mọi phiên đăng nhập cũ phải đăng nhập lại.
      this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  /** Cấp cặp token cho user; onRotate cho phép xoay vòng trong cùng transaction. */
  private async issueSession(
    user: User,
    onRotate?: (
      createToken: () => ReturnType<PrismaService['refreshToken']['create']>,
    ) => Promise<unknown>,
  ): Promise<SessionTokens> {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { secret: process.env.JWT_SECRET, expiresIn: ACCESS_TTL_SECONDS },
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, jti: randomUUID(), typ: 'refresh' },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: REFRESH_TTL_SECONDS },
    );
    const createToken = () =>
      this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: sha256(refreshToken),
          expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
        },
      });

    if (onRotate) {
      await onRotate(createToken);
    } else {
      await createToken();
    }

    return { accessToken, refreshToken, user: toSafeUser(user) };
  }
}

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    bio: user.bio,
    favoriteSports: user.favoriteSports,
    preferredPositions: user.preferredPositions,
    preferredFoot: user.preferredFoot,
    selfLevel: user.selfLevel,
    bankName: user.bankName,
    bankAccountNumber: user.bankAccountNumber,
    bankAccountName: user.bankAccountName,
    notifyEmail: user.notifyEmail,
    notifyInApp: user.notifyInApp,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };
}
