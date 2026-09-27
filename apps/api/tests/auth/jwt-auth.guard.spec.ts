import type { ExecutionContext } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import type { PrismaService } from '../../src/prisma/prisma.service';

describe('JwtAuthGuard account state', () => {
  it('rejects a locked account even when its access token verifies', async () => {
    const jwt = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'u1' }) };
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue({ id: 'u1', status: 'LOCKED' }) } };
    const guard = new JwtAuthGuard(jwt as unknown as JwtService, prisma as unknown as PrismaService);
    const request = { headers: { authorization: 'Bearer existing-session' } };
    const context = { switchToHttp: () => ({ getRequest: () => request }) };
    await expect(guard.canActivate(context as ExecutionContext)).rejects.toMatchObject({ status: 401 });
  });

  it('authorizes with the current database role rather than the issued role', async () => {
    const jwt = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'u1', role: 'OWNER' }) };
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue({ id: 'u1', email: 'user@example.com', role: 'CUSTOMER', status: 'ACTIVE' }) } };
    const guard = new JwtAuthGuard(jwt as unknown as JwtService, prisma as unknown as PrismaService);
    const request: { headers: { authorization: string }; user?: { role: string } } = { headers: { authorization: 'Bearer existing-session' } };
    const context = { switchToHttp: () => ({ getRequest: () => request }) };
    await expect(guard.canActivate(context as ExecutionContext)).resolves.toBe(true);
    expect(request.user?.role).toBe('CUSTOMER');
  });
});
