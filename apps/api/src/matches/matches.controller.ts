import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import {
  OpenMatchesQuerySchema,
  type OpenMatchesQueryDto,
  type OpenMatchesResponse,
} from './dto/open-match.dto';
import { MatchesService } from './matches.service';

@ApiTags('matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('open')
  @ApiOperation({
    summary:
      '[Public] Ghép trận mở: các đơn CONFIRMED công khai chưa đủ người, lọc loại sân/ngày (§3.11)',
  })
  @ApiQuery({
    name: 'sportType',
    required: false,
    schema: {
      enum: ['FOOTBALL5', 'FOOTBALL7', 'PICKLEBALL', 'BADMINTON', 'TENNIS'],
    },
    description: 'Lọc theo loại sân',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    schema: { type: 'string', format: 'date', example: '2026-09-01' },
    description: 'Lọc theo ngày chơi YYYY-MM-DD',
  })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', minimum: 1, default: 1 } })
  open(
    @Query(new ZodValidationPipe(OpenMatchesQuerySchema)) query: OpenMatchesQueryDto,
  ): Promise<OpenMatchesResponse> {
    return this.matchesService.listOpen(query);
  }
}
