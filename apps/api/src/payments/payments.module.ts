import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BookingsModule } from '../bookings/bookings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [AuthModule, BookingsModule, NotificationsModule], // BookingsService.confirmFromHold + NotifyService
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
