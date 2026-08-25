import { Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateProfileDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user)
      throw new NotFoundException({ message: 'Không tìm thấy người dùng', code: 'USER_NOT_FOUND' });
    return user;
  }

  /** Cập nhật hồ sơ cá nhân (fullName/phone/avatarUrl) — chỉ các trường được gửi mới đổi. */
  async updateProfile(id: string, data: UpdateProfileDto): Promise<User> {
    await this.findById(id); // 404 nếu user không tồn tại
    return this.prisma.user.update({ where: { id }, data });
  }
}
