import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    AuthModule, // dùng lại JwtModule đã cấu hình cho JwtAuthGuard
    // Bắt buộc cho endpoint tải avatar: không có nó thì POST /users/me/avatar
    // không bị giới hạn và user đã đăng nhập đẩy dung lượng đĩa tùy ý.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
