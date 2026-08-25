import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletsModule } from '../wallets/wallets.module';
import {
  BookingsController,
  CourtSlotsController,
  OwnerBookingsController,
} from './bookings.controller';
import { BookingsCronService } from './bookings.cron.service';
import { BookingsService } from './bookings.service';
import { SlotsService } from './slots.service';

@Module({
  imports: [AuthModule, NotificationsModule, WalletsModule], // Notify thông báo; Wallets hoàn ví sau commit
  controllers: [CourtSlotsController, BookingsController, OwnerBookingsController],
  providers: [BookingsService, SlotsService, BookingsCronService],
  exports: [BookingsService, SlotsService], // payments gọi confirmFromHold; ai gọi week/createHold
})
export class BookingsModule {}
