import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuthUser {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'OWNER' | 'ADMIN';
}

/**
 * Guard xác thực bằng Bearer access token (JWT 15 phút, secret JWT_SECRET).
 * Gắn req.user = { id, email, role } để controller/@CurrentUser sử dụng.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException({
        message: 'Thiếu hoặc sai định dạng Authorization: Bearer <token>',
        code: 'UNAUTHENTICATED',
      });
    }
    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync<{ sub: string }>(token, { secret: process.env.JWT_SECRET });
    } catch {
      throw new UnauthorizedException({
        message: 'Access token không hợp lệ hoặc đã hết hạn',
        code: 'UNAUTHENTICATED',
      });
    }
    let user;
    try {
      user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, status: true },
      });
    } catch {
      // Lỗi DB không phải HttpException -> BaseExceptionFilter trả 500, biến sự cố
      // hạ tầng thành "phiên hỏng" mà client không phân biệt được. Trả 503 rõ ràng.
      throw new ServiceUnavailableException({
        message: 'Không xác thực được phiên đăng nhập, vui lòng thử lại',
        code: 'AUTH_UNAVAILABLE',
      });
    }
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        message: 'Tài khoản không còn hoạt động',
        code: 'ACCOUNT_INACTIVE',
      });
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    return true;
  }
}
