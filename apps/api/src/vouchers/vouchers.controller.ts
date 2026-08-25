import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
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
  SetVoucherStatusSchema,
  type ApplyVoucherDto,
  type CreateVoucherDto,
  type SetVoucherStatusDto,
} from './dto/voucher.dto';
import { VouchersService } from './vouchers.service';

@ApiTags('vouchers')
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[OWNER] Tạo voucher giảm giá theo % cho venue của mình' })
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateVoucherSchema)) dto: CreateVoucherDto,
  ) {
    return this.vouchersService.createVoucher(user, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[OWNER] Danh sách voucher của mình kèm số lượt đã dùng' })
  mine(@CurrentUser() user: AuthUser) {
    return this.vouchersService.listOwnVouchers(user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[OWNER] Bật/tắt voucher' })
  setStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SetVoucherStatusSchema)) dto: SetVoucherStatusDto,
  ) {
    return this.vouchersService.setStatus(user.id, id, dto);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Áp mã vào hold của mình — snapshot discountAmount/finalAmount vào hold ngay lúc áp mã (F3)',
  })
  apply(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(ApplyVoucherSchema)) dto: ApplyVoucherDto,
  ) {
    return this.vouchersService.applyToHold(user, dto);
  }
}
