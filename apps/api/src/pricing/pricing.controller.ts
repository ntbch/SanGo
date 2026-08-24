import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import { ReplaceRulesSchema, type ReplaceRulesDto } from './dto/pricing-rule.dto';
import { PricingService } from './pricing.service';

@ApiTags('pricing')
@Controller('courts/:courtId/pricing-rules')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  @ApiOperation({ summary: '[Public] Xem bảng giá ghi đè theo khung giờ x loại ngày của sân con' })
  list(@Param('courtId') courtId: string) {
    return this.pricingService.listRules(courtId);
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[OWNER] Thay toàn bộ bảng giá (REPLACE-ALL); rule cùng ngày không được chồng giờ',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['rules'],
      properties: {
        rules: {
          type: 'array',
          items: {
            type: 'object',
            required: ['dayType', 'startMinute', 'endMinute', 'pricePerSlot'],
            properties: {
              dayType: { type: 'string', enum: ['WEEKDAY', 'WEEKEND'] },
              startMinute: { type: 'integer', example: 1020, description: '1020 = 17:00' },
              endMinute: { type: 'integer', example: 1320 },
              pricePerSlot: { type: 'integer', example: 520000 },
            },
          },
        },
      },
    },
  })
  replace(
    @CurrentUser() user: AuthUser,
    @Param('courtId') courtId: string,
    @Body(new ZodValidationPipe(ReplaceRulesSchema)) dto: ReplaceRulesDto,
  ) {
    return this.pricingService.replaceRules(courtId, user, dto);
  }
}
