import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Quy ước REST /api/v1 — đặc tả §4
  app.setGlobalPrefix('api/v1');
  app.enableCors();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`CourtHub API đang chạy tại http://localhost:${port}/api/v1`, 'Bootstrap');
}

void bootstrap();
