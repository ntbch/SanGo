import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailerService } from './mailer.service';

@Module({
  imports: [
    // Secret/expiry truyền theo từng lần sign/verify (access vs refresh vs reset).
    JwtModule.register({}),
    // Giới hạn tốc độ chung của module; login/register/forgot siết chặt hơn bằng @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, MailerService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
