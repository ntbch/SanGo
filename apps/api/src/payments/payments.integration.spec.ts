/**
 * Integration test Payments (spec §6.1 bước 3-4) — Postgres thật, tự bỏ qua khi không có DB.
 * Chứng minh: mock flow hold -> checkout -> callback -> Booking CONFIRMED + Payment PAID;
 * idempotency theo txnRef UNIQUE; amount mismatch bị chặn; chữ ký VNPay sai bị chặn.
 */
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaClient, SportType, type User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingsModule } from '../bookings/bookings.module';
import { BookingsService } from '../bookings/bookings.service';
import { PaymentsModule } from './payments.module';
import { PaymentsService } from './payments.service';

const SUFFIX = Date.now().toString(36);

describe('Payments mock/vnpay-callback flow (integration)', () => {
  let prisma: PrismaClient;
  let bookings: BookingsService;
  let payments: PaymentsService;
  let dbUp = false;

  let cust!: User;
  let courtId!: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbUp = true;
    } catch {
      console.warn('[integration] Không có Postgres -> bỏ qua payments integration');
      return;
    }
    const hash = await bcrypt.hash('IntegrationPass1!', 4);
    cust = await prisma.user.create({
      data: {
        email: `itpay-a-${SUFFIX}@courthub.vn`,
        passwordHash: hash,
        fullName: 'Pay Cust',
        role: 'CUSTOMER',
      },
    });

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, BookingsModule, PaymentsModule],
    }).compile();
    bookings = moduleRef.get(BookingsService);
    payments = moduleRef.get(PaymentsService);

    const owner = await prisma.user.create({
      data: {
        email: `itpay-owner-${SUFFIX}@courthub.vn`,
        passwordHash: hash,
        fullName: 'Owner',
        role: 'OWNER',
      },
    });
    const venue = await prisma.venue.create({
      data: {
        name: 'Itest-Pay Venue ' + SUFFIX,
        slug: 'itpay-' + SUFFIX,
        address: 'Test',
        lat: 10,
        lng: 106,
        openMinute: 360,
        closeMinute: 1320,
        depositPercent: 50,
        ownerId: owner.id,
        status: 'APPROVED',
      },
    });
    const court = await prisma.court.create({
      data: {
        name: 'Itest-Pay Court',
        venueId: venue.id,
        sportType: SportType.FOOTBALL5,
        slotMinutes: 60,
        defaultPricePerSlot: 200_000,
      },
    });
    courtId = court.id;
  });

  afterAll(async () => {
    if (dbUp) {
      const users = await prisma.user.findMany({
        where: { email: { contains: 'itpay-' } },
        select: { id: true },
      });
      const ids = users.map((u) => u.id);
      await prisma.payment.deleteMany({ where: { booking: { customerId: { in: ids } } } });
      await prisma.booking.deleteMany({ where: { customerId: { in: ids } } });
      await prisma.bookingHold.deleteMany({ where: { userId: { in: ids } } });
      const owned = await prisma.venue.findMany({
        where: { ownerId: { in: ids } },
        select: { id: true },
      });
      const venueIds = owned.map((v) => v.id);
      await prisma.pricingRule.deleteMany({ where: { court: { venueId: { in: venueIds } } } });
      await prisma.court.deleteMany({ where: { venueId: { in: venueIds } } });
      await prisma.venue.deleteMany({ where: { id: { in: venueIds } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
  });

  it('mock flow: checkout DEPOSIT -> callback -> CONFIRMED + Payment PAID đúng số cọc', async () => {
    if (!dbUp) return;
    const DATE = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const hold = (await bookings.createHold(
      { id: cust.id },
      { courtId, date: DATE, slots: [600] },
    )) as {
      holdId: string;
      subtotal: number;
      depositPercent: number;
    };

    const co = await payments.createCheckout(
      { id: cust.id },
      { holdId: hold.holdId, type: 'DEPOSIT' },
    );
    expect(co.amount).toBe(100_000); // cọc 50% của 200k
    expect(co.mode).toBe('mock');
    expect(co.txnRef).toContain(hold.holdId);

    const res = await payments.handleMockCallback({ txnRef: co.txnRef, amount: String(co.amount) });
    expect(res.redirectUrl).toContain('status=SUCCESS');

    const booking = await prisma.booking.findFirstOrThrow({ where: { customerId: cust.id } });
    expect(booking.status).toBe('CONFIRMED');
    expect(booking.depositAmount).toBe(100_000);
    const payment = await prisma.payment.findUniqueOrThrow({ where: { txnRef: co.txnRef } });
    expect(payment.status).toBe('PAID');
    expect(payment.type).toBe('DEPOSIT');

    // Idempotency: callback gọi lại với cùng txnRef -> không ném, không nhân bản
    await payments.handleMockCallback({ txnRef: co.txnRef, amount: String(co.amount) });
    expect(await prisma.payment.count({ where: { txnRef: co.txnRef } })).toBe(1);
    expect(await prisma.booking.count({ where: { customerId: cust.id } })).toBe(1);
  });

  it('FULL: trả đủ subtotal, booking.depositAmount = subtotal', async () => {
    if (!dbUp) return;
    const DATE = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
    const hold = (await bookings.createHold(
      { id: cust.id },
      { courtId, date: DATE, slots: [600] },
    )) as {
      holdId: string;
    };
    const co = await payments.createCheckout(
      { id: cust.id },
      { holdId: hold.holdId, type: 'FULL' },
    );
    expect(co.amount).toBe(200_000);
    await payments.handleMockCallback({ txnRef: co.txnRef, amount: String(co.amount) });
    const booking = await prisma.booking.findFirstOrThrow({
      where: { customerId: cust.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(booking.depositAmount).toBe(200_000);
    const payment = await prisma.payment.findUniqueOrThrow({ where: { txnRef: co.txnRef } });
    expect(payment.type).toBe('FULL');
  });

  it('amount lệch -> PAYMENT_AMOUNT_MISMATCH; txnRef bẩn -> PAYMENT_BAD_TXNREF', async () => {
    if (!dbUp) return;
    const DATE = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
    const hold = (await bookings.createHold(
      { id: cust.id },
      { courtId, date: DATE, slots: [660] },
    )) as {
      holdId: string;
    };
    const co = await payments.createCheckout(
      { id: cust.id },
      { holdId: hold.holdId, type: 'DEPOSIT' },
    );
    await expect(
      payments.handleMockCallback({ txnRef: co.txnRef, amount: '1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(payments.handleMockCallback({ txnRef: 'dirty-ref' })).rejects.toMatchObject({
      response: { code: 'PAYMENT_BAD_TXNREF' },
    });

    // Slot vẫn giữ được sau khi callback thất bại -> checkout lại với txnRef mới vẫn OK
    const co2 = await payments.createCheckout(
      { id: cust.id },
      { holdId: hold.holdId, type: 'DEPOSIT' },
    );
    await payments.handleMockCallback({ txnRef: co2.txnRef });
    expect(co2.txnRef).not.toBe(co.txnRef);
  });

  it('VNPay: chữ ký sai bị chặn; chữ ký đúng + ResponseCode 00 -> confirm thành công', async () => {
    if (!dbUp) return;
    process.env.VNPAY_HASH_SECRET = 'test-secret-512';

    const DATE = new Date(Date.now() + 4 * 86_400_000).toISOString().slice(0, 10);
    const hold = (await bookings.createHold(
      { id: cust.id },
      { courtId, date: DATE, slots: [720] },
    )) as {
      holdId: string;
    };
    const co = await payments.createCheckout(
      { id: cust.id },
      { holdId: hold.holdId, type: 'DEPOSIT' },
    );

    // Sai chữ ký
    await expect(
      payments.handleVnpayCallback({
        vnp_TxnRef: co.txnRef,
        vnp_Amount: String(co.amount * 100),
        vnp_ResponseCode: '00',
        vnp_SecureHash: 'deadbeef'.repeat(8),
      }),
    ).rejects.toMatchObject({ response: { code: 'PAYMENT_BAD_SIGNATURE' } });

    // Đúng chữ ký (tự ký như cổng làm)
    const params: Record<string, string> = {
      vnp_TxnRef: co.txnRef,
      vnp_Amount: String(co.amount * 100),
      vnp_ResponseCode: '00',
    };
    const { signHmacSha512, buildSignData } = await import('./vnpay.util');
    params.vnp_SecureHash = signHmacSha512(buildSignData(params), 'test-secret-512');
    const ok = await payments.handleVnpayCallback(params);
    expect(ok.redirectUrl).toContain('status=SUCCESS');
  });
});
