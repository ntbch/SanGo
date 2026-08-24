import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VenuesModule } from '../venues/venues.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  // AuthModule cấp JwtService cho JwtAuthGuard của controller;
  // VenuesModule tái dùng VenuesService.canManageVenue cho ownership check.
  imports: [AuthModule, VenuesModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
