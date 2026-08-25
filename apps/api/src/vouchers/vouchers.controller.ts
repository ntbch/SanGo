import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import {
  ApplyVoucherSchema,
  CreateVoucherSchema,
  UpdateVoucherSchema,
  VoucherIdParamSchema,
  type ApplyVoucherDto,
  type CreateVoucherDto,
  type UpdateVoucherDto,
} from './dto/voucher.dto';
import { VouchersService } from './vouchers.service';

/**
 * F3 Voucher — route đầy đủ (không prefix controller) để tách namespace:
 *  - /owner/vouchers      : owner quản lý mã của mình
 *  - /holds/:id/voucher   : khách áp mã vào hold của mình
 */
@ApiTags('vouchers')
@Controller()
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post('owner/vouchers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[OWNER] Tạo voucher giảm giá theo % kèm cửa sổ giờ thấp điểm' })
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateVoucherSchema)) dto: CreateVoucherDto,
  ) {
    return this.vouchersService.createVoucher(user, dto);
  }

  @Get('owner/vouchers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[OWNER] Danh sách voucher của mình kèm số lượt đã dùng' })
  mine(@CurrentUser() user: AuthUser) {
    return this.vouchersService.listOwnVouchers(user.id);
  }

  @Patch('owner/vouchers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[OWNER] Cập nhật một phần voucher (percentOff/cửa sổ/limit/status...)',
  })
  async update(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(VoucherIdParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(UpdateVoucherSchema)) dto: UpdateVoucherDto,
  ): Promise<void> {
    await this.vouchersService.updateVoucher(user.id, params.id, dto);
  }

  @Delete('owner/vouchers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[OWNER] Xoá voucher' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(VoucherIdParamSchema)) params: { id: string },
  ): Promise<void> {
    await this.vouchersService.deleteVoucher(user.id, params.id);
  }

  @Post('holds/:id/voucher')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Áp mã vào hold của mình — snapshot discountAmount/finalAmount vào hold NGAY LÚC ÁP MÃ; quota tiêu khi thanh toán thành công',
  })
  apply(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(VoucherIdParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(ApplyVoucherSchema)) dto: ApplyVoucherDto,
  ) {
    return this.vouchersService.applyToHold(user, { holdId: params.id, code: dto.code });
  }
}
