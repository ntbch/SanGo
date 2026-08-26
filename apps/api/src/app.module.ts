import { Module } from '@nestjs/common';

import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { CourtsModule } from './courts/courts.module';
import { HealthModule } from './health/health.module';
import { MatchesModule } from './matches/matches.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PricingModule } from './pricing/pricing.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReputationModule } from './reputation/reputation.module';
import { TeamsModule } from './teams/teams.module';
import { UsersModule } from './users/users.module';
import { VenuesModule } from './venues/venues.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { VenueServicesModule } from './venue-services/venue-services.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { WalletsModule } from './wallets/wallets.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    VenuesModule,
    BookingsModule,
    PaymentsModule,
    CourtsModule,
    PricingModule,
    AdminModule,
    AnalyticsModule,
    AiModule,
    HealthModule,
    MatchesModule,
    NotificationsModule,
    WalletsModule,
    VouchersModule,
    VenueServicesModule,
    ReputationModule,
    TeamsModule,
    TournamentsModule,
  ],
})
export class AppModule {}
