import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { toSafeUser } from '../auth/auth.service';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Thông tin người dùng đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Hồ sơ user (không có passwordHash)' })
  async me(@CurrentUser() auth: AuthUser) {
    const user = await this.usersService.findById(auth.id);
    return { user: toSafeUser(user) };
  }
}
