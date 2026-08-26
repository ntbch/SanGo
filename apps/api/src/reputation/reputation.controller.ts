import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { ReputationService } from './reputation.service';

@ApiTags('reputation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Điểm uy tín + badge của tôi — compute-on-read từ Booking, cache 5 phút (F2)',
  })
  me(@CurrentUser() user: AuthUser) {
    return this.reputationService.getMyReputation(user.id);
  }
}
