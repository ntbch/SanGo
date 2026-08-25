/**
 * Integration test Vouchers (F3-BE) — Postgres thật, tự bỏ qua khi không có DB.
 * Phủ: tạo/quản lý mã; áp mã snapshot giá vào hold; cửa sổ giờ thấp điểm;
 * chặn lạm dụng UNIQUE(voucherId,userId) + atomic usageLimit; mã venue khác bị chặn.
 */
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BookingHoldStatus, PrismaClient, SportType, type User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingsModule } from '../bookings/bookings.module';
import { BookingsService } from '../bookings/bookings.service';
import { VouchersModule } from './vouchers.module';
import { VouchersService } from './vouchers.service';

const SUFFIX = Date.now().toString(36);

describe('Vouchers apply flow (integration)', () => {
  let prisma: PrismaClient;
  let bookings: BookingsService;
  let vouchers: VouchersService;
  let dbUp = false;

  let ownerA!: User; // chủ venue chính
  let ownerB!: User; // owner khác để test mã không áp dụng chéo venue
  let cust1!: User;
  let cust2!: User;
  let courtId!: string;

  const dateIn = (days: number): string =>
    new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

  /** Mỗi user chỉ được 1 hold ACTIVE (HOLD_LIMIT) — hết hạn hold của test trước để test sau tạo được hold mới. */
  afterEach(async () => {
    if (!dbUp) return;
    await prisma.bookingHold.updateMany({
      where: { status: BookingHoldStatus.ACTIVE },
      data: { status: BookingHoldStatus.EXPIRED },
    });
  });

  beforeAll(async () => {
    prisma = new PrismaClient();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbUp = true;
    } catch {
      console.warn('[integration] Không có Postgres -> bỏ qua vouchers integration');
      return;
    }
    const hash = await bcrypt.hash('IntegrationPass1!', 4);
    const mkUser = (role: 'CUSTOMER' | 'OWNER', email: string, fullName: string) =>
      prisma.user.create({
        data: { email, passwordHash: hash, fullName, role },
      });
    ownerA = await mkUser('OWNER', `itvch-owner-a-${SUFFIX}@courthub.vn`, 'Owner A');
    ownerB = await mkUser('OWNER', `itvch-owner-b-${SUFFIX}@courthub.vn`, 'Owner B');
    cust1 = await mkUser('CUSTOMER', `itvch-c1-${SUFFIX}@courthub.vn`, 'Cust 1');
    cust2 = await mkUser('CUSTOMER', `itvch-c2-${SUFFIX}@courthub.vn`, 'Cust 2');

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, BookingsModule, VouchersModule],
    }).compile();
    bookings = moduleRef.get(BookingsService);
    vouchers = moduleRef.get(VouchersService);

    const venue = await prisma.venue.create({
      data: {
        name: 'Itest-Vch Venue ' + SUFFIX,
        slug: 'itvch-' + SUFFIX,
        address: 'Test',
        lat: 10,
        lng: 106,
        openMinute: 360,
        closeMinute: 1320,
        depositPercent: 50,
        ownerId: ownerA.id,
        status: 'APPROVED',
      },
    });
    const court = await prisma.court.create({
      data: {
        name: 'Itest-Vch Court',
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
        where: { email: { contains: 'itvch-' } },
        select: { id: true },
      });
      const ids = users.map((u) => u.id);
      await prisma.voucherRedemption.deleteMany({ where: { userId: { in: ids } } });
      await prisma.voucher.deleteMany({ where: { ownerId: { in: ids } } });
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

  it('owner tạo voucher và list mine', async () => {
    if (!dbUp) return;
    const v = await vouchers.createVoucher(ownerA, {
      code: `GIORE-${SUFFIX}`,
      percentOff: 20,
      validFromMinute: 540,
      validToMinute: 960,
      usageLimit: 100,
      perUserLimit: 1,
    });
    expect(v.code).toBe(`GIORE-${SUFFIX}`);
    const mine = await vouchers.listOwnVouchers(ownerA.id);
    expect(mine.some((x) => x.id === v.id)).toBe(true);
  });

  it('áp mã happy path: snapshot discountAmount/finalAmount vào hold', async () => {
    if (!dbUp) return;
    const hold = (await bookings.createHold(
      { id: cust1.id },
      { courtId, date: dateIn(1), slots: [600] }, // 10:00-11:00 nằm trong cửa sổ 540-960
    )) as { holdId: string };
    const res = await vouchers.applyToHold(
      { id: cust1.id },
      { holdId: hold.holdId, code: `GIORE-${SUFFIX}` },
    );
    expect(res.subtotal).toBe(200_000);
    expect(res.discountAmount).toBe(40_000); // 20% của 200k
    expect(res.finalAmount).toBe(160_000);

    const inDb = await prisma.bookingHold.findUniqueOrThrow({ where: { id: hold.holdId } });
    expect(inDb.discountAmount).toBe(40_000);
    expect(inDb.finalAmount).toBe(160_000);
  });

  it('hold đã áp mã -> VOUCHER_ALREADY_APPLIED', async () => {
    if (!dbUp) return;
    const v2 = await vouchers.createVoucher(ownerA, {
      code: `GIORE2-${SUFFIX}`,
      percentOff: 10,
      validFromMinute: 540,
      validToMinute: 960,
      usageLimit: 10,
      perUserLimit: 1,
    });
    const hold = (await bookings.createHold(
      { id: cust1.id },
      { courtId, date: dateIn(2), slots: [600] },
    )) as { holdId: string };
    // Áp thành công mã đầu tiên
    await vouchers.applyToHold({ id: cust1.id }, { holdId: hold.holdId, code: v2.code });
    // Áp tiếp mã khác trên cùng hold vẫn bị chặn: 1 hold 1 voucher.
    const v3 = await vouchers.createVoucher(ownerA, {
      code: `GIORE3-${SUFFIX}`,
      percentOff: 15,
      validFromMinute: 540,
      validToMinute: 960,
      usageLimit: 10,
      perUserLimit: 1,
    });
    await expect(
      vouchers.applyToHold({ id: cust1.id }, { holdId: hold.holdId, code: v3.code }),
    ).rejects.toMatchObject({ response: { code: 'VOUCHER_ALREADY_APPLIED' } });
  });

  it('ngoài cửa sổ khung giờ thấp điểm -> VOUCHER_OUT_OF_WINDOW', async () => {
    if (!dbUp) return;
    const hold = (await bookings.createHold(
      { id: cust1.id },
      { courtId, date: dateIn(3), slots: [1080] }, // 18:00 ngoài cửa sổ 540-960
    )) as { holdId: string };
    await expect(
      vouchers.applyToHold({ id: cust1.id }, { holdId: hold.holdId, code: `GIORE-${SUFFIX}` }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('mã của owner khác -> VOUCHER_NOT_APPLICABLE', async () => {
    if (!dbUp) return;
    await vouchers.createVoucher(ownerB, {
      code: `SAN-KHAC-${SUFFIX}`,
      percentOff: 50,
      validFromMinute: 0,
      validToMinute: 1440,
      usageLimit: 10,
      perUserLimit: 1,
    });
    const hold = (await bookings.createHold(
      { id: cust1.id },
      { courtId, date: dateIn(4), slots: [600] },
    )) as { holdId: string };
    await expect(
      vouchers.applyToHold({ id: cust1.id }, { holdId: hold.holdId, code: `SAN-KHAC-${SUFFIX}` }),
    ).rejects.toMatchObject({ response: { code: 'VOUCHER_NOT_APPLICABLE' } });
  });

  it('mỗi user chỉ 1 lượt -> VOUCHER_USER_LIMIT (UNIQUE chặn retry)', async () => {
    if (!dbUp) return;
    const hold = (await bookings.createHold(
      { id: cust1.id },
      { courtId, date: dateIn(5), slots: [660] },
    )) as { holdId: string };
    await expect(
      vouchers.applyToHold({ id: cust1.id }, { holdId: hold.holdId, code: `GIORE-${SUFFIX}` }),
    ).rejects.toMatchObject({ response: { code: 'VOUCHER_USER_LIMIT' } });
  });

  it('hết quota usageLimit -> VOUCHER_EXHAUSTED (atomic)', async () => {
    if (!dbUp) return;
    const vc = await vouchers.createVoucher(ownerA, {
      code: `HETQUOTA-${SUFFIX}`,
      percentOff: 30,
      validFromMinute: 540,
      validToMinute: 960,
      usageLimit: 1,
      perUserLimit: 1,
    });
    // cust2 dùng hết lượt duy nhất
    const h2 = (await bookings.createHold(
      { id: cust2.id },
      { courtId, date: dateIn(6), slots: [600] },
    )) as { holdId: string };
    await vouchers.applyToHold({ id: cust2.id }, { holdId: h2.holdId, code: vc.code });
    // cust1 đến sau phải bị chặn nguyên tử
    const h1 = (await bookings.createHold(
      { id: cust1.id },
      { courtId, date: dateIn(7), slots: [600] },
    )) as { holdId: string };
    await expect(
      vouchers.applyToHold({ id: cust1.id }, { holdId: h1.holdId, code: vc.code }),
    ).rejects.toMatchObject({ response: { code: 'VOUCHER_EXHAUSTED' } });
    // Quota đã tiêu đúng 1, không âm không dư
    const row = await prisma.voucher.findUniqueOrThrow({ where: { id: vc.id } });
    expect(row.usedCount).toBe(1);
    // Hold bị từ chối không bị snapshot bẩn
    const dirty = await prisma.bookingHold.findUniqueOrThrow({ where: { id: h1.holdId } });
    expect(dirty.discountAmount).toBeNull();
  });

  it('mã lạ / bị tắt -> VOUCHER_NOT_FOUND', async () => {
    if (!dbUp) return;
    const hold = (await bookings.createHold(
      { id: cust1.id },
      { courtId, date: dateIn(8), slots: [600] },
    )) as { holdId: string };
    await expect(
      vouchers.applyToHold({ id: cust1.id }, { holdId: hold.holdId, code: 'KHONG-TON-TAI' }),
    ).rejects.toMatchObject({ response: { code: 'VOUCHER_NOT_FOUND' } });

    await vouchers.setStatus(
      ownerA.id,
      (await prisma.voucher.findUniqueOrThrow({ where: { code: `GIORE-${SUFFIX}` } })).id,
      { active: false },
    );
    await expect(
      vouchers.applyToHold({ id: cust1.id }, { holdId: hold.holdId, code: `GIORE-${SUFFIX}` }),
    ).rejects.toMatchObject({ response: { code: 'VOUCHER_NOT_FOUND' } });
  });
});
