import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule], // dùng lại JwtModule đã cấu hình cho JwtAuthGuard
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
