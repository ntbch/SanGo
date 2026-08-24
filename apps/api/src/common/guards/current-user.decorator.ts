import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { AuthUser } from './jwt-auth.guard';

/** Lấy user đã xác thực từ request (đi kèm JwtAuthGuard). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest().user as AuthUser;
  },
);
