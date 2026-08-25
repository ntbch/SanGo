import { Body, Controller, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  type ChangePasswordDto,
  type ForgotPasswordDto,
  type LoginDto,
  type RegisterDto,
  type ResetPasswordDto,
} from './dto/auth.dto';
import { ZodValidationPipe } from './zod-validation.pipe';
import { REFRESH_COOKIE, REFRESH_TTL_SECONDS, AuthService } from './auth.service';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard, type AuthUser } from '../common/guards/jwt-auth.guard';

const emailPasswordBody = {
  schema: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'customer@courthub.vn' },
      password: { type: 'string', minLength: 8, example: 'Courthub@2026' },
    },
  },
};

function readRefreshCookie(req: Request): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === REFRESH_COOKIE) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

function setRefreshCookie(res: Response, token: string) {
  // Đặc tả §7: cookie httpOnly; Secure; SameSite=Lax, scope /api/v1/auth.
  // COOKIE_SECURE=false chỉ dùng khi demo qua http không phải localhost.
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE !== 'false',
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: REFRESH_TTL_SECONDS * 1000,
  });
}

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Đăng ký tài khoản CUSTOMER bằng email + mật khẩu' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'fullName'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8, maxLength: 72 },
        fullName: { type: 'string', example: 'Nguyễn Văn A' },
        phone: { type: 'string', example: '0901234567' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Đăng ký thành công — trả access token + user, refresh token nằm trong cookie httpOnly',
  })
  @ApiResponse({ status: 409, description: 'EMAIL_TAKEN — email đã tồn tại' })
  async register(
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterDto,
  ) {
    const session = await this.authService.register(dto);
    setRefreshCookie(res, session.refreshToken);
    return { accessToken: session.accessToken, user: session.user };
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Đăng nhập email + mật khẩu' })
  @ApiBody(emailPasswordBody)
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công — access token + cookie refresh xoay vòng',
  })
  @ApiResponse({ status: 401, description: 'INVALID_CREDENTIALS' })
  @ApiResponse({ status: 403, description: 'ACCOUNT_LOCKED' })
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto,
  ) {
    const session = await this.authService.login(dto);
    setRefreshCookie(res, session.refreshToken);
    return { accessToken: session.accessToken, user: session.user };
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Xoay vòng refresh token (đọc từ cookie httpOnly), phát hiện reuse sẽ thu hồi toàn bộ session',
  })
  @ApiResponse({
    status: 200,
    description: 'Cấp access token mới + refresh token mới trong cookie',
  })
  @ApiResponse({
    status: 401,
    description: 'REFRESH_INVALID hoặc TOKEN_REUSED (thu hồi cả session)',
  })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = await this.authService.refresh(readRefreshCookie(req));
    setRefreshCookie(res, session.refreshToken);
    return { accessToken: session.accessToken, user: session.user };
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Đăng xuất — thu hồi refresh token hiện tại và xóa cookie' })
  @ApiResponse({ status: 204, description: 'Đã đăng xuất' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(readRefreshCookie(req));
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Yêu cầu link đặt lại mật khẩu (luôn trả 200 để tránh dò email)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: { email: { type: 'string', format: 'email' } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Luôn thành công — nếu email tồn tại sẽ nhận được link qua email/console',
  })
  async forgotPassword(
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(ForgotPasswordSchema)) dto: ForgotPasswordDto,
  ) {
    const resetToken = await this.authService.forgotPassword(dto);
    // MAILER chưa có (RESEND_API_KEY trống): môi trường dev/test lấy token qua header
    // để mở thẳng link đặt lại mật khẩu mà không cần đọc console.
    if (resetToken && process.env.NODE_ENV !== 'production') {
      res.setHeader('X-Dev-Reset-Token', resetToken);
    }
    return { message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.' };
  }

  @Post('reset-password')
  @HttpCode(204)
  @ApiOperation({ summary: 'Đặt lại mật khẩu bằng token từ email (thu hồi mọi session cũ)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['token', 'newPassword'],
      properties: { token: { type: 'string' }, newPassword: { type: 'string', minLength: 8 } },
    },
  })
  @ApiResponse({ status: 204, description: 'Đổi mật khẩu thành công, mọi session cũ bị thu hồi' })
  @ApiResponse({ status: 400, description: 'RESET_TOKEN_INVALID / RESET_TOKEN_STALE' })
  async resetPassword(@Body(new ZodValidationPipe(ResetPasswordSchema)) dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
  }

  @Post('change-password')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Đổi mật khẩu khi đang đăng nhập — mọi phiên cũ bị đăng xuất' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['currentPassword', 'newPassword'],
      properties: {
        currentPassword: { type: 'string' },
        newPassword: { type: 'string', minLength: 8, maxLength: 72 },
      },
    },
  })
  @ApiResponse({ status: 204, description: 'Đổi mật khẩu thành công, xóa cookie refresh' })
  @ApiResponse({ status: 400, description: 'CURRENT_PASSWORD_WRONG / validation lỗi zod' })
  @ApiResponse({ status: 401, description: 'UNAUTHENTICATED — thiếu/sai Bearer token' })
  async changePassword(
    @CurrentUser() auth: AuthUser,
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidationPipe(ChangePasswordSchema)) dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(auth.id, dto);
    // Session cũ đã bị thu hồi ở DB — xóa luôn cookie refresh phía client.
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  }
}
