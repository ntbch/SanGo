import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import {
  OwnerAnalyticsQuerySchema,
  type OwnerAnalyticsQueryDto,
  type OwnerAnalyticsResponse,
} from './dto/analytics.dto';
import { AnalyticsService } from './analytics.service';

@ApiTags('owner')
@Controller('owner')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[OWNER] Thống kê cụm sân: doanh thu xác nhận, lượt đặt, tỷ lệ hủy/no-show, chuỗi theo ngày, xếp hạng sân con (§3.10)',
  })
  @ApiQuery({
    name: 'venueId',
    required: true,
    schema: { type: 'string', format: 'uuid' },
    description: 'UUID cụm sân — phải là sân của chủ đang đăng nhập',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    schema: { type: 'integer', minimum: 1, maximum: 90, default: 30 },
    description: 'Số ngày thống kê tính đến hôm nay (mặc định 30, tối đa 90)',
  })
  @ApiResponse({
    status: 200,
    description:
      'meta + summary + series[] (đủ days điểm, zero-fill) + topCourts[] (giảm dần theo bookings)',
  })
  @ApiResponse({ status: 401, description: 'UNAUTHENTICATED — thiếu/sai Bearer token' })
  @ApiResponse({ status: 403, description: 'VENUE_FORBIDDEN — không phải chủ sân' })
  @ApiResponse({ status: 404, description: 'VENUE_NOT_FOUND' })
  ownerAnalytics(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(OwnerAnalyticsQuerySchema)) query: OwnerAnalyticsQueryDto,
  ): Promise<OwnerAnalyticsResponse> {
    return this.analyticsService.getOwnerAnalytics(user, query.venueId, query.days);
  }
}
