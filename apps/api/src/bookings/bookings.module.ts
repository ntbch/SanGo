import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  BookingsController,
  CourtSlotsController,
  OwnerBookingsController,
} from './bookings.controller';
import { BookingsCronService } from './bookings.cron.service';
import { BookingsService } from './bookings.service';
import { SlotsService } from './slots.service';

@Module({
  imports: [AuthModule],
  controllers: [CourtSlotsController, BookingsController, OwnerBookingsController],
  providers: [BookingsService, SlotsService, BookingsCronService],
  exports: [BookingsService], // payments (t7) gọi confirmFromHold trong callback
})
export class BookingsModule {}
