import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'courthub_roles';

/**
 * Khai báo vai trò được phép truy cập endpoint. Dùng cùng RolesGuard:
 *   @Roles(UserRole.OWNER, UserRole.ADMIN)
 * Không gắn @Roles => endpoint chỉ cần đăng nhập (JwtAuthGuard).
 */
export const Roles = (...roles: AuthRole[]) => SetMetadata(ROLES_KEY, roles);

type AuthRole = 'CUSTOMER' | 'OWNER' | 'ADMIN';
