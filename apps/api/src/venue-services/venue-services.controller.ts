import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import {
  AddBookingAddOnsSchema,
  BookingIdParamSchema,
  CreateVenueServiceSchema,
  UpdateVenueServiceSchema,
  VenueAndServiceIdParamSchema,
  VenueIdParamSchema,
  type AddBookingAddOnsDto,
  type CreateVenueServiceDto,
  type UpdateVenueServiceDto,
} from './dto/venue-service.dto';
import { VenueServicesService } from './venue-services.service';

@ApiTags('venue-services')
@Controller()
export class VenueServicesController {
  constructor(private readonly venueServicesService: VenueServicesService) {}

  // ----------------- OWNER CATALOG CRUD -----------------

  @Post('owner/venues/:venueId/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[OWNER] Thêm dịch vụ mới vào menu cụm sân' })
  create(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(VenueIdParamSchema)) params: { venueId: string },
    @Body(new ZodValidationPipe(CreateVenueServiceSchema)) dto: CreateVenueServiceDto,
  ) {
    return this.venueServicesService.createService(user, params.venueId, dto);
  }

  @Get('owner/venues/:venueId/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[OWNER] Danh sách toàn bộ dịch vụ của cụm sân (kể cả đã tắt)' })
  listMine(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(VenueIdParamSchema)) params: { venueId: string },
  ) {
    return this.venueServicesService.listVenueServices(params.venueId, false, user);
  }

  @Patch('owner/venues/:venueId/services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[OWNER] Cập nhật thông tin/giá/trạng thái dịch vụ' })
  update(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(VenueAndServiceIdParamSchema))
    params: { venueId: string; id: string },
    @Body(new ZodValidationPipe(UpdateVenueServiceSchema)) dto: UpdateVenueServiceDto,
  ) {
    return this.venueServicesService.updateService(user, params.venueId, params.id, dto);
  }

  @Delete('owner/venues/:venueId/services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[OWNER] Xóa hoặc tắt dịch vụ khỏi menu' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(VenueAndServiceIdParamSchema))
    params: { venueId: string; id: string },
  ) {
    return this.venueServicesService.deleteService(user, params.venueId, params.id);
  }

  // ----------------- PUBLIC SERVICES -----------------

  @Get('venues/:venueId/services')
  @ApiOperation({ summary: 'Danh sách dịch vụ đang mở bán của cụm sân' })
  listPublic(@Param(new ZodValidationPipe(VenueIdParamSchema)) params: { venueId: string }) {
    return this.venueServicesService.listVenueServices(params.venueId, true);
  }

  // ----------------- BOOKING ADD-ONS -----------------

  @Get('bookings/:id/addons')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sách dịch vụ đã đặt và số tiền cần thanh toán của đơn' })
  listAddOns(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(BookingIdParamSchema)) params: { id: string },
  ) {
    return this.venueServicesService.listBookingAddOns(user, params.id);
  }

  @Post('bookings/:id/addons')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chọn mua/thuê dịch vụ đi kèm cho đơn đã CONFIRMED' })
  addAddOns(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(BookingIdParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(AddBookingAddOnsSchema)) dto: AddBookingAddOnsDto,
  ) {
    return this.venueServicesService.addBookingAddOns(user, params.id, dto);
  }

  @Post('bookings/:id/addons/checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo lệnh thanh toán riêng (type ADD_ON) cho các dịch vụ chưa trả' })
  checkoutAddOns(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(BookingIdParamSchema)) params: { id: string },
  ) {
    return this.venueServicesService.createAddonCheckout(user, params.id);
  }
}
