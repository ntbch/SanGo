import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

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
  constructor(private readonly jwtService: JwtService) {}

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
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        role: AuthUser['role'];
      }>(token, { secret: process.env.JWT_SECRET });
      req.user = { id: payload.sub, email: payload.email, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException({
        message: 'Access token không hợp lệ hoặc đã hết hạn',
        code: 'UNAUTHENTICATED',
      });
    }
  }
}
