import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module'; // JwtService cho JwtAuthGuard của controller
import { ReputationController } from './reputation.controller';
import { ReputationService } from './reputation.service';

@Module({
  imports: [AuthModule],
  controllers: [ReputationController],
  providers: [ReputationService],
  exports: [ReputationService],
})
export class ReputationModule {}
