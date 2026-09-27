import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateProfileDto } from './dto/user.dto';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';

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

  async uploadAvatar(id: string, image: Buffer, baseUrl: string): Promise<User> {
    const png = image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpg = image.length >= 3 && image[0] === 255 && image[1] === 216 && image[2] === 255;
    if ((!png && !jpg) || image.length > 5 * 1024 * 1024) {
      throw new BadRequestException('Chỉ nhận ảnh JPG hoặc PNG tối đa 5MB');
    }
    const previous = await this.findById(id);
    const filename = `${randomUUID()}.${png ? 'png' : 'jpg'}`;
    const avatarUrl = `${baseUrl.replace(/\/$/, '')}/users/avatars/${filename}`;
    if (avatarUrl.length > 500) throw new BadRequestException('Địa chỉ máy chủ ảnh không hợp lệ');
    const directory = resolve(process.env.AVATAR_UPLOAD_DIR ?? 'uploads/avatars');
    await mkdir(directory, { recursive: true });
    const path = join(directory, filename);
    await writeFile(path, image, { flag: 'wx' });
    try {
      return await this.prisma.user.update({ where: { id }, data: { avatarUrl } });
    } catch (error) {
      await unlink(path).catch(() => {});
      throw error;
    } finally {
      // Xoá ảnh cũ sau khi đã trỏ sang ảnh mới, nếu không mỗi lần đổi avatar sẽ
      // để lại file rác vô thời hạn trong thư mục upload.
      await this.removeSupersededAvatar(previous.avatarUrl, directory, filename);
    }
  }

  /**
   * Xoá file avatar cũ. Chỉ nhận đúng tên file UUID do service tự sinh và phải
   * nằm trong `directory` — chặn path traversal nếu avatarUrl trong DB bị sửa.
   */
  private async removeSupersededAvatar(
    previousUrl: string | null,
    directory: string,
    newFilename: string,
  ): Promise<void> {
    const match = previousUrl?.match(/([a-f0-9-]{36}\.(?:png|jpg))$/);
    const oldName = match?.[1];
    if (!oldName || oldName === newFilename) return;
    const oldPath = resolve(directory, oldName);
    if (dirname(oldPath) !== directory) return;
    await unlink(oldPath).catch(() => {});
  }
}
