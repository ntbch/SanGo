import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import { CheckoutSchema, type CheckoutDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Tạo lệnh thanh toán cho hold của mình — trả txnRef + paymentUrl (PAYMENT_MODE=mock hoặc VNPay sandbox)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['holdId', 'type'],
      properties: {
        holdId: { type: 'string', format: 'uuid' },
        type: {
          type: 'string',
          enum: ['DEPOSIT', 'FULL'],
          description: 'DEPOSIT = cọc theo % venue; FULL = trả đủ',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '{txnRef, amount, type, mode, paymentUrl}' })
  @ApiResponse({ status: 409, description: 'HOLD_EXPIRED | HOLD_ALREADY_CONVERTED' })
  checkout(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CheckoutSchema)) dto: CheckoutDto,
  ) {
    return this.paymentsService.createCheckout(user, dto);
  }

  // Browser đi qua đây trực tiếp (returnUrl của VNPay) -> phải là HTTP 302 về FE
  // /payment/result chứ không trả JSON; handler vẫn throw HttpException bình thường.
  @Redirect('/payment/result', 302)
  @Get('vnpay/callback')
  @ApiOperation({
    summary: '[Cổng VNPay gọi] Verify HMAC-SHA512 + amount + idempotency rồi confirm đơn',
  })
  async vnpayCallback(@Query() query: Record<string, string>) {
    const res = await this.paymentsService.handleVnpayCallback(query);
    return { url: 'redirectUrl' in res ? res.redirectUrl : '/payment/result' };
  }

  @Redirect('/payment/result', 302)
  @Get('mock/callback')
  @ApiOperation({
    summary:
      '[PAYMENT_MODE=mock] Callback giả lập (Browser Redirect) — tắt hẳn (403) khi PAYMENT_MODE≠mock, luôn bắt buộc khớp amount',
  })
  async mockCallback(@Query() query: { txnRef?: string; amount?: string }) {
    const res = await this.paymentsService.handleMockCallback(query);
    return { url: 'redirectUrl' in res ? res.redirectUrl : '/payment/result' };
  }

  @Post('mock/confirm')
  @ApiOperation({
    summary:
      '[PAYMENT_MODE=mock] Xác nhận thanh toán mock đồng bộ (trả JSON) cho Frontend nút Xác nhận',
  })
  async mockConfirm(@Body() body: { txnRef: string; amount?: number }) {
    const res = await this.paymentsService.processMockCallback({
      txnRef: body.txnRef,
      amount: body.amount !== undefined ? String(body.amount) : undefined,
    });
    return res;
  }
}
