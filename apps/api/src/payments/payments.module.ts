import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BookingsModule } from '../bookings/bookings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { VnpayRefundService } from './vnpay-refund.service';

@Module({
  imports: [AuthModule, BookingsModule, NotificationsModule], // BookingsService.confirmFromHold + NotifyService
  controllers: [PaymentsController],
  providers: [PaymentsService, VnpayRefundService], // P3: client refund DR — bookings.service tự new (import ngược sẽ vòng)
  exports: [PaymentsService, VnpayRefundService],
})
export class PaymentsModule {}
