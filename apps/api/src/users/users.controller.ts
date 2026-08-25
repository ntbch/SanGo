import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import { toSafeUser } from '../auth/auth.service';
import { UpdateProfileSchema, type UpdateProfileDto } from './dto/user.dto';
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

  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật hồ sơ cá nhân (fullName/phone/avatarUrl)' })
  @ApiResponse({ status: 200, description: 'Hồ sơ sau khi cập nhật' })
  @ApiResponse({ status: 400, description: 'Validation lỗi zod (SĐT/URL không hợp lệ...)' })
  async updateMe(
    @CurrentUser() auth: AuthUser,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) dto: UpdateProfileDto,
  ) {
    const user = await this.usersService.updateProfile(auth.id, dto);
    return { user: toSafeUser(user) };
  }
}
