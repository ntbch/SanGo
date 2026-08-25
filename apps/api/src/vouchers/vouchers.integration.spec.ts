/**
 * Integration test Vouchers (F3-BE) — Postgres thật, tự bỏ qua khi không có DB.
 * Phủ: owner CRUD; áp mã snapshot giá vào hold (chưa tiêu quota); cửa sổ giờ thấp
 * điểm dayOfWeek + phút; consume redemption trong confirmFromHold (atomic usageLimit,
 * UNIQUE(voucherId,userId) chặn dùng lại); hoàn theo giá đã giảm qua depositAmount.
 */
import { Test } from '@nestjs/testing';
import { BookingHoldStatus, PrismaClient, SportType, type User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingsModule } from '../bookings/bookings.module';
import { BookingsService } from '../bookings/bookings.service';
import { VouchersModule } from './vouchers.module';
import { VouchersService } from './vouchers.service';

const SUFFIX = Date.now().toString(36);

describe('Vouchers F3-BE (integration)', () => {
  let prisma: PrismaClient;
  let bookings: BookingsService;
  let vouchers: VouchersService;
  let dbUp = false;

  let ownerA!: User;
  let ownerB!: User;
  let cust1!: User;
  let cust2!: User;
  let courtId!: string;

  const dateIn = (days: number): string =>
    new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
  /** Thứ trong tuần của ngày ISO theo getUTCDay() (0=CN..6=7). */
  const dowOf = (dateIso: string): number => new Date(dateIso + 'T00:00:00Z').getUTCDay();

  const mkVoucher = (
    ownerId: string,
    overrides: Partial<{
      code: string;
      percentOff: number;
      dayOfWeek: number;
      validFromMinute: number;
      validToMinute: number;
      usageLimit: number;
      perUserLimit: number;
      expiresAt: string | undefined;
    }> = {},
  ) => {
    const date = dateIn(1);
    return vouchers.createVoucher(
      { id: ownerId },
      {
        code: `VCH-${SUFFIX}-` + Math.random().toString(36).slice(2, 7).toUpperCase(),
        percentOff: 20,
        dayOfWeek: dowOf(date),
        validFromMinute: 540,
        validToMinute: 960,
        usageLimit: 100,
        perUserLimit: 1,
        ...overrides,
      },
    );
  };

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

  afterEach(async () => {
    // HOLD_LIMIT: mỗi user chỉ 1 hold ACTIVE — hết hạn hold của test trước.
    if (!dbUp) return;
    await prisma.bookingHold.updateMany({
      where: { status: BookingHoldStatus.ACTIVE },
      data: { status: BookingHoldStatus.EXPIRED },
    });
  });

  afterAll(async () => {
    if (dbUp) {
      const ids = [ownerA?.id, ownerB?.id, cust1?.id, cust2?.id].filter(Boolean);
      await prisma.voucherRedemption.deleteMany({
        where: { voucher: { ownerId: { in: ids } } },
      });
      await prisma.voucher.deleteMany({ where: { ownerId: { in: ids } } });
      await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
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

  it('owner CRUD: tạo -> list -> PATCH một phần -> xoá', async () => {
    if (!dbUp) return;
    const v = await mkVoucher(ownerA.id, { code: `CRUD-${SUFFIX}` });
    expect(v.code).toBe(`CRUD-${SUFFIX}`);

    let mine = await vouchers.listOwnVouchers(ownerA.id);
    expect(mine.some((x) => x.id === v.id)).toBe(true);

    await vouchers.updateVoucher(ownerA.id, v.id, { active: false, percentOff: 30 });
    mine = await vouchers.listOwnVouchers(ownerA.id);
    const row = mine.find((x) => x.id === v.id);
    expect(row?.active).toBe(false);
    expect(row?.percentOff).toBe(30);

    await vouchers.deleteVoucher(ownerA.id, v.id);
    mine = await vouchers.listOwnVouchers(ownerA.id);
    expect(mine.some((x) => x.id === v.id)).toBe(false);
  });

  it('áp mã happy path: snapshot giá + voucherId vào hold, CHƯA tiêu quota', async () => {
    if (!dbUp) return;
    const v = await mkVoucher(ownerA.id, { code: `HAPPY-${SUFFIX}` });
    const hold = (await bookings.createHold(
      { id: cust1.id },
      { courtId, date: dateIn(1), slots: [600] }, // đúng thứ của voucher, trong cửa sổ
    )) as { holdId: string };

    const res = await vouchers.applyToHold({ id: cust1.id }, { holdId: hold.holdId, code: v.code });
    expect(res.subtotal).toBe(200_000);
    expect(res.discountAmount).toBe(40_000);
    expect(res.finalAmount).toBe(160_000);

    const inDb = await prisma.bookingHold.findUniqueOrThrow({ where: { id: hold.holdId } });
    expect(inDb.discountAmount).toBe(40_000);
    expect(inDb.finalAmount).toBe(160_000);
    expect(inDb.voucherId).toBe(v.id);

    // Quota chỉ tiêu khi thanh toán thành công (confirmFromHold)
    const vch = await prisma.voucher.findUniqueOrThrow({ where: { id: v.id } });
    expect(vch.usedCount).toBe(0);
    expect(await prisma.voucherRedemption.count({ where: { voucherId: v.id } })).toBe(0);
  });

  it('hold đã áp mã -> VOUCHER_ALREADY_APPLIED', async () => {
    if (!dbUp) return;
    const v1 = await mkVoucher(ownerA.id, { code: `AP1-${SUFFIX}` });
    const v2 = await mkVoucher(ownerA.id, { code: `AP2-${SUFFIX}` });
    const hold = (await bookings.createHold(
      { id: cust1.id },
      { courtId, date: dateIn(1), slots: [600] },
    )) as { holdId: string };
    await vouchers.applyToHold({ id: cust1.id }, { holdId: hold.holdId, code: v1.code });
    await expect(
      vouchers.applyToHold({ id: cust1.id }, { holdId: hold.holdId, code: v2.code }),
    ).rejects.toMatchObject({ response: { code: 'VOUCHER_ALREADY_APPLIED' } });
  });

  it('sai thứ trong tuần / ngoài khung giờ -> VOUCHER_OUT_OF_WINDOW', async () => {
    if (!dbUp) return;
    const d3 = dateIn(3);
    const vWrongDow = await mkVoucher(ownerA.id, {
      code: `DOW-${SUFFIX}`,
      dayOfWeek: (dowOf(d3) + 1) % 7, // cố ý lệch thứ
    });
    const holdDow = (await bookings.createHold(
      { id: cust1.id },
      { courtId, date: d3, slots: [600] },
    )) as { holdId: string };
    await expect(
      vouchers.applyToHold({ id: cust1.id }, { holdId: holdDow.holdId, code: vWrongDow.code }),
    ).rejects.toMatchObject({ response: { code: 'VOUCHER_OUT_OF_WINDOW' } });

    // HOLD_LIMIT: giải phóng hold trước khi tạo hold kế tiếp trong cùng test
    await prisma.bookingHold.update({
      where: { id: holdDow.holdId },
      data: { status: BookingHoldStatus.EXPIRED },
    });

    const vWindow = await mkVoucher(ownerA.id, {
      code: `WIN-${SUFFIX}`,
      dayOfWeek: dowOf(dateIn(4)),
      validFromMinute: 1020,
      validToMinute: 1200, // chỉ buổi tối
    });
    const holdWin = (await bookings.createHold(
      { id: cust1.id },
      { courtId, date: dateIn(4), slots: [600] }, // 10:00 ngoài cửa sổ tối
    )) as { holdId: string };
    await expect(
      vouchers.applyToHold({ id: cust1.id }, { holdId: holdWin.holdId, code: vWindow.code }),
    ).rejects.toMatchObject({ response: { code: 'VOUCHER_OUT_OF_WINDOW' } });
  });

  it('mã của owner khác -> VOUCHER_NOT_APPLICABLE; mã lạ/bị tắt/hết hạn -> NOT_FOUND', async () => {
    if (!dbUp) return;
    const vOther = await mkVoucher(ownerB.id, { code: `OTHER-${SUFFIX}` });
    const hold = (await bookings.createHold(
      { id: cust1.id },
      { courtId, date: dateIn(5), slots: [600] },
    )) as { holdId: string };
    await expect(
      vouchers.applyToHold({ id: cust1.id }, { holdId: hold.holdId, code: vOther.code }),
    ).rejects.toMatchObject({ response: { code: 'VOUCHER_NOT_APPLICABLE' } });

    await expect(
      vouchers.applyToHold({ id: cust1.id }, { holdId: hold.holdId, code: 'KHONG-TON-TAI' }),
    ).rejects.toMatchObject({ response: { code: 'VOUCHER_NOT_FOUND' } });

    const off = await mkVoucher(ownerA.id, { code: `OFF-${SUFFIX}` });
    await vouchers.updateVoucher(ownerA.id, off.id, { active: false });
    await expect(
      vouchers.applyToHold({ id: cust1.id }, { holdId: hold.holdId, code: off.code }),
    ).rejects.toMatchObject({ response: { code: 'VOUCHER_NOT_FOUND' } });

    const expired = await mkVoucher(ownerA.id, {
      code: `EXP-${SUFFIX}`,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    await expect(
      vouchers.applyToHold({ id: cust1.id }, { holdId: hold.holdId, code: expired.code }),
    ).rejects.toMatchObject({ response: { code: 'VOUCHER_NOT_FOUND' } });
  });

  it('confirm tiêu quota + depositAmount trên giá đã giảm; dùng lần 2 -> VOUCHER_USER_LIMIT', async () => {
    if (!dbUp) return;
    const v = await mkVoucher(ownerA.id, {
      code: `LIM-${SUFFIX}`,
      percentOff: 20,
      usageLimit: 100,
      dayOfWeek: dowOf(dateIn(6)),
    });
    // Lượt 1: apply -> confirm thành công
    const h1 = (await bookings.createHold(
      { id: cust1.id },
      { courtId, date: dateIn(6), slots: [600] },
    )) as { holdId: string };
    await vouchers.applyToHold({ id: cust1.id }, { holdId: h1.holdId, code: v.code });
    const booking = await bookings.confirmFromHold(h1.holdId, { txnRef: `TXN-LIM-1-${SUFFIX}` });
    // Giá đã giảm 160k, cọc 50% = 80k — gốc tính hoàn (refundQuote) theo depositAmount
    expect(booking.depositAmount).toBe(80_000);

    const afterFirst = await prisma.voucher.findUniqueOrThrow({ where: { id: v.id } });
    expect(afterFirst.usedCount).toBe(1);
    const redemption = await prisma.voucherRedemption.findFirstOrThrow({
      where: { voucherId: v.id, userId: cust1.id },
    });
    expect(redemption.amountDiscounted).toBe(40_000);

    // refundQuote với mốc >24h -> hoàn 100% depositAmount (đúng "hoàn theo giá đã giảm":
    // gốc hoàn là tiền đã giảm 80k, KHÔNG phải subtotal 200k)
    const quote = bookings.refundQuote({
      date: new Date(Date.now() + 72 * 3_600_000),
      startMinute: booking.startMinute,
      depositAmount: booking.depositAmount,
    });
    expect(quote.percent).toBe(100);
    expect(quote.refundAmount).toBe(80_000);

    // Lượt 2 cùng user: soft-gate tại apply chặn NGAY (đã có redemption từ lượt 1).
    // Guard P2002 trong confirmFromHold vẫn là lớp phòng ngừa khi 2 luồng đua nhau
    // vượt qua soft-gate — không tái tạo được qua API công khai nên không test trực tiếp.
    const h2 = (await bookings.createHold(
      { id: cust1.id },
      { courtId, date: dateIn(6), slots: [660] },
    )) as { holdId: string };
    await expect(
      vouchers.applyToHold({ id: cust1.id }, { holdId: h2.holdId, code: v.code }),
    ).rejects.toMatchObject({ response: { code: 'VOUCHER_USER_LIMIT' } });
    const afterSecond = await prisma.voucher.findUniqueOrThrow({ where: { id: v.id } });
    expect(afterSecond.usedCount).toBe(1);
  });

  it('2 user confirm song song với usageLimit=1 -> đúng 1 thành công, thua VOUCHER_EXHAUSTED', async () => {
    if (!dbUp) return;
    const v = await mkVoucher(ownerA.id, {
      code: `RACE-${SUFFIX}`,
      usageLimit: 1,
      perUserLimit: 1,
    });
    const h1 = (await bookings.createHold(
      { id: cust1.id },
      { courtId, date: dateIn(1), slots: [720] },
    )) as { holdId: string };
    const h2 = (await bookings.createHold(
      { id: cust2.id },
      { courtId, date: dateIn(1), slots: [780] },
    )) as { holdId: string };
    await vouchers.applyToHold({ id: cust1.id }, { holdId: h1.holdId, code: v.code });
    await vouchers.applyToHold({ id: cust2.id }, { holdId: h2.holdId, code: v.code });

    const results = await Promise.allSettled([
      bookings.confirmFromHold(h1.holdId, { txnRef: `TXN-RACE-A-${SUFFIX}` }),
      bookings.confirmFromHold(h2.holdId, { txnRef: `TXN-RACE-B-${SUFFIX}` }),
    ]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    expect(fulfilled.length).toBe(1); // atomic guard chỉ cho đúng 1 qua
    expect(rejected.length).toBe(1);
    expect((rejected[0].reason as { response?: { code?: string } }).response?.code).toBe(
      'VOUCHER_EXHAUSTED',
    );

    const row = await prisma.voucher.findUniqueOrThrow({ where: { id: v.id } });
    expect(row.usedCount).toBe(1);
    expect(await prisma.voucherRedemption.count({ where: { voucherId: v.id } })).toBe(1);
  });
});
