import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { createDefaultMailer } from './mailer/mailer.factory';
import { MAILER_PORT } from './mailer/mailer.port';

// PrismaModule là @Global nên không cần imports.
@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: MAILER_PORT,
      // SMTP_HOST chưa cấu hình -> console (dev/demo); cấu hình rồi -> SMTP stub.
      useFactory: () => createDefaultMailer(),
    },
  ],
  // Export cả service + port cho Bookings/Payments/Matches gọi ở GĐ sau.
  exports: [NotificationsService, MAILER_PORT],
})
export class NotificationsModule {}
