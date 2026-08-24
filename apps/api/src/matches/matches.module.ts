import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

// PrismaModule là @Global nên không cần imports.
@Module({
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}
