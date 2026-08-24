import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import {
  AdminVenueListQuerySchema,
  RejectVenueSchema,
  type AdminVenueListQueryDto,
  type RejectVenueDto,
} from './dto/admin.dto';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('venues')
  @ApiOperation({
    summary: '[ADMIN] Hàng chờ/quản lý duyệt sân: lọc status + tìm tên + phân trang',
  })
  @ApiQuery({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
        q: { type: 'string' },
        page: { type: 'integer', default: 1 },
        limit: { type: 'integer', default: 20 },
      },
    },
  } as never)
  listVenues(
    @Query(new ZodValidationPipe(AdminVenueListQuerySchema)) query: AdminVenueListQueryDto,
  ) {
    return this.adminService.listVenues(query);
  }

  @Get('venues/:id')
  @ApiOperation({
    summary: '[ADMIN] Chi tiết đầy đủ một sân (kèm owner + courts) để xem xét duyệt',
  })
  getVenue(@Param('id') id: string) {
    return this.adminService.getVenue(id);
  }

  @Post('venues/:id/approve')
  @ApiOperation({ summary: '[ADMIN] Duyệt sân -> APPROVED và xuất hiện trên danh sách public' })
  approve(@Param('id') id: string) {
    return this.adminService.approve(id);
  }

  @Post('venues/:id/reject')
  @ApiOperation({ summary: '[ADMIN] Từ chối/take-down -> REJECTED kèm lý do hiển thị cho owner' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['reason'],
      properties: { reason: { type: 'string', minLength: 4 } },
    },
  })
  @ApiResponse({ status: 200, description: 'Đã từ chối kèm rejectReason' })
  reject(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RejectVenueSchema)) dto: RejectVenueDto,
  ) {
    return this.adminService.reject(id, dto.reason);
  }
}
