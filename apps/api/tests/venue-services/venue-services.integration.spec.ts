/**
 * Integration test VenueServices (F4-BE) — Postgres thật, tự bỏ qua khi không có DB.
 * Phủ:
 *  1. Owner CRUD menu dịch vụ đi kèm (nước/bóng/vợt), bật/tắt, lọc public vs mine.
 *  2. Khách chọn thêm dịch vụ cho đơn CONFIRMED: snapshot unitPrice, upsert quantity.
 *  3. Chặn dịch vụ không thuộc sân / đã tắt / đơn chưa CONFIRMED.
 *  4. Checkout ADD_ON: tính đúng unpaidAmount, phát txnRef '<bookingId>.ADD_ON.<rand>'.
 *  5. Callback thanh toán ADD_ON: ghi Payment(ADD_ON, PAID), gửi thông báo SERVICE,
 *     chống gọi trùng (idempotent), chặn số tiền sai.
 *  6. Chống race MAJOR-B: 2 callback song song khác txnRef cùng booking -> tổng PAID
 *     đúng bằng unpaidAmount nhờ transaction FOR UPDATE + re-check tổng paid.
 */
import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import {
  PaymentStatus,
  PaymentType,
  PrismaClient,
  SportType,
  VenueServiceType,
  type User,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthModule } from '../../src/auth/auth.module';
import { BookingsModule } from '../../src/bookings/bookings.module';
import { BookingsService } from '../../src/bookings/bookings.service';
import { NotificationsModule } from '../../src/notifications/notifications.module';
import { PaymentsModule } from '../../src/payments/payments.module';
import { PaymentsService } from '../../src/payments/payments.service';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { VenueServicesModule } from '../../src/venue-services/venue-services.module';
import { VenueServicesService } from '../../src/venue-services/venue-services.service';

const SUFFIX = Date.now().toString(36);

describe('VenueServices and ADD_ON Payments (integration)', () => {
  let prisma: PrismaClient;
  let bookings: BookingsService;
  let payments: PaymentsService;
  let venueServices: VenueServicesService;
  let dbUp = false;

  let ownerA!: User;
  let ownerB!: User;
  let cust1!: User;
  let cust2!: User;
  let venueAId!: string;
  let venueBId!: string;
  let courtAId!: string;

  const dateIn = (days: number): string =>
    new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

  beforeAll(async () => {
    prisma = new PrismaClient();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbUp = true;
    } catch {
      console.warn('[integration] Không có Postgres -> bỏ qua venue-services integration');
      return;
    }

    const hash = await bcrypt.hash('IntegrationPass1!', 4);
    const mkUser = (role: 'CUSTOMER' | 'OWNER', email: string, fullName: string) =>
      prisma.user.create({
        data: { email, passwordHash: hash, fullName, role },
      });

    ownerA = await mkUser('OWNER', `itsvc-owner-a-${SUFFIX}@sango.vn`, 'Owner A');
    ownerB = await mkUser('OWNER', `itsvc-owner-b-${SUFFIX}@sango.vn`, 'Owner B');
    cust1 = await mkUser('CUSTOMER', `itsvc-c1-${SUFFIX}@sango.vn`, 'Cust 1');
    cust2 = await mkUser('CUSTOMER', `itsvc-c2-${SUFFIX}@sango.vn`, 'Cust 2');

    const moduleRef = await Test.createTestingModule({
      imports: [
        PrismaModule,
        AuthModule,
        NotificationsModule,
        BookingsModule,
        PaymentsModule,
        VenueServicesModule,
      ],
    }).compile();

    bookings = moduleRef.get(BookingsService);
    payments = moduleRef.get(PaymentsService);
    venueServices = moduleRef.get(VenueServicesService);

    const venueA = await prisma.venue.create({
      data: {
        name: 'Itest-Svc Venue A ' + SUFFIX,
        slug: 'itsvc-a-' + SUFFIX,
        address: 'Hà Nội',
        lat: 21.0,
        lng: 105.8,
        openMinute: 360,
        closeMinute: 1320,
        depositPercent: 50,
        ownerId: ownerA.id,
        status: 'APPROVED',
      },
    });
    venueAId = venueA.id;

    const venueB = await prisma.venue.create({
      data: {
        name: 'Itest-Svc Venue B ' + SUFFIX,
        slug: 'itsvc-b-' + SUFFIX,
        address: 'Hà Nội',
        lat: 21.0,
        lng: 105.8,
        openMinute: 360,
        closeMinute: 1320,
        depositPercent: 50,
        ownerId: ownerB.id,
        status: 'APPROVED',
      },
    });
    venueBId = venueB.id;

    const courtA = await prisma.court.create({
      data: {
        name: 'Itest-Svc Court A',
        venueId: venueA.id,
        sportType: SportType.FOOTBALL5,
        slotMinutes: 60,
        defaultPricePerSlot: 200_000,
      },
    });
    courtAId = courtA.id;
  });

  afterAll(async () => {
    if (dbUp) {
      const users = await prisma.user.findMany({
        where: { email: { contains: 'itsvc-' } },
        select: { id: true },
      });
      const ids = users.map((u) => u.id);

      await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
      await prisma.payment.deleteMany({ where: { booking: { customerId: { in: ids } } } });
      await prisma.bookingAddOn.deleteMany({ where: { booking: { customerId: { in: ids } } } });
      await prisma.booking.deleteMany({ where: { customerId: { in: ids } } });
      await prisma.bookingHold.deleteMany({ where: { userId: { in: ids } } });

      const owned = await prisma.venue.findMany({
        where: { ownerId: { in: ids } },
        select: { id: true },
      });
      const venueIds = owned.map((v) => v.id);

      await prisma.venueService.deleteMany({ where: { venueId: { in: venueIds } } });
      await prisma.court.deleteMany({ where: { venueId: { in: venueIds } } });
      await prisma.venue.deleteMany({ where: { id: { in: venueIds } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
  });

  it('Owner CRUD: thêm dịch vụ, cập nhật, tắt và lọc public', async () => {
    if (!dbUp) return;

    // 1. Tạo 3 dịch vụ: Nước suối, Thuê vợt, Áo pitch
    const water = await venueServices.createService(ownerA, venueAId, {
      name: 'Nước suối Lavie 500ml',
      price: 10_000,
      type: VenueServiceType.BEVERAGE,
      isAvailable: true,
    });
    expect(water.id).toBeDefined();
    expect(water.price).toBe(10_000);

    const racket = await venueServices.createService(ownerA, venueAId, {
      name: 'Thuê vợt Pickleball',
      price: 30_000,
      type: VenueServiceType.EQUIPMENT,
      isAvailable: true,
    });

    const bibs = await venueServices.createService(ownerA, venueAId, {
      name: 'Bộ áo pitch 10 cái',
      price: 50_000,
      type: VenueServiceType.OTHER,
      isAvailable: false, // tạm tắt
    });

    // 2. Owner listMine thấy cả 3
    const mine = await venueServices.listVenueServices(venueAId, false, ownerA);
    expect(mine.length).toBe(3);

    // 3. Khách listPublic chỉ thấy 2 (isAvailable: true)
    const pub = await venueServices.listVenueServices(venueAId, true);
    expect(pub.length).toBe(2);
    expect(pub.some((s) => s.id === bibs.id)).toBe(false);

    // 4. Update giá và bật lại áo pitch
    const updatedBibs = await venueServices.updateService(ownerA, venueAId, bibs.id, {
      price: 60_000,
      isAvailable: true,
    });
    expect(updatedBibs.price).toBe(60_000);
    expect(updatedBibs.isAvailable).toBe(true);

    // 5. Owner B không thể sửa dịch vụ của Owner A
    await expect(
      venueServices.updateService(ownerB, venueAId, water.id, { price: 20_000 }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    // 6. Delete service chưa dùng -> xóa thật
    const delRes = await venueServices.deleteService(ownerA, venueAId, racket.id);
    expect(delRes.deleted).toBe(true);
  });

  it('Booking Add-ons & Checkout flow: thêm dịch vụ, checkout ADD_ON, callback thành công', async () => {
    if (!dbUp) return;

    // 1. Tạo 2 dịch vụ mới
    const water = await venueServices.createService(ownerA, venueAId, {
      name: 'Nước điện giải Revive',
      price: 15_000,
      type: VenueServiceType.BEVERAGE,
      isAvailable: true,
    });

    const ball = await venueServices.createService(ownerA, venueAId, {
      name: 'Bóng thi đấu',
      price: 40_000,
      type: VenueServiceType.EQUIPMENT,
      isAvailable: true,
    });

    // 2. Khách tạo booking CONFIRMED
    const playDate = dateIn(2);
    const hold = (await bookings.createHold(
      { id: cust1.id },
      { courtId: courtAId, date: playDate, slots: [600] },
    )) as { holdId: string; subtotal: number };

    const confirmedBooking = await bookings.confirmFromHold(hold.holdId, {
      txnRef: `itsvc-hold-${hold.holdId}`,
      amountPaid: 100_000,
      paidInFull: false,
    });
    expect(confirmedBooking.status).toBe('CONFIRMED');

    // 3. Khách chọn mua 2 chai nước + 1 quả bóng
    const addOnRes = await venueServices.addBookingAddOns(cust1, confirmedBooking.id, {
      items: [
        { serviceId: water.id, quantity: 2 },
        { serviceId: ball.id, quantity: 1 },
      ],
    });
    // 2*15k + 1*40k = 70k
    expect(addOnRes.totalCost).toBe(70_000);
    expect(addOnRes.paidAmount).toBe(0);
    expect(addOnRes.unpaidAmount).toBe(70_000);

    // 4. Khách thêm tiếp 1 chai nước -> upsert tăng quantity thành 3
    const updatedAddOns = await venueServices.addBookingAddOns(cust1, confirmedBooking.id, {
      items: [{ serviceId: water.id, quantity: 1 }],
    });
    // 3*15k + 1*40k = 85k
    expect(updatedAddOns.totalCost).toBe(85_000);
    expect(updatedAddOns.unpaidAmount).toBe(85_000);

    // 5. Checkout ADD_ON
    const co = await venueServices.createAddonCheckout(cust1, confirmedBooking.id);
    expect(co.type).toBe('ADD_ON');
    expect(co.amount).toBe(85_000);
    expect(co.txnRef).toContain(confirmedBooking.id);
    expect(co.txnRef).toContain('.ADD_ON.');

    // 6. Callback mock thanh toán thành công
    const cbRes = await payments.handleMockCallback({
      txnRef: co.txnRef,
      amount: String(co.amount),
    });
    expect(cbRes.redirectUrl).toContain('status=SUCCESS');
    // PA(chốt A): redirect phải mang type để FE trang kết quả phân biệt ADD_ON.
    expect(cbRes.redirectUrl).toContain('type=ADD_ON');

    // 7. Kiểm tra Payment record được tạo
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { txnRef: co.txnRef },
    });
    expect(payment.type).toBe(PaymentType.ADD_ON);
    expect(payment.amount).toBe(85_000);
    expect(payment.status).toBe(PaymentStatus.PAID);
    expect(payment.bookingId).toBe(confirmedBooking.id);

    // 8. Sau khi trả, unpaidAmount về 0; checkout tiếp -> NO_UNPAID_ADDONS
    const checkAfterPaid = await venueServices.listBookingAddOns(cust1, confirmedBooking.id);
    expect(checkAfterPaid.paidAmount).toBe(85_000);
    expect(checkAfterPaid.unpaidAmount).toBe(0);

    await expect(
      venueServices.createAddonCheckout(cust1, confirmedBooking.id),
    ).rejects.toMatchObject({ response: { code: 'NO_UNPAID_ADDONS' } });

    // 9. Callback gọi lại với cùng txnRef -> idempotent không tạo duplicate
    const cbRetry = await payments.handleMockCallback({
      txnRef: co.txnRef,
      amount: String(co.amount),
    });
    expect(cbRetry.redirectUrl).toContain('status=SUCCESS');
    expect(cbRetry.redirectUrl).toContain('type=ADD_ON'); // nhánh replay vẫn giữ type
    const paymentCount = await prisma.payment.count({ where: { txnRef: co.txnRef } });
    expect(paymentCount).toBe(1);

    // 10. Khách gọi thêm 1 quả bóng nữa (40k) -> unpaidAmount thành 40k, checkout tiếp được
    const moreAddon = await venueServices.addBookingAddOns(cust1, confirmedBooking.id, {
      items: [{ serviceId: ball.id, quantity: 1 }],
    });
    expect(moreAddon.totalCost).toBe(125_000);
    expect(moreAddon.paidAmount).toBe(85_000);
    expect(moreAddon.unpaidAmount).toBe(40_000);

    const co2 = await venueServices.createAddonCheckout(cust1, confirmedBooking.id);
    expect(co2.amount).toBe(40_000);

    // Sai số tiền callback bị chặn
    await expect(
      payments.handleMockCallback({ txnRef: co2.txnRef, amount: '1000' }),
    ).rejects.toMatchObject({ response: { code: 'PAYMENT_AMOUNT_MISMATCH' } });
  });

  it('Ràng buộc bảo mật: không thêm dịch vụ của sân khác hoặc dịch vụ đã tắt', async () => {
    if (!dbUp) return;

    // Dịch vụ của sân B
    const svcB = await venueServices.createService(ownerB, venueBId, {
      name: 'Nước tăng lực sân B',
      price: 20_000,
      type: VenueServiceType.BEVERAGE,
      isAvailable: true,
    });

    // Dịch vụ của sân A nhưng bị tắt
    const svcAOff = await venueServices.createService(ownerA, venueAId, {
      name: 'Dịch vụ đã hết hàng',
      price: 50_000,
      type: VenueServiceType.OTHER,
      isAvailable: false,
    });

    // Booking trên sân A của cust2
    const hold = (await bookings.createHold(
      { id: cust2.id },
      { courtId: courtAId, date: dateIn(3), slots: [720] },
    )) as { holdId: string };

    const booking = await bookings.confirmFromHold(hold.holdId, {
      txnRef: `itsvc-sec-${hold.holdId}`,
      amountPaid: 100_000,
    });

    // 1. Thêm dịch vụ của sân B vào booking sân A -> bị chặn
    await expect(
      venueServices.addBookingAddOns(cust2, booking.id, {
        items: [{ serviceId: svcB.id, quantity: 1 }],
      }),
    ).rejects.toMatchObject({ response: { code: 'SERVICE_NOT_FOUND' } });

    // 2. Thêm dịch vụ đã tắt -> bị chặn
    await expect(
      venueServices.addBookingAddOns(cust2, booking.id, {
        items: [{ serviceId: svcAOff.id, quantity: 1 }],
      }),
    ).rejects.toMatchObject({ response: { code: 'SERVICE_UNAVAILABLE' } });

    // 3. User khác (cust1) không thể xem hoặc thêm addon vào booking của cust2
    await expect(venueServices.listBookingAddOns(cust1, booking.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    await expect(venueServices.createAddonCheckout(cust1, booking.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('MAJOR-B: 2 callback song song khác txnRef cùng booking -> tổng PAID đúng unpaidAmount', async () => {
    if (!dbUp) return;

    // Booking CONFIRMED mới của cust1 + addon 55k (1 nước 15k + 1 bóng 40k)
    const waterRace = await venueServices.createService(ownerA, venueAId, {
      name: 'Nước race',
      price: 15_000,
      type: VenueServiceType.BEVERAGE,
      isAvailable: true,
    });
    const ballRace = await venueServices.createService(ownerA, venueAId, {
      name: 'Bóng race',
      price: 40_000,
      type: VenueServiceType.EQUIPMENT,
      isAvailable: true,
    });

    const hold = (await bookings.createHold(
      { id: cust1.id },
      { courtId: courtAId, date: dateIn(5), slots: [840] },
    )) as { holdId: string };
    const raceBooking = await bookings.confirmFromHold(hold.holdId, {
      txnRef: `itsvc-race-${hold.holdId}`,
      amountPaid: 100_000,
      paidInFull: false,
    });
    expect(raceBooking.status).toBe('CONFIRMED');

    await venueServices.addBookingAddOns(cust1, raceBooking.id, {
      items: [
        { serviceId: waterRace.id, quantity: 1 },
        { serviceId: ballRace.id, quantity: 1 },
      ],
    }); // 15k + 40k = 55k

    // Hai checkout SONG SONG trước khi trả -> 2 txnRef khác nhau, cùng amount 55k
    const [coA, coB] = await Promise.all([
      venueServices.createAddonCheckout(cust1, raceBooking.id),
      venueServices.createAddonCheckout(cust1, raceBooking.id),
    ]);
    expect(coA.amount).toBe(55_000);
    expect(coB.amount).toBe(55_000);
    expect(coA.txnRef).not.toBe(coB.txnRef);

    // Hai callback về gần như đồng thời (khác txnRef nên không dính idempotency UNIQUE)
    const results = await Promise.allSettled([
      payments.handleMockCallback({ txnRef: coA.txnRef, amount: String(coA.amount) }),
      payments.handleMockCallback({ txnRef: coB.txnRef, amount: String(coB.amount) }),
    ]);

    // Đúng 1 giao dịch được ghi; giao dịch thừa bị từ chối an toàn PAYMENT_ADDON_OVERPAID
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    expect(fulfilled).toHaveLength(1);
    for (const r of fulfilled) {
      expect((r as PromiseFulfilledResult<{ redirectUrl: string }>).value.redirectUrl).toContain(
        'status=SUCCESS',
      );
    }
    expect(rejected).toHaveLength(1);
    expect((rejected[0].reason as { response?: { code?: string } }).response?.code).toBe(
      'PAYMENT_ADDON_OVERPAID',
    );

    // Tổng PAID trong DB đúng bằng unpaidAmount, KHÔNG vượt tổng tiền dịch vụ
    const paidRows = await prisma.payment.findMany({
      where: { bookingId: raceBooking.id, type: PaymentType.ADD_ON, status: PaymentStatus.PAID },
      select: { amount: true },
    });
    expect(paidRows.reduce((sum, p) => sum + p.amount, 0)).toBe(55_000);

    // unpaidAmount về 0 sau khi guard chặn giao dịch thừa
    const after = await venueServices.listBookingAddOns(cust1, raceBooking.id);
    expect(after.paidAmount).toBe(55_000);
    expect(after.unpaidAmount).toBe(0);
  });
});
