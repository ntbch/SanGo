import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import { LeaderboardQuerySchema, type LeaderboardQueryDto } from './dto/reputation.dto';
import { ReputationService } from './reputation.service';

@ApiTags('reputation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Điểm uy tín + badge của tôi — compute-on-read từ Booking (F2)',
    description:
      'Luật điểm: check-in đúng giờ +10 · huỷ sát giờ (<12h trước giờ chơi, khớp tier hoàn tiền §6.2) -5 · no-show (COMPLETED không checkedInAt) -20; dữ liệu cũ trung tính. ' +
      'Cache TTL thuần 5 phút, KHÔNG invalidate chủ động khi ghi sự kiện — số liệu có thể trễ tối đa 5 phút.',
  })
  me(@CurrentUser() user: AuthUser) {
    return this.reputationService.getMyReputation(user.id);
  }

  @Get('leaderboard')
  @ApiOperation({
    summary: 'Bảng xếp hạng uy tín theo điểm giảm dần (F2)',
    description:
      'Chỉ tính người chơi có ít nhất một đơn ở trạng thái chấm điểm. ' +
      'Số liệu compute-on-read có thể trễ tối đa 5 phút do cache TTL thuần.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
  })
  leaderboard(@Query(new ZodValidationPipe(LeaderboardQuerySchema)) query: LeaderboardQueryDto) {
    return this.reputationService.getLeaderboard(query.limit);
  }
}
