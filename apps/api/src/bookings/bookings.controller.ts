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
  CreateHoldSchema,
  SlotsQuerySchema,
  type CancelBookingDto,
  type CreateHoldDto,
  type SlotsQueryDto,
} from './dto/booking.dto';
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
