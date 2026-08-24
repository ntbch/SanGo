import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import {
  CreateCourtSchema,
  UpdateCourtSchema,
  type CreateCourtDto,
  type UpdateCourtDto,
} from './dto/court.dto';
import { CourtsService } from './courts.service';

@ApiTags('courts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN')
@ApiBearerAuth()
@Controller()
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  @Get('venues/:venueId/courts')
  @ApiOperation({
    summary: '[OWNER] Liệt kê toàn bộ sân con của cụm sân (kèm trạng thái MAINTENANCE)',
  })
  listByVenue(@CurrentUser() user: AuthUser, @Param('venueId') venueId: string) {
    return this.courtsService.listByVenue(venueId, user);
  }

  @Post('venues/:venueId/courts')
  @ApiOperation({ summary: '[OWNER] Thêm sân con vào cụm sân của mình' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('venueId') venueId: string,
    @Body(new ZodValidationPipe(CreateCourtSchema)) dto: CreateCourtDto,
  ) {
    return this.courtsService.create(user, venueId, dto);
  }

  @Put('courts/:id')
  @ApiOperation({ summary: '[OWNER] Cập nhật sân con (chỉ venue của mình)' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') courtId: string,
    @Body(new ZodValidationPipe(UpdateCourtSchema)) dto: UpdateCourtDto,
  ) {
    return this.courtsService.update(courtId, user, dto);
  }

  @Delete('courts/:id')
  @ApiOperation({ summary: '[OWNER] Xóa sân con — 409 COURT_IN_USE nếu đã có đơn đặt' })
  remove(@CurrentUser() user: AuthUser, @Param('id') courtId: string) {
    return this.courtsService.remove(courtId, user);
  }
}
