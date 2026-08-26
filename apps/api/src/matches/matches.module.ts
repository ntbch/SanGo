import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { AuthModule } from '../auth/auth.module';

// PrismaModule là @Global nên không cần imports.
@Module({
  imports: [AuthModule],
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}
