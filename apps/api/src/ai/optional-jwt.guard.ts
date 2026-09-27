import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Guard "optional-JWT" cho endpoint public cần cá nhân hoá (POST /ai/chat,
 * GET /ai/suggested-slots): đọc Bearer nếu hợp lệ thì gắn req.user, còn thiếu/sai
 * token thì VẪN cho qua (user = undefined) — khác JwtAuthGuard bắt buộc đăng nhập.
 */
@Injectable()
export class OptionalJwtAuthGuard {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

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
        // Phải kiểm tra status giống JwtAuthGuard: nếu chỉ tin claim trong token thì
        // tài khoản bị admin khoá vẫn dùng được AI cá nhân hoá tới hết TTL (15 phút).
        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
          select: { id: true, email: true, role: true, status: true },
        });
        if (user && user.status === 'ACTIVE') {
          req.user = { id: user.id, email: user.email, role: user.role };
        }
      } catch {
        // Token sai/hết hạn, hoặc DB lỗi -> vẫn xem như khách vãng lai (public endpoint).
        // Fail-closed về anonymous là an toàn hơn là trả 500 cho endpoint công khai.
      }
    }
    return true;
  }
}
