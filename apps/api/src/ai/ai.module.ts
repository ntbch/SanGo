import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { BookingsModule } from '../bookings/bookings.module';
import { AiController } from './ai.controller';
import { AiChatService } from './ai-chat.service';
import { AgentChatService } from './agent-chat.service';
import { AiToolsService } from './ai-tools.service';
import { createNluProvider } from './nlu-provider.factory';
import { createLlmClient } from './llm/llm-client.factory';
import type { LlmClient } from './llm/llm-client.interface';

@Module({
  imports: [
    BookingsModule, // tái dùng BookingsService.createHold + SlotsService.week
    JwtModule.register({}), // cấp JwtService cho OptionalJwtAuthGuard/JwtAuthGuard
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]), // trần chung module; /ai/chat siết 20/h bằng @Throttle
  ],
  controllers: [AiController],
  providers: [
    AiToolsService,
    AiChatService,
    { provide: 'NluProvider', useFactory: createNluProvider },
    { provide: 'LlmClient', useFactory: createLlmClient },
    {
      // Có LLM key -> agent tool-use; không thì rule-based nguyên trạng (spec §2).
      provide: 'ChatOrchestrator',
      useFactory: (
        llm: LlmClient | undefined,
        tools: AiToolsService,
        ruleBased: AiChatService,
      ) => (llm !== undefined ? new AgentChatService(llm, tools, ruleBased) : ruleBased),
      inject: ['LlmClient', AiToolsService, AiChatService],
    },
  ],
})
export class AiModule {}
