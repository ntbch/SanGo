import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PaymentsModule } from '../payments/payments.module';
import { VenueServicesController } from './venue-services.controller';
import { VenueServicesService } from './venue-services.service';

@Module({
  imports: [AuthModule, PaymentsModule],
  controllers: [VenueServicesController],
  providers: [VenueServicesService],
  exports: [VenueServicesService],
})
export class VenueServicesModule {}
