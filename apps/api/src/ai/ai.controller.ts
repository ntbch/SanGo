import { Body, Controller, Get, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../auth/zod-validation.pipe';
import { AiChatSchema, CreateHoldSchema, SuggestedSlotsQuerySchema } from './dto/ai.dto';
import type { AiChatDto, CreateHoldDto } from './dto/ai.dto';
import { AiChatService } from './ai-chat.service';
import { AiToolsService } from './ai-tools.service';
import { OptionalJwtAuthGuard } from './optional-jwt.guard';

@ApiTags('ai')
@Controller('ai')
@UseGuards(ThrottlerGuard)
export class AiController {
  constructor(
    private readonly chatService: AiChatService,
    private readonly tools: AiToolsService,
  ) {}

  @Post('chat')
  @HttpCode(200)
  @UseGuards(OptionalJwtAuthGuard)
  // §3.12: giới hạn 20 tin nhắn/giờ/người (không đăng nhập thì tính theo IP).
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  @ApiOperation({
    summary:
      '[Public] Trợ lý đặt sân tiếng Việt — parse ý định + tool-call DB thật; Bearer tuỳ chọn để cá nhân hoá',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['message'],
      properties: { message: { type: 'string', maxLength: 500 } },
    },
  })
  chat(
    @CurrentUser() user: AuthUser | undefined,
    @Body(new ZodValidationPipe(AiChatSchema)) dto: AiChatDto,
  ) {
    return this.chatService.chat(dto.message, user ? { id: user.id } : undefined);
  }

  @Get('suggested-slots')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary:
      '[Public] Gợi ý khung giờ AI-2 (§3.13): histogram lịch sử COMPLETED của user, cold-start dùng giờ vàng',
  })
  @ApiQuery({ name: 'courtId', required: true, schema: { type: 'string', format: 'uuid' } })
  @ApiQuery({
    name: 'date',
    required: false,
    schema: { type: 'string', format: 'date' },
    description: 'Mặc định hôm nay (YYYY-MM-DD)',
  })
  suggestedSlots(
    @CurrentUser() user: AuthUser | undefined,
    @Query(new ZodValidationPipe(SuggestedSlotsQuerySchema))
    query: { courtId: string; date?: string },
  ) {
    return this.tools.getSuggestedSlots(query.courtId, {
      date: query.date,
      userId: user?.id,
    });
  }

  @Post('hold')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard) // GUARDRAIL §3.12: giữ chỗ bắt buộc đã đăng nhập
  @ApiOperation({
    summary: '[Bearer] Giữ chỗ 10 phút từ chat — tái dùng transaction chống double-booking',
  })
  hold(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateHoldSchema)) dto: CreateHoldDto,
  ) {
    return this.tools.createHold(user, dto);
  }
}
