import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module'; // JwtService cho JwtAuthGuard
import { PrismaModule } from '../prisma/prisma.module';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService], // bookings gọi credit() hoàn ví SAU commit
})
export class WalletsModule {}
