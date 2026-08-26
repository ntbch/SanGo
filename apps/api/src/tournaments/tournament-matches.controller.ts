import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import { UpdateMatchScoreSchema, type UpdateMatchScoreDto } from './dto/tournament.dto';
import { TournamentsService } from './tournaments.service';

/** Nhập điểm trận giải đấu — tách controller riêng để không đụng GET /matches/open. */
@ApiTags('tournaments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('matches')
export class TournamentMatchesController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Patch(':id/score')
  @ApiOperation({ summary: '[S3-F7] Nhập tỷ số trận (host/admin), winner tự đẩy sang vòng sau' })
  updateScore(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(UpdateMatchScoreSchema)) dto: UpdateMatchScoreDto,
  ) {
    return this.tournamentsService.updateMatchScore(user, id, dto);
  }
}
