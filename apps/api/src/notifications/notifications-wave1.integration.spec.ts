/**
 * Integration test F8 wave-1 — Postgres thật, tự bỏ qua khi không có DB.
 * Phủ: dispatchBroadcast best-effort cho nhiều user; unreadCount; producer
 * VOUCHER từ luồng áp mã ghi đúng enum type mới.
 */
import { Test } from '@nestjs/testing';
import { BookingHoldStatus, PrismaClient, SportType, type User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { NotificationType } from '@courthub/shared';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingsModule } from '../bookings/bookings.module';
import { BookingsService } from '../bookings/bookings.service';
import { VouchersModule } from '../vouchers/vouchers.module';
import { VouchersService } from '../vouchers/vouchers.service';
import { ConsoleMailer } from './mailer/console.mailer';
import { NotifyService } from './notify.service';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

const SUFFIX = Date.now().toString(36);

describe('Notifications wave-1 (integration)', () => {
  let prisma: PrismaClient;
  let notify: NotifyService;
  let notifications: NotificationsService;
  let dbUp = false;

  let cust1!: User;
  let cust2!: User;
  let cust3!: User;

  beforeAll(async () => {
    prisma = new PrismaClient();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbUp = true;
    } catch {
      console.warn('[integration] Không có Postgres -> bỏ qua notifications wave-1');
      return;
    }
    const hash = await bcrypt.hash('IntegrationPass1!', 4);
    const mk = (email: string, fullName: string) =>
      prisma.user.create({
        data: { email, passwordHash: hash, fullName, role: 'CUSTOMER' },
      });
    cust1 = await mk(`itn1-${SUFFIX}@courthub.vn`, 'N1 Cust');
    cust2 = await mk(`itn2-${SUFFIX}@courthub.vn`, 'N2 Cust');
    cust3 = await mk(`itn3-${SUFFIX}@courthub.vn`, 'N3 Cust');

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, BookingsModule, VouchersModule],
    }).compile();
    notifications = moduleRef.get(NotificationsService);
    const prismaSvc = moduleRef.get(PrismaService);
    notify = new NotifyService(prismaSvc as never, new ConsoleMailer());
  });

  afterAll(async () => {
    if (dbUp) {
      const ids = [cust1?.id, cust2?.id, cust3?.id].filter(Boolean);
      await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
      await prisma.voucherRedemption.deleteMany({ where: { userId: { in: ids } } });
      await prisma.voucherRedemption.deleteMany({
        where: { voucher: { code: { contains: SUFFIX } } },
      });
      await prisma.voucher.deleteMany({ where: { code: { contains: SUFFIX } } });
      await prisma.bookingHold.deleteMany({ where: { userId: { in: ids } } });
      const owned = await prisma.venue.findMany({
        where: { ownerId: { in: ids } },
        select: { id: true },
      });
      const venueIds = owned.map((v) => v.id);
      await prisma.pricingRule.deleteMany({ where: { court: { venueId: { in: venueIds } } } });
      await prisma.court.deleteMany({ where: { venueId: { in: venueIds } } });
      await prisma.venue.deleteMany({ where: { id: { in: venueIds } } });
      // owner tạo voucher qua VouchersModule test cũng nằm trong ids
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
  });

  it('dispatchBroadcast: gửi đủ N user, dedup, best-effort với id lạ', async () => {
    if (!dbUp) return;
    const res = await notify.dispatchBroadcast(
      [cust1.id, cust2.id, cust2.id, '00000000-0000-4000-8000-000000000000'],
      {
        type: NotificationType.WALLET,
        title: 'Hoàn tiền vào ví',
        body: 'Đơn của bạn đã bị hủy do thời tiết xấu.',
      },
    );
    expect(res.created).toBe(2); // dedup cust2, id lạ bị skip
    expect(res.skipped).toBe(1);
    const types = await prisma.notification.findMany({
      where: { userId: { in: [cust1.id, cust2.id] }, type: 'WALLET' },
    });
    expect(types.length).toBe(2);
  });

  it('unreadCount: chỉ đếm thông báo chưa đọc', async () => {
    if (!dbUp) return;
    await notify.dispatchBroadcast([cust3.id, cust3.id], {
      type: NotificationType.TEAM,
      title: 'Lời mời vào đội',
      body: 'Bạn được mời tham gia đội.',
    });
    const before = await notifications.unreadCount(cust3.id);
    expect(before.count).toBe(1); // dedup [cust3, cust3] -> đúng 1 thông báo
    const mine = await notifications.list(cust3.id, 1);
    const teamNotifs = mine.items.filter((n) => n.type === 'TEAM');
    for (const n of teamNotifs) await notifications.markRead(cust3.id, n.id);
    const after = await notifications.unreadCount(cust3.id);
    expect(after.count).toBe(before.count - teamNotifs.length);
  });

  it('áp voucher thành công -> thông báo type VOUCHER cho khách', async () => {
    if (!dbUp) return;
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, BookingsModule, VouchersModule],
    }).compile();
    const bookings = moduleRef.get(BookingsService);
    const vouchers = moduleRef.get(VouchersService);

    // Owner + venue + court tối giản
    const hash = await bcrypt.hash('IntegrationPass1!', 4);
    const owner = await prisma.user.create({
      data: {
        email: `itn-owner-${SUFFIX}@courthub.vn`,
        passwordHash: hash,
        fullName: 'N1 Owner',
        role: 'OWNER',
      },
    });
    const venue = await prisma.venue.create({
      data: {
        name: 'Itest-Notif Venue ' + SUFFIX,
        slug: 'itn-' + SUFFIX,
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
        name: 'Itest-Notif Court',
        venueId: venue.id,
        sportType: SportType.FOOTBALL5,
        slotMinutes: 60,
        defaultPricePerSlot: 200_000,
      },
    });
    try {
      const holdDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
      const v = await vouchers.createVoucher(
        { id: owner.id },
        {
          code: `NOTIFVCH-${SUFFIX}`,
          percentOff: 25,
          dayOfWeek: new Date(holdDate + 'T00:00:00Z').getUTCDay(),
          validFromMinute: 540,
          validToMinute: 960,
          usageLimit: 5,
          perUserLimit: 1,
        },
      );
      const hold = (await bookings.createHold(
        { id: cust1.id },
        {
          courtId: court.id,
          date: holdDate,
          slots: [600],
        },
      )) as { holdId: string };
      const res = await vouchers.applyToHold(
        { id: cust1.id },
        { holdId: hold.holdId, code: v.code },
      );
      expect(res.discountAmount).toBe(50_000);

      const notifs = await prisma.notification.findMany({
        where: { userId: cust1.id, type: 'VOUCHER' },
      });
      expect(notifs.length).toBe(1);
      expect(notifs[0].title).toContain('mã giảm giá');
      // hold đã hết hạn sau apply? không — chỉ đánh dấu để test sau tạo được hold mới
      await prisma.bookingHold.update({
        where: { id: hold.holdId },
        data: { status: BookingHoldStatus.EXPIRED },
      });
    } finally {
      // Thứ tự FK: redemption -> voucher -> hold -> court -> venue -> owner
      await prisma.voucherRedemption
        .deleteMany({ where: { voucher: { code: { contains: SUFFIX } } } })
        .catch(() => undefined);
      await prisma.voucher
        .deleteMany({ where: { code: { contains: SUFFIX } } })
        .catch(() => undefined);
      if (cust1?.id) {
        await prisma.bookingHold.deleteMany({ where: { userId: cust1.id } }).catch(() => undefined);
      }
      await prisma.court.delete({ where: { id: court.id } }).catch(() => undefined);
      await prisma.venue.delete({ where: { id: venue.id } }).catch(() => undefined);
      await prisma.user.delete({ where: { id: owner.id } }).catch(() => undefined);
    }
  });
});
