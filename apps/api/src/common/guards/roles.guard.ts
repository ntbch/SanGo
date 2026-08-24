import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import type { AuthUser } from './jwt-auth.guard';

/**
 * Phân quyền theo @Roles(). Dùng SAU JwtAuthGuard trong @UseGuards(JwtAuthGuard, RolesGuard).
 * Route không khai báo @Roles => mặc định cho qua (chỉ cần đăng nhập).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AuthUser['role'][]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException({
        message: 'Vai trò của bạn không có quyền truy cập tài nguyên này',
        code: 'FORBIDDEN_ROLE',
      });
    }
    return true;
  }
}
