import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthUser } from '../common/guards/jwt-auth.guard';

/**
 * Guard "optional-JWT" cho endpoint public cần cá nhân hoá (POST /ai/chat,
 * GET /ai/suggested-slots): đọc Bearer nếu hợp lệ thì gắn req.user, còn thiếu/sai
 * token thì VẪN cho qua (user = undefined) — khác JwtAuthGuard bắt buộc đăng nhập.
 */
@Injectable()
export class OptionalJwtAuthGuard {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: import('@nestjs/common').ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme === 'Bearer' && token) {
      try {
        const payload = await this.jwtService.verifyAsync<{
          sub: string;
          email: string;
          role: AuthUser['role'];
        }>(token, { secret: process.env.JWT_SECRET });
        req.user = { id: payload.sub, email: payload.email, role: payload.role };
      } catch {
        // Token sai/hết hạn -> vẫn xem như khách vãng lai (public endpoint).
      }
    }
    return true;
  }
}
