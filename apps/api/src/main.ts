import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Deploy sau reverse proxy (Render/nginx): req.ip lấy từ X-Forwarded-For hop cuối
  // để Throttler /ai/chat bucket theo IP client THẬT, không gộp cả proxy thành 1 bucket.
  app.set('trust proxy', 1);

  // Quy ước REST /api/v1 — đặc tả §4
  app.setGlobalPrefix('api/v1');
  // QA-T4-P2-02: web fetch credentials:'include' -> ACAO:* bị browser chặn khi
  // Vite port khác API (dev cross-origin). origin:true reflect request origin,
  // credentials:true cho phép cookie refresh token qua CORS.
  app.enableCors({ origin: true, credentials: true });

  // Swagger là nguồn sự thật của contract API — đặc tả §4 (/api/docs)
  const config = new DocumentBuilder()
    .setTitle('CourtHub API')
    .setDescription('Hệ thống đặt và quản lý sân thể thao trực tuyến — REST /api/v1')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`CourtHub API đang chạy tại http://localhost:${port}/api/v1`, 'Bootstrap');
}

void bootstrap();
