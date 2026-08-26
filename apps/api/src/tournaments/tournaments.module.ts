import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TournamentMatchesController } from './tournament-matches.controller';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

@Module({
  imports: [AuthModule, PrismaModule, NotificationsModule],
  controllers: [TournamentsController, TournamentMatchesController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
