import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import {
  CreateTournamentSchema,
  RegisterTeamSchema,
  type CreateTournamentDto,
  type RegisterTeamDto,
} from './dto/tournament.dto';
import { TournamentsService } from './tournaments.service';

@ApiTags('tournaments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: '[S3-F7] Tạo giải đấu loại trực tiếp (OWNER/ADMIN)' })
  @ApiResponse({ status: 201, description: 'Giải vừa tạo, trạng thái REGISTRATION' })
  createTournament(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateTournamentSchema)) dto: CreateTournamentDto,
  ) {
    return this.tournamentsService.createTournament(user, dto);
  }

  @Get()
  @ApiOperation({ summary: '[S3-F7] Danh sách giải đấu' })
  listTournaments() {
    return this.tournamentsService.listTournaments();
  }

  @Get(':id')
  @ApiOperation({ summary: '[S3-F7] Chi tiết giải + bracket đầy đủ theo round/position' })
  getTournament(@Param('id') id: string) {
    return this.tournamentsService.getTournament(id);
  }

  @Post(':id/register')
  @ApiOperation({ summary: '[S3-F7] Đăng ký đội vào giải (chỉ CAPTAIN của đội)' })
  registerTeam(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(RegisterTeamSchema)) dto: RegisterTeamDto,
  ) {
    return this.tournamentsService.registerTeam(user, id, dto);
  }

  @Post(':id/start')
  @ApiOperation({ summary: '[S3-F7] Khóa đăng ký + tự sinh bracket single-elimination' })
  startTournament(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tournamentsService.startTournament(user, id);
  }
}
