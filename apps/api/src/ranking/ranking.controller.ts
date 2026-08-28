import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RankingService } from './ranking.service';

@ApiTags('ranking')
@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('clubs')
  @ApiOperation({ summary: '[Public] Bảng xếp hạng Câu lạc bộ / Đội thể thao' })
  @ApiQuery({ name: 'sportType', required: false, description: 'Lọc theo môn thể thao' })
  @ApiResponse({ status: 200, description: 'Danh sách xếp hạng CLB' })
  getClubRankings(@Query('sportType') sportType?: string) {
    return this.rankingService.getClubRankings(sportType);
  }

  @Get('athletes')
  @ApiOperation({ summary: '[Public] Bảng xếp hạng Vận động viên / Người chơi uy tín' })
  @ApiQuery({ name: 'sportType', required: false, description: 'Lọc theo môn thể thao' })
  @ApiResponse({ status: 200, description: 'Danh sách xếp hạng VĐV' })
  getAthleteRankings(@Query('sportType') sportType?: string) {
    return this.rankingService.getAthleteRankings(sportType);
  }
}
