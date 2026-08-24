import { Module } from '@nestjs/common';

import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { CourtsModule } from './courts/courts.module';
import { HealthModule } from './health/health.module';
import { PricingModule } from './pricing/pricing.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { VenuesModule } from './venues/venues.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    VenuesModule,
    BookingsModule,
    CourtsModule,
    PricingModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
