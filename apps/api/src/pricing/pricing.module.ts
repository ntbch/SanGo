import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VenuesModule } from '../venues/venues.module';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';

@Module({
  imports: [VenuesModule, AuthModule],
  controllers: [PricingController],
  providers: [PricingService],
})
export class PricingModule {}
