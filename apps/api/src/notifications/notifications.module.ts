import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module'; // JwtService cho JwtAuthGuard của controller
import { RealtimeModule } from '../realtime/realtime.module'; // RealtimeService emit notification:new
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotifyService } from './notify.service';
import { createDefaultMailer } from './mailer/mailer.factory';
import { MAILER_PORT } from './mailer/mailer.port';

// PrismaModule là @Global nên không cần imports.
@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotifyService,
    {
      provide: MAILER_PORT,
      // SMTP_HOST chưa cấu hình -> console (dev/demo); cấu hình rồi -> SMTP stub.
      useFactory: () => createDefaultMailer(),
    },
  ],
  // Export cho Bookings/Payments/Matches phát thông báo + mail giao dịch.
  exports: [NotificationsService, NotifyService, MAILER_PORT],
})
export class NotificationsModule {}
