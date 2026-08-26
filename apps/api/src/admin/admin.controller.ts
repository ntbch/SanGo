import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard, type AuthUser } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import {
  AdminBookingsQuerySchema,
  AdminStatsQuerySchema,
  AdminUserListQuerySchema,
  AdminVenueListQuerySchema,
  RejectVenueSchema,
  UpdateUserStatusSchema,
  UpdateVenueStatusSchema,
  type AdminBookingsQueryDto,
  type AdminStatsQueryDto,
  type AdminUserListQueryDto,
  type AdminVenueListQueryDto,
  type RejectVenueDto,
  type UpdateUserStatusDto,
  type UpdateVenueStatusDto,
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
        status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] },
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

  @Get('stats')
  @ApiOperation({
    summary:
      '[ADMIN] Thống kê nền tảng: totals + chuỗi ngày zero-fill + top sân + hoạt động mới nhất',
  })
  @ApiQuery({
    schema: {
      type: 'object',
      properties: { days: { type: 'integer', minimum: 1, maximum: 90, default: 14 } },
    },
  } as never)
  @ApiResponse({ status: 200, description: 'Tổng quan nền tảng cho dashboard admin' })
  stats(@Query(new ZodValidationPipe(AdminStatsQuerySchema)) query: AdminStatsQueryDto) {
    return this.adminService.getStats(query.days);
  }

  @Get('users')
  @ApiOperation({
    summary:
      '[ADMIN] Danh sách người dùng: tìm kiếm fullName/email + lọc role/status + phân trang',
  })
  @ApiQuery({
    schema: {
      type: 'object',
      properties: {
        search: { type: 'string' },
        role: { type: 'string', enum: ['CUSTOMER', 'OWNER', 'ADMIN'] },
        status: { type: 'string', enum: ['ACTIVE', 'LOCKED'] },
        page: { type: 'integer', default: 1 },
        pageSize: { type: 'integer', default: 20, maximum: 100 },
      },
    },
  } as never)
  @ApiResponse({ status: 200, description: 'Danh sách user kèm bookingCount + total' })
  listUsers(
    @Query(new ZodValidationPipe(AdminUserListQuerySchema)) query: AdminUserListQueryDto,
  ) {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id/status')
  @ApiOperation({
    summary:
      '[ADMIN] Khoá/mở khoá tài khoản. Cấm tự khoá mình và khoá ADMIN khác (mở khoá thì luôn cho phép)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: { status: { type: 'string', enum: ['ACTIVE', 'LOCKED'] } },
    },
  })
  @ApiResponse({ status: 200, description: 'User sau cập nhật (không có passwordHash)' })
  @ApiResponse({ status: 400, description: 'CANNOT_LOCK_SELF / CANNOT_LOCK_ADMIN / validation' })
  @ApiResponse({ status: 404, description: 'USER_NOT_FOUND' })
  updateUserStatus(
    @Param('id') id: string,
    @CurrentUser() auth: AuthUser,
    @Body(new ZodValidationPipe(UpdateUserStatusSchema)) dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(auth.id, id, dto);
  }

  @Patch('venues/:id/status')
  @ApiOperation({
    summary:
      '[ADMIN] Treo/kích hoạt cụm sân: chỉ chuyển APPROVED <-> SUSPENDED; PENDING/REJECTED dùng approve/reject',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: { status: { type: 'string', enum: ['APPROVED', 'SUSPENDED'] } },
    },
  })
  @ApiResponse({ status: 200, description: 'Venue sau khi cập nhật trạng thái' })
  @ApiResponse({ status: 400, description: 'INVALID_STATUS_TRANSITION / validation' })
  @ApiResponse({ status: 404, description: 'VENUE_NOT_FOUND' })
  updateVenueStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateVenueStatusSchema)) dto: UpdateVenueStatusDto,
  ) {
    return this.adminService.updateVenueStatus(id, dto);
  }

  @Get('bookings')
  @ApiOperation({
    summary:
      '[ADMIN] Tra cứu đơn toàn hệ thống: lọc date/status/venueId + tìm mã đơn/tên khách + phân trang',
  })
  @ApiQuery({
    schema: {
      type: 'object',
      properties: {
        date: { type: 'string', format: 'date', description: 'Ngày chơi YYYY-MM-DD' },
        status: {
          type: 'string',
          enum: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
        },
        venueId: { type: 'string', format: 'uuid' },
        search: { type: 'string', description: 'Mã đơn hoặc tên khách (contains)' },
        page: { type: 'integer', default: 1 },
        pageSize: { type: 'integer', default: 20, maximum: 100 },
      },
    },
  } as never)
  @ApiResponse({ status: 200, description: 'items[] kèm venue/court/customer + total' })
  listBookings(
    @Query(new ZodValidationPipe(AdminBookingsQuerySchema)) query: AdminBookingsQueryDto,
  ) {
    return this.adminService.listBookings(query);
  }
}
