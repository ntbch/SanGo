/**
 * CourtHub — seed dữ liệu demo đẹp (đặc tả §9).
 *
 * Chạy: pnpm --filter @courthub/api db:seed
 * Dữ liệu: reset toàn bộ rồi tạo lại (deterministic cho demo/đồ án):
 *  - 3 venue APPROVED (2 Hà Nội, 1 TP.HCM)
 *  - 10 court phủ đủ 5 sportType
 *  - Pricing rules ngày thường / cuối tuần hợp lý
 *  - Booking mẫu đủ trạng thái + Payment + Review + BookingHold
 *  - 3 tài khoản demo (mật khẩu in rõ ở cuối log)
 */
import { PrismaClient, type SportType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Mật khẩu dùng chung của 3 tài khoản demo — in rõ khi seed theo yêu cầu. */
export const DEMO_PASSWORD = 'Courthub@2026';

/** Ngày hôm nay theo giờ Việt Nam (UTC+7), dạng YYYY-MM-DD. */
function vnToday(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Cộng/trừ n ngày trên chuỗi YYYY-MM-DD. */
function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Chuỗi ngày -> Date UTC-midnight để lưu cột DATE (xem schema.prisma). */
function toDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

function formatCodeDate(isoDate: string): string {
  return isoDate.replaceAll('-', '');
}

/** Làm tròn giá về bội số 1000 VND cho đẹp. */
function roundPrice(vnd: number): number {
  return Math.round(vnd / 1000) * 1000;
}

interface CourtSpec {
  name: string;
  sportType: SportType;
  slotMinutes: 60 | 90;
  defaultPricePerSlot: number;
  status?: 'ACTIVE' | 'MAINTENANCE';
}

interface VenueSpec {
  name: string;
  slug: string;
  address: string;
  lat: number;
  lng: number;
  openMinute: number;
  closeMinute: number;
  depositPercent: number;
  amenities: string[];
  images: string[];
  courts: CourtSpec[];
}

async function main() {
  console.log('🧹 Dọn dữ liệu cũ...');
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.bookingHold.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.court.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Tạo tài khoản demo...');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  await prisma.user.create({
    data: {
      email: 'admin@courthub.vn',
      passwordHash,
      fullName: 'Nguyễn Quản Trị',
      phone: '0900000001',
      role: 'ADMIN',
    },
  });
  const owner = await prisma.user.create({
    data: {
      email: 'owner@courthub.vn',
      passwordHash,
      fullName: 'Trần Văn Chủ Sân',
      phone: '0900000002',
      role: 'OWNER',
    },
  });
  const customer = await prisma.user.create({
    data: {
      email: 'customer@courthub.vn',
      passwordHash,
      fullName: 'Lê Thị Khách Hàng',
      phone: '0900000003',
      role: 'CUSTOMER',
    },
  });

  console.log('🏟️  Tạo 3 venue APPROVED (2 Hà Nội, 1 TP.HCM)...');
  const venueSpecs: VenueSpec[] = [
    {
      name: 'Sân thể thao Ngọc Khánh',
      slug: 'san-the-thao-ngoc-khanh',
      address: 'Số 12 Nguyễn Chí Thanh, Đống Đa, Hà Nội',
      lat: 21.0283,
      lng: 105.8342,
      openMinute: 360, // 06:00
      closeMinute: 1410, // 23:30
      depositPercent: 30,
      amenities: ['Phòng thay đồ', 'Bãi xe miễn phí', 'Nước uống miễn phí', 'Wifi'],
      images: [
        'https://picsum.photos/seed/courthub-ngoc-khanh-1/800/500',
        'https://picsum.photos/seed/courthub-ngoc-khanh-2/800/500',
      ],
      courts: [
        {
          name: 'Sân bóng đá 5 người A',
          sportType: 'FOOTBALL5',
          slotMinutes: 60,
          defaultPricePerSlot: 400_000,
        },
        {
          name: 'Sân bóng đá 5 người B',
          sportType: 'FOOTBALL5',
          slotMinutes: 60,
          defaultPricePerSlot: 400_000,
        },
        {
          name: 'Sân Pickleball trong nhà',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 120_000,
        },
      ],
    },
    {
      name: 'Trung tâm cầu lông & Pickleball Hoàng Mai',
      slug: 'cau-long-pickleball-hoang-mai',
      address: 'KĐT Linh Đàm, Hoàng Mai, Hà Nội',
      lat: 20.9845,
      lng: 105.8541,
      openMinute: 360, // 06:00
      closeMinute: 1380, // 23:00
      depositPercent: 25,
      amenities: ['Phòng thay đồ', 'Bãi xe có mái che', 'Thuê vợt/cầu'],
      images: [
        'https://picsum.photos/seed/courthub-hoang-mai-1/800/500',
        'https://picsum.photos/seed/courthub-hoang-mai-2/800/500',
      ],
      courts: [
        {
          name: 'Sân cầu lông 1',
          sportType: 'BADMINTON',
          slotMinutes: 60,
          defaultPricePerSlot: 90_000,
        },
        {
          name: 'Sân cầu lông 2',
          sportType: 'BADMINTON',
          slotMinutes: 60,
          defaultPricePerSlot: 90_000,
        },
        {
          name: 'Sân bóng đá 7 người',
          sportType: 'FOOTBALL7',
          slotMinutes: 90,
          defaultPricePerSlot: 800_000,
        },
        {
          name: 'Sân Pickleball ngoài trời',
          sportType: 'PICKLEBALL',
          slotMinutes: 60,
          defaultPricePerSlot: 100_000,
          status: 'MAINTENANCE',
        },
      ],
    },
    {
      name: 'Tổng hợp thể thao Phú Thọ',
      slug: 'tong-hop-the-thao-phu-tho',
      address: '221 Lý Thường Kiệt, Quận 11, TP. Hồ Chí Minh',
      lat: 10.7626,
      lng: 106.673,
      openMinute: 330, // 05:30
      closeMinute: 1320, // 22:00
      depositPercent: 30,
      amenities: ['Phòng thay đồ', 'Bãi xe giữ xe', 'Ghim bóng miễn phí'],
      images: [
        'https://picsum.photos/seed/courthub-phu-tho-1/800/500',
        'https://picsum.photos/seed/courthub-phu-tho-2/800/500',
      ],
      courts: [
        {
          name: 'Sân Tennis số 1',
          sportType: 'TENNIS',
          slotMinutes: 90,
          defaultPricePerSlot: 300_000,
        },
        {
          name: 'Sân Tennis số 2',
          sportType: 'TENNIS',
          slotMinutes: 90,
          defaultPricePerSlot: 300_000,
        },
        {
          name: 'Sân bóng đá 5 người',
          sportType: 'FOOTBALL5',
          slotMinutes: 60,
          defaultPricePerSlot: 350_000,
        },
      ],
    },
  ];

  const createdCourts: { id: string; spec: CourtSpec }[] = [];
  for (const spec of venueSpecs) {
    const venue = await prisma.venue.create({
      data: {
        ownerId: owner.id,
        name: spec.name,
        slug: spec.slug,
        address: spec.address,
        lat: spec.lat,
        lng: spec.lng,
        openMinute: spec.openMinute,
        closeMinute: spec.closeMinute,
        images: spec.images,
        amenities: spec.amenities,
        depositPercent: spec.depositPercent,
        status: 'APPROVED',
      },
    });

    for (const courtSpec of spec.courts) {
      const court = await prisma.court.create({
        data: {
          venueId: venue.id,
          name: courtSpec.name,
          sportType: courtSpec.sportType,
          slotMinutes: courtSpec.slotMinutes,
          defaultPricePerSlot: courtSpec.defaultPricePerSlot,
          status: courtSpec.status ?? 'ACTIVE',
        },
      });
      createdCourts.push({ id: court.id, spec: courtSpec });

      // Bảng giá ghi đè: tối ưu giá khung cao điểm + cuối tuần (đặc tả §3.3).
      const base = courtSpec.defaultPricePerSlot;
      const rules = [
        // Ngày thường tối 17:00–22:00 đắt hơn 30%
        {
          dayType: 'WEEKDAY' as const,
          startMinute: 1020,
          endMinute: 1320,
          pricePerSlot: roundPrice(base * 1.3),
        },
        // Cuối tuần ban ngày +15%
        {
          dayType: 'WEEKEND' as const,
          startMinute: 330,
          endMinute: 1020,
          pricePerSlot: roundPrice(base * 1.15),
        },
        // Cuối tuần tối +40%
        {
          dayType: 'WEEKEND' as const,
          startMinute: 1020,
          endMinute: 1320,
          pricePerSlot: roundPrice(base * 1.4),
        },
      ];
      for (const rule of rules) {
        await prisma.pricingRule.create({ data: { courtId: court.id, ...rule } });
      }
    }
  }

  const football5A = createdCourts[0];
  const pickleballIndoor = createdCourts[2];
  const badminton1 = createdCourts[3];
  const football7 = createdCourts[5];
  const tennis1 = createdCourts[7];

  console.log('📅 Tạo booking mẫu đủ trạng thái + payment/review...');
  const today = vnToday();
  const depositOf = (subtotal: number, percent: number) => roundPrice((subtotal * percent) / 100);

  interface BookingSeed {
    court: { id: string };
    dateOffset: number;
    startMinute: number;
    endMinute: number;
    subtotal: number;
    depositPercent: number;
    status: 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    method?: 'VNPAY' | 'MOCK';
    refund?: number;
    publicMatch?: { slotsNeeded: number; matchFull: boolean };
    review?: { rating: number; comment: string };
  }

  // Mỗi đơn một ngày khác nhau -> NNNN trong mã đơn luôn là 0001, dễ đọc.
  const bookingSeeds: BookingSeed[] = [
    {
      // Sắp tới: đã xác nhận chờ chơi, ghép trận mở còn 2 chỗ
      court: football5A,
      dateOffset: 2,
      startMinute: 1080, // 18:00
      endMinute: 1200, // 20:00
      subtotal: 800_000,
      depositPercent: 30,
      status: 'CONFIRMED',
      method: 'VNPAY',
      publicMatch: { slotsNeeded: 4, matchFull: false },
    },
    {
      // Hôm nay: khách đã check-in
      court: badminton1,
      dateOffset: 0,
      startMinute: 420, // 07:00
      endMinute: 480, // 08:00
      subtotal: 180_000,
      depositPercent: 25,
      status: 'CHECKED_IN',
      method: 'MOCK',
    },
    {
      // 3 ngày trước: hoàn thành + đánh giá 5 sao
      court: tennis1,
      dateOffset: -3,
      startMinute: 360, // 06:00
      endMinute: 450, // 07:30
      subtotal: 600_000,
      depositPercent: 30,
      status: 'COMPLETED',
      method: 'VNPAY',
      review: { rating: 5, comment: 'Sân đẹp, mặt sân mới, nhân viên thân thiện. Sẽ đặt lại!' },
    },
    {
      // 7 ngày trước: hoàn thành + đánh giá 4 sao
      court: pickleballIndoor,
      dateOffset: -7,
      startMinute: 1140, // 19:00
      endMinute: 1200, // 20:00
      subtotal: 160_000,
      depositPercent: 30,
      status: 'COMPLETED',
      method: 'VNPAY',
      review: { rating: 4, comment: 'Sân trong nhà mát, đèn sáng. Giờ cao điểm hơi đông.' },
    },
    {
      // Hủy sớm hơn 24h -> hoàn cọc 100%
      court: football7,
      dateOffset: 5,
      startMinute: 1020, // 17:00
      endMinute: 1110, // 18:30
      subtotal: 1_200_000,
      depositPercent: 25,
      status: 'CANCELLED',
      method: 'VNPAY',
      refund: 1.0,
    },
    {
      // 5 ngày trước: không đến -> NO_SHOW, mất cọc
      court: football5A,
      dateOffset: -5,
      startMinute: 900, // 15:00
      endMinute: 960, // 16:00
      subtotal: 400_000,
      depositPercent: 30,
      status: 'NO_SHOW',
      method: 'VNPAY',
    },
  ];

  let seq = 1;
  for (const bs of bookingSeeds) {
    const isoDate = addDays(today, bs.dateOffset);
    const depositAmount = depositOf(bs.subtotal, bs.depositPercent);
    const booking = await prisma.booking.create({
      data: {
        code: `CH-${formatCodeDate(isoDate)}-${String(seq).padStart(4, '0')}`,
        customerId: customer.id,
        courtId: bs.court.id,
        date: toDate(isoDate),
        startMinute: bs.startMinute,
        endMinute: bs.endMinute,
        subtotal: bs.subtotal,
        depositAmount,
        status: bs.status,
        cancelledAt: bs.status === 'CANCELLED' ? new Date(Date.now() - 36 * 60 * 60 * 1000) : null,
        cancelReason: bs.status === 'CANCELLED' ? 'Khách báo bận, hủy trước hơn 24 giờ' : null,
        isPublicMatch: bs.publicMatch ? true : null,
        slotsNeeded: bs.publicMatch?.slotsNeeded ?? null,
        matchFull: bs.publicMatch?.matchFull ?? null,
      },
    });
    seq += 1;

    // Payment DEPOSIT đã trả cho mọi đơn không bị hủy trước khi trả; đơn CANCELLED kèm REFUND.
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: depositAmount,
        type: 'DEPOSIT',
        method: bs.method ?? 'VNPAY',
        txnRef: `${booking.code}-DEPOSIT`,
        status: 'PAID',
        paidAt: new Date(Date.now() + (bs.dateOffset - 1) * 24 * 60 * 60 * 1000),
        rawPayload: { vnp_ResponseCode: '00', vnp_TmnCode: 'COURTHUB_DEMO' },
      },
    });
    if (bs.refund && bs.refund > 0) {
      const refundAmount = depositOf(bs.subtotal * bs.refund, bs.depositPercent);
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: refundAmount,
          type: 'REFUND',
          method: bs.method ?? 'VNPAY',
          txnRef: `${booking.code}-REFUND`,
          status: 'PAID',
          paidAt: new Date(),
          rawPayload: { note: 'Hoàn 100% cọc vì hủy trước hơn 24 giờ' },
        },
      });
    }
    if (bs.review) {
      await prisma.review.create({
        data: {
          bookingId: booking.id,
          venueId: (
            await prisma.court.findUniqueOrThrow({
              where: { id: booking.courtId },
              select: { venueId: true },
            })
          ).venueId,
          customerId: customer.id,
          rating: bs.review.rating,
          comment: bs.review.comment,
        },
      });
    }
  }

  console.log('⏳ Tạo BookingHold mẫu (1 ACTIVE sắp hết hạn, 1 EXPIRED)...');
  await prisma.bookingHold.create({
    data: {
      userId: customer.id,
      courtId: football5A.id,
      date: toDate(addDays(today, 2)),
      startMinute: 1200, // 20:00–21:00 ngay sau đơn CONFIRMED cùng ngày
      endMinute: 1260,
      subtotal: 520_000, // giá cao điểm tối ngày thường của sân bóng 5 (+30%)
      expiresAt: new Date(Date.now() + 9 * 60 * 1000),
      status: 'ACTIVE',
    },
  });
  await prisma.bookingHold.create({
    data: {
      userId: customer.id,
      courtId: badminton1.id,
      date: toDate(addDays(today, 1)),
      startMinute: 720,
      endMinute: 780,
      subtotal: 104_000, // giá cuối tuần ban ngày của sân cầu lông
      expiresAt: new Date(Date.now() - 60 * 60 * 1000),
      status: 'EXPIRED',
    },
  });

  console.log('');
  console.log('✅ Seed xong! Tóm tắt:');
  console.log(`   - Users: ${await prisma.user.count()} (admin/owner/customer)`);
  console.log(`   - Venues: ${await prisma.venue.count()} (đều APPROVED)`);
  console.log(
    `   - Courts: ${await prisma.court.count()} | PricingRules: ${await prisma.pricingRule.count()}`,
  );
  console.log(
    `   - Bookings: ${await prisma.booking.count()} | Payments: ${await prisma.payment.count()} | Reviews: ${await prisma.review.count()} | Holds: ${await prisma.bookingHold.count()}`,
  );
  console.log('');
  console.log('🔑 TÀI KHOẢN DEMO — mật khẩu dùng chung cho cả 3: ' + DEMO_PASSWORD);
  console.log('   admin@courthub.vn    (ADMIN)');
  console.log('   owner@courthub.vn    (OWNER — sở hữu cả 3 venue)');
  console.log('   customer@courthub.vn (CUSTOMER — chủ các đơn mẫu)');
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
