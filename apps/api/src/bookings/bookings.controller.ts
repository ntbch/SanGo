import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import {
  CancelBookingSchema,
  CheckInSchema,
  CreateHoldSchema,
  CreateReviewSchema,
  MyBookingsQuerySchema,
  OwnerBookingsQuerySchema,
  SlotsQuerySchema,
  type CancelBookingDto,
  type CheckInDto,
  type CreateHoldDto,
  type CreateReviewDto,
  type MyBookingsQueryDto,
  type OwnerBookingsQueryDto,
  type SlotsQueryDto,
} from './dto/booking.dto';
import { Roles } from '../common/guards/roles.decorator';
import { SlotsService } from './slots.service';
import { z } from 'zod';

/** Chặn sớm param sai định dạng UUID -> 400 thay vì để Prisma ném 500. */
const UuidParamSchema = z.string().uuid('id không hợp lệ');
import { BookingsService } from './bookings.service';

@ApiTags('courts')
@Controller('courts')
export class CourtSlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get(':courtId/slots')
  @ApiOperation({
    summary: '[Public] Lịch trống theo tuần của sân con: AVAILABLE/BOOKED/HELD/MAINTENANCE',
  })
  @ApiQuery({
    schema: {
      type: 'object',
      required: ['from'],
      properties: {
        from: {
          type: 'string',
          format: 'date',
          example: '2026-08-31',
          description: 'Thứ Hai đầu tuần (YYYY-MM-DD)',
        },
        days: { type: 'integer', minimum: 1, maximum: 14, default: 7 },
      },
    },
  } as never)
  week(
    @Param('courtId', new ZodValidationPipe(UuidParamSchema)) courtId: string,
    @Query(new ZodValidationPipe(SlotsQuerySchema)) query: SlotsQueryDto,
  ) {
    return this.slotsService.week(courtId, query.from, query.days);
  }
}

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) // mọi user đăng nhập đều đặt được sân
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Danh sách đơn đặt của khách hàng (có filter upcoming / history / cancelled)',
  })
  listMine(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(MyBookingsQuerySchema)) query: MyBookingsQueryDto,
  ) {
    return this.bookingsService.listMine(user, query);
  }

  @Post('check-in')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: '[OWNER/ADMIN] Check-in bằng mã đơn CH-YYYYMMDD-NNNN (§6.3)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['code'],
      properties: {
        code: { type: 'string', example: 'CH-20260824-0001' },
      },
    },
  })
  checkIn(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CheckInSchema)) dto: CheckInDto,
  ) {
    return this.bookingsService.checkIn(dto.code, user);
  }

  @Post(':id/no-show')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: '[OWNER/ADMIN] Đánh dấu khách không đến (NO_SHOW)' })
  markNoShow(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(UuidParamSchema)) id: string,
  ) {
    return this.bookingsService.markNoShow(id, user);
  }

  @Post('holds')
  @ApiOperation({ summary: 'Giữ chỗ 10 phút — khoá FOR UPDATE chống double-booking (spec §6.1)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['courtId', 'date', 'slots'],
      properties: {
        courtId: { type: 'string', format: 'uuid' },
        date: { type: 'string', format: 'date', example: '2026-09-01' },
        slots: {
          type: 'array',
          items: {
            type: 'integer',
            description: 'Phút bắt đầu mỗi slot, phải liền kề',
            example: [1020],
          },
          maxItems: 8,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Tạo hold thành công kèm subtotal + expiresAt' })
  @ApiResponse({ status: 409, description: 'SLOT_TAKEN | HOLD_LIMIT | COURT_MAINTENANCE' })
  createHold(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateHoldSchema)) dto: CreateHoldDto,
  ) {
    return this.bookingsService.createHold(user, dto);
  }

  @Get('holds/:id')
  @ApiOperation({ summary: 'Xem lượt giữ chỗ của mình' })
  getHold(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(UuidParamSchema)) id: string,
  ) {
    return this.bookingsService.getHold(id, user);
  }

  @Delete('holds/:id')
  @ApiOperation({ summary: 'Hủy sớm lượt giữ -> nhả slot ngay' })
  releaseHold(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(UuidParamSchema)) id: string,
  ) {
    return this.bookingsService.releaseHold(id, user);
  }

  @Get(':id/refund-preview')
  @ApiOperation({ summary: 'Xem mức hoàn dự kiến trước khi hủy (>24h:100%, 12–24h:50%, <12h:0%)' })
  refundPreview(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(UuidParamSchema)) id: string,
  ) {
    return this.bookingsService.refundPreview(id, user);
  }

  @Post(':id/review')
  @ApiOperation({
    summary: 'Khách đánh giá đơn đã COMPLETED — 1 đơn duy nhất 1 review (§3.8)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['rating', 'comment'],
      properties: {
        rating: { type: 'integer', minimum: 1, maximum: 5 },
        comment: { type: 'string', minLength: 4, maxLength: 500 },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'REVIEW_NOT_ALLOWED | REVIEW_EXISTS' })
  review(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(UuidParamSchema)) id: string,
    @Body(new ZodValidationPipe(CreateReviewSchema)) dto: CreateReviewDto,
  ) {
    return this.bookingsService.createReview(id, user, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Hủy đơn của mình (owner/admin hủy hộ) — tạo Payment(REFUND) nếu được hoàn',
  })
  async cancelBooking(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(UuidParamSchema)) id: string,
    @Body(new ZodValidationPipe(CancelBookingSchema)) dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(id, user, dto.reason);
  }
}

@ApiTags('owner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN')
@Controller('owner')
export class OwnerBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('bookings')
  @ApiOperation({
    summary: '[OWNER] Xem danh sách đơn đặt theo cụm sân (lọc theo ngày, trạng thái)',
  })
  listBookings(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(OwnerBookingsQuerySchema)) query: OwnerBookingsQueryDto,
  ) {
    return this.bookingsService.listOwnerBookings(user, query);
  }
}
