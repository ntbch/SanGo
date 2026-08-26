/**
 * Integration test Wallets (F6) — Postgres thật, tự bỏ qua khi không có DB.
 * Chứng minh:
 *  - Nạp tiền mock: callback khớp amount mới cộng ví; replay callback idempotent.
 *  - UNIQUE(refType, refId, type) trên ledger chặn hoàn kép khi retry/crash.
 *  - Hai giao dịch chi ĐỒNG THỜI không thể âm ví (FOR UPDATE theo user).
 *  - GET /wallet/me đọc số dư + lịch sử ledger phân trang.
 */
import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaClient, type User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PrismaModule } from '../../src/prisma/prisma.module';
import { WalletsModule } from '../../src/wallets/wallets.module';
import { WalletsService } from '../../src/wallets/wallets.service';

const SUFFIX = Date.now().toString(36);

describe('Wallets service (integration)', () => {
  let prisma: PrismaClient;
  let wallets: WalletsService;
  let dbUp = false;

  let u1!: User; // luồng topup
  let u2!: User; // hoàn kép
  let u3!: User; // chi đồng thời + phân trang

  beforeAll(async () => {
    prisma = new PrismaClient();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbUp = true;
    } catch {
      console.warn('[integration] Không có Postgres -> bỏ qua wallets integration');
      return;
    }
    const hash = await bcrypt.hash('IntegrationPass1!', 4);
    const mkUser = (email: string) =>
      prisma.user.create({
        data: { email, passwordHash: hash, fullName: 'Wallet User', role: 'CUSTOMER' },
      });
    [u1, u2, u3] = await Promise.all([
      mkUser(`itwal-a-${SUFFIX}@sango.vn`),
      mkUser(`itwal-b-${SUFFIX}@sango.vn`),
      mkUser(`itwal-c-${SUFFIX}@sango.vn`),
    ]);

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, WalletsModule],
    }).compile();
    wallets = moduleRef.get(WalletsService);
  });

  afterAll(async () => {
    if (dbUp) await prisma.$disconnect();
  });

  it('F6: nạp mock -> PAID + ledger CREDIT/TOPUP + balanceAfter đúng', async () => {
    if (!dbUp) return;
    const res = await wallets.createTopup(u1, { amount: 200_000 });
    expect(res.mode).toBe('mock');
    expect(res.paymentUrl).toContain('/api/v1/wallet/mock/callback');

    await wallets.handleMockCallback({ txnRef: res.txnRef, amount: '200000' });

    const topup = await prisma.walletTopup.findUnique({ where: { txnRef: res.txnRef } });
    expect(topup?.status).toBe('PAID');
    const entry = await prisma.walletLedger.findFirst({
      where: { userId: u1.id, type: 'TOPUP' },
    });
    expect(entry).toMatchObject({
      direction: 'CREDIT',
      refType: 'TOPUP',
      refId: res.txnRef,
      amount: 200_000,
      balanceAfter: 200_000,
    });

    // KHÔNG được tạo Payment cho topup (Payment gắn bookingId NOT NULL)
    expect(await prisma.payment.count({ where: { txnRef: res.txnRef } })).toBe(0);
  });

  it('F6: replay callback -> SUCCESS idempotent, không ghi thêm ledger', async () => {
    if (!dbUp) return;
    const res = await wallets.createTopup(u1, { amount: 50_000 });
    await wallets.handleMockCallback({ txnRef: res.txnRef, amount: '50000' });
    const before = await prisma.walletLedger.count({ where: { userId: u1.id } });

    const replay = await wallets.handleMockCallback({ txnRef: res.txnRef, amount: '50000' });
    expect(replay.redirectUrl).toContain('status=SUCCESS');
    expect(await prisma.walletLedger.count({ where: { userId: u1.id } })).toBe(before);
  });

  it('F6: callback thiếu/sai amount bị chặn (bài học S0)', async () => {
    if (!dbUp) return;
    const res = await wallets.createTopup(u1, { amount: 120_000 });
    await expect(wallets.handleMockCallback({ txnRef: res.txnRef })).rejects.toMatchObject({
      response: { code: 'WALLET_AMOUNT_MISMATCH' },
    });
    await expect(
      wallets.handleMockCallback({ txnRef: res.txnRef, amount: '999' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(await prisma.walletTopup.findUnique({ where: { txnRef: res.txnRef } })).toMatchObject({
      status: 'PENDING',
    });
  });

  it('F6: hoàn 2 lần cùng (refType, refId, type) -> lần 2 văng P2002 (chặn hoàn kép)', async () => {
    if (!dbUp) return;
    const entry = {
      userId: u2.id,
      amount: 80_000,
      type: 'REFUND' as const,
      refType: 'PAYMENT',
      refId: `fake-payment-${SUFFIX}`,
    };
    await wallets.credit(entry);
    await expect(wallets.credit(entry)).rejects.toMatchObject({ code: 'P2002' });
    expect(await prisma.walletLedger.count({ where: { userId: u2.id } })).toBe(1);
  });

  it('F6: hai giao dịch chi đồng thời -> đúng một thắng, ví không âm', async () => {
    if (!dbUp) return;
    await wallets.credit({
      userId: u3.id,
      amount: 100_000,
      type: 'TOPUP',
      refType: 'TOPUP',
      refId: `seed-${SUFFIX}`,
    });

    const entry = {
      userId: u3.id,
      amount: 80_000,
      type: 'PAYMENT' as const,
      refType: 'BOOKING',
      refId: `bk-${SUFFIX}`,
    };
    const results = await Promise.allSettled([wallets.debit(entry), wallets.debit(entry)]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(ConflictException);

    const me = await wallets.getMyWallet(u3, { page: 1, pageSize: 10 });
    expect(me.balance).toBe(20_000);
  });

  it('F6: getMyWallet lịch sử mới nhất lên đầu + phân trang', async () => {
    if (!dbUp) return;
    const page1 = await wallets.getMyWallet(u3, { page: 1, pageSize: 1 });
    const page2 = await wallets.getMyWallet(u3, { page: 2, pageSize: 1 });
    expect(page1.items.length).toBe(1);
    expect(page2.items.length).toBe(1);
    expect(page1.total).toBe(page2.total);
    // Mới nhất lên đầu: hai dòng ghi trong cùng ms nên so mốc thời gian thay vì đợi thứ tự cố định
    expect(page1.items[0]!.createdAt.getTime()).toBeGreaterThanOrEqual(
      page2.items[0]!.createdAt.getTime(),
    );
    const dirs = [page1.items[0]!.direction, page2.items[0]!.direction].sort();
    expect(dirs).toEqual(['CREDIT', 'DEBIT']);
  });

  it('F6: PAYMENT_MODE≠mock -> từ chối nạp ví (WALLET_TOPUP_MOCK_ONLY)', async () => {
    if (!dbUp) return;
    const prev = process.env.PAYMENT_MODE;
    process.env.PAYMENT_MODE = 'vnpay';
    try {
      await expect(wallets.createTopup(u1, { amount: 100_000 })).rejects.toMatchObject({
        response: { code: 'WALLET_TOPUP_MOCK_ONLY' },
      });
    } finally {
      if (prev === undefined) delete process.env.PAYMENT_MODE;
      else process.env.PAYMENT_MODE = prev;
    }
  });
});
