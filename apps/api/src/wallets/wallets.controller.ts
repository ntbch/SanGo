import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import {
  TopupSchema,
  WalletMeQuerySchema,
  type TopupDto,
  type WalletMeQueryDto,
} from './dto/wallet.dto';
import { WalletsService } from './wallets.service';

@ApiTags('wallet')
@Controller('wallet')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post('topup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Tạo yêu cầu nạp tiền vào ví — trả txnRef + paymentUrl mock gateway (KHÔNG tạo Payment)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['amount'],
      properties: {
        amount: {
          type: 'integer',
          minimum: 10000,
          maximum: 50000000,
          description: 'Số tiền nạp (đồng)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '{txnRef, amount, mode, paymentUrl}' })
  topup(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(TopupSchema)) dto: TopupDto) {
    return this.walletsService.createTopup(user, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ví của tôi — số dư + lịch sử biến động phân trang (đọc ledger)' })
  @ApiResponse({ status: 200, description: '{balance, page, pageSize, total, items[]}' })
  me(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(WalletMeQuerySchema)) q: WalletMeQueryDto,
  ) {
    return this.walletsService.getMyWallet(user, q);
  }

  @Get('mock/callback')
  @ApiOperation({
    summary:
      '[PAYMENT_MODE=mock] Callback giả lập nạp ví — tắt (403) khi PAYMENT_MODE≠mock, bắt buộc khớp amount',
  })
  mockCallback(@Query() query: { txnRef?: string; amount?: string }) {
    return this.walletsService.handleMockCallback(query);
  }
}
