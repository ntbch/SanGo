import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VenuesModule } from '../venues/venues.module';
import { CourtsController } from './courts.controller';
import { CourtsService } from './courts.service';

@Module({
  imports: [VenuesModule, AuthModule],
  controllers: [CourtsController],
  providers: [CourtsService],
})
export class CourtsModule {}
