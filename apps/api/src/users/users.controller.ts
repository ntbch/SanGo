import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Res, ServiceUnavailableException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import { toSafeUser } from '../auth/auth.service';
import { UpdateProfileSchema, type UpdateProfileDto } from './dto/user.dto';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { resolve } from 'node:path';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Thông tin người dùng đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Hồ sơ user (không có passwordHash)' })
  async me(@CurrentUser() auth: AuthUser) {
    const user = await this.usersService.findById(auth.id);
    return { user: toSafeUser(user) };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
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

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  async uploadAvatar(
    @CurrentUser() auth: AuthUser,
    @UploadedFile() file: { buffer: Buffer } | undefined,
  ) {
    if (!file) throw new BadRequestException('Vui lòng chọn ảnh JPG hoặc PNG');
    // KHÔNG dựng baseUrl từ Host header: attacker gửi Host của họ sẽ khiến avatarUrl
    // lưu trong DB trỏ về host đó và mọi người xem hồ sơ đều gọi về máy attacker.
    const baseUrl = process.env.PUBLIC_API_URL;
    if (!baseUrl) {
      throw new ServiceUnavailableException(
        'Chưa cấu hình PUBLIC_API_URL nên chưa thể tải ảnh đại diện. Liên hệ quản trị viên.',
      );
    }
    return { user: toSafeUser(await this.usersService.uploadAvatar(auth.id, file.buffer, baseUrl)) };
  }

  @Get('avatars/:filename')
  avatar(@Param('filename') filename: string, @Res() res: Response) {
    if (!/^[a-f0-9-]{36}\.(png|jpg)$/.test(filename)) throw new BadRequestException('Ảnh không hợp lệ');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Không có callback thì lỗi 404 của sendFile không phải HttpException ->
    // BaseExceptionFilter trả 500, biến cache-miss thường thành lỗi máy chủ.
    res.sendFile(filename, { root: resolve(process.env.AVATAR_UPLOAD_DIR ?? 'uploads/avatars') }, (err) => {
      if (!err) return;
      // sendFile báo lỗi qua http-errors (có .status), không phải HttpException.
      const status = 'status' in err && typeof err.status === 'number' ? err.status : 404;
      res.status(status).end();
    });
  }
}
