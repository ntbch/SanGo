import { Controller, Get } from '@nestjs/common';

import { type HealthResponse } from '@sango/shared';

@Controller('health')
export class HealthController {
  /** GET /api/v1/health → { status: 'ok' } */
  @Get()
  getHealth(): HealthResponse {
    return { status: 'ok' };
  }
}
