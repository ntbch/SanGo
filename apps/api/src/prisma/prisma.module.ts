import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Module toàn cục cấp PrismaService cho mọi feature module (auth, users, bookings...). */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
