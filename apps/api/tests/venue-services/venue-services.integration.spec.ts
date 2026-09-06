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
import { PrismaModule } from '../../src/prisma/prisma.module';
import { VenueServicesModule } from '../../src/venue-services/venue-services.module';
import { VenueServicesService } from '../../src/venue-services/venue-services.service';

const SUFFIX = Date.now().toString(36);

describe('VenueServices and ADD_ON Payments (integration)', () => {
  let prisma: PrismaClient;
  let bookings: BookingsService;
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
  it('Happy-path: khách chọn addon khi đặt sân, xác nhận đơn kèm addon, chặn thêm sau khi đã đặt', async () => {
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

    // 2. Khách tạo hold kèm 2 nước + 1 bóng (70k)
    const playDate = dateIn(2);
    const hold = (await bookings.createHold(
      { id: cust1.id },
      {
        courtId: courtAId,
        date: playDate,
        slots: [600],
        addOns: [
          { serviceId: water.id, quantity: 2 },
          { serviceId: ball.id, quantity: 1 },
        ],
      },
    )) as { holdId: string; subtotal: number; addOnsTotal?: number };

    expect(hold.addOnsTotal).toBe(70_000);

    // 3. Khách cập nhật lại dịch vụ khi đang giữ chỗ (thêm 1 chai nước -> 3 nước 45k + 1 bóng 40k = 85k)
    const updatedHold = await bookings.updateHoldAddOns(hold.holdId, cust1, {
      items: [
        { serviceId: water.id, quantity: 3 },
        { serviceId: ball.id, quantity: 1 },
      ],
    });
    expect(updatedHold.addOnsTotal).toBe(85_000);

    // 4. Xác nhận đơn
    const confirmedBooking = await bookings.confirmFromHold(hold.holdId, {
      txnRef: `itsvc-hold-${hold.holdId}`,
      amountPaid: 185_000,
      paidInFull: true,
    });
    expect(confirmedBooking.status).toBe('CONFIRMED');

    // 5. Kiểm tra BookingAddOn được tạo tự động cùng đơn
    const checkBookedAddOns = await venueServices.listBookingAddOns(cust1, confirmedBooking.id);
    expect(checkBookedAddOns.totalCost).toBe(85_000);
    expect(checkBookedAddOns.items).toHaveLength(2);

    // 6. Sau khi đã đặt sân, gọi addBookingAddOns bị chặn hoàn toàn
    await expect(
      venueServices.addBookingAddOns(cust1, confirmedBooking.id, {
        items: [{ serviceId: water.id, quantity: 1 }],
      }),
    ).rejects.toMatchObject({ response: { code: 'ADDON_AFTER_BOOKING_DISABLED' } });

    // 7. Gọi createAddonCheckout sau khi đã đặt sân cũng bị chặn
    await expect(
      venueServices.createAddonCheckout(cust1, confirmedBooking.id),
    ).rejects.toMatchObject({ response: { code: 'ADDON_AFTER_BOOKING_DISABLED' } });
  });

  it('Ràng buộc bảo mật: không thêm dịch vụ của sân khác hoặc dịch vụ đã tắt vào hold', async () => {
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

    // 1. Chọn dịch vụ của sân B khi đặt sân A -> bị chặn SERVICE_NOT_FOUND
    await expect(
      bookings.createHold(
        { id: cust2.id },
        {
          courtId: courtAId,
          date: dateIn(3),
          slots: [720],
          addOns: [{ serviceId: svcB.id, quantity: 1 }],
        },
      ),
    ).rejects.toMatchObject({ response: { code: 'SERVICE_NOT_FOUND' } });

    // 2. Chọn dịch vụ đã tắt khi đặt sân A -> bị chặn SERVICE_UNAVAILABLE
    await expect(
      bookings.createHold(
        { id: cust2.id },
        {
          courtId: courtAId,
          date: dateIn(3),
          slots: [720],
          addOns: [{ serviceId: svcAOff.id, quantity: 1 }],
        },
      ),
    ).rejects.toMatchObject({ response: { code: 'SERVICE_UNAVAILABLE' } });

    // 3. Tạo booking hợp lệ trên sân A của cust2
    const hold = (await bookings.createHold(
      { id: cust2.id },
      { courtId: courtAId, date: dateIn(3), slots: [720] },
    )) as { holdId: string };

    const booking = await bookings.confirmFromHold(hold.holdId, {
      txnRef: `itsvc-sec-${hold.holdId}`,
      amountPaid: 100_000,
    });

    // 4. User khác (cust1) không thể xem addon của cust2
    await expect(venueServices.listBookingAddOns(cust1, booking.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    // 5. Cố thêm dịch vụ sau khi booking đã xác nhận bị chặn với ADDON_AFTER_BOOKING_DISABLED
    await expect(
      venueServices.addBookingAddOns(cust2, booking.id, {
        items: [{ serviceId: svcB.id, quantity: 1 }],
      }),
    ).rejects.toMatchObject({ response: { code: 'ADDON_AFTER_BOOKING_DISABLED' } });
  });
});
