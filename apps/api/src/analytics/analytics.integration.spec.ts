/**
 * Integration test Owner analytics (task G2-B1) — chạy Postgres THẬT.
 * Seed 2 sân con + 5 đơn đủ trạng thái trong hôm nay, gọi service qua DI thật
 * (PrismaModule + VenuesModule + AnalyticsModule), đối chiếu summary/series/topCourts
 * và ownership (owner khác -> VENUE_FORBIDDEN).
 * Không có DB -> tự bỏ qua để gate vẫn xanh (cùng cơ chế bookings.integration.spec).
 */
import { ForbiddenException } from '@nestjs/common';
import { vnToday } from '@courthub/shared';
import { Test } from '@nestjs/testing';
import { PrismaClient, type User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaModule } from '../prisma/prisma.module';
import { VenuesModule } from '../venues/venues.module';
import { AnalyticsModule } from './analytics.module';
import { AnalyticsService } from './analytics.service';

const SUFFIX = Date.now().toString(36);

describe('Owner analytics trên DB thật (integration)', () => {
  let prisma: PrismaClient;
  let analytics: AnalyticsService;
  let dbUp = false;

  let owner!: User;
  let stranger!: User;
  let venueId!: string;
  let courtA!: string;
  let courtB!: string;

  /** Hôm nay theo UTC — trùng biên của khoảng thống kê nên luôn nằm trong window. */
  // Mốc "hôm nay" theo múi giờ kinh doanh VN — khớp window của buildAnalyticsRange.
  const today = () => new Date(vnToday() + 'T00:00:00.000Z');

  beforeAll(async () => {
    prisma = new PrismaClient();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbUp = true;
    } catch {
      console.warn('[integration] Không có Postgres -> bỏ qua analytics integration');
      return;
    }

    const hash = await bcrypt.hash('IntegrationPass1!', 4);
    owner = await prisma.user.create({
      data: {
        email: `itan-owner-${SUFFIX}@courthub.vn`,
        passwordHash: hash,
        fullName: 'Chủ Sân IT',
        role: 'OWNER',
      },
    });
    stranger = await prisma.user.create({
      data: {
        email: `itan-stranger-${SUFFIX}@courthub.vn`,
        passwordHash: hash,
        fullName: 'Người Lạ IT',
        role: 'OWNER',
      },
    });
    const venue = await prisma.venue.create({
      data: {
        ownerId: owner.id,
        name: `IT Analytics Venue ${SUFFIX}`,
        slug: `itan-${SUFFIX}`,
        address: '1 Đường test',
        lat: 10.762622,
        lng: 106.660172,
        openMinute: 360,
        closeMinute: 1320,
        images: [],
        amenities: [],
        status: 'APPROVED',
      },
    });
    venueId = venue.id;
    const courtARec = await prisma.court.create({
      data: {
        venueId,
        name: 'Sân A',
        sportType: 'FOOTBALL5',
        slotMinutes: 90,
        defaultPricePerSlot: 200_000,
      },
    });
    courtA = courtARec.id;
    const courtBRec = await prisma.court.create({
      data: {
        venueId,
        name: 'Sân B',
        sportType: 'FOOTBALL7',
        slotMinutes: 90,
        defaultPricePerSlot: 300_000,
      },
    });
    courtB = courtBRec.id;

    const mkBooking = (
      n: number,
      courtId: string,
      status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
      depositAmount: number,
    ) =>
      prisma.booking.create({
        data: {
          code: `CH-ITAN-${SUFFIX}-${n}`,
          customerId: owner.id,
          courtId,
          date: today(),
          startMinute: 360 + n * 90,
          endMinute: 450 + n * 90,
          subtotal: depositAmount * 3,
          depositAmount,
          status,
        },
      });

    await Promise.all([
      mkBooking(0, courtA, 'COMPLETED', 100_000),
      mkBooking(1, courtA, 'COMPLETED', 120_000),
      mkBooking(2, courtA, 'CANCELLED', 50_000),
      mkBooking(3, courtB, 'CONFIRMED', 300_000),
      mkBooking(4, courtB, 'NO_SHOW', 70_000),
    ]);

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, VenuesModule, AnalyticsModule],
    }).compile();
    analytics = moduleRef.get(AnalyticsService);
  });

  afterAll(async () => {
    if (!dbUp) return;
    // Xóa con trước cha: booking -> court -> venue -> user (prefix email itan- riêng).
    await prisma.booking.deleteMany({ where: { code: { startsWith: `CH-ITAN-${SUFFIX}-` } } });
    await prisma.court.deleteMany({ where: { venueId } });
    await prisma.venue.deleteMany({ where: { id: venueId } });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [`itan-owner-${SUFFIX}@courthub.vn`, `itan-stranger-${SUFFIX}@courthub.vn`],
        },
      },
    });
    await prisma.$disconnect();
  });

  it('tổng hợp đúng doanh thu xác nhận / tổng đơn / tỷ lệ hủy-no-show', async () => {
    if (!dbUp) return console.warn('[integration] skip');
    const res = await analytics.getOwnerAnalytics(
      { id: owner.id, role: 'OWNER' },
      venueId,
      3, // days=3 để kiểm chứng zero-fill các ngày không có đơn
    );
    expect(res.meta).toMatchObject({
      venueId,
      venueName: `IT Analytics Venue ${SUFFIX}`,
      days: 3,
    });
    expect(res.summary).toEqual({
      revenueConfirmed: 520_000, // 100k + 120k + 300k; bỏ CANCELLED 50k và NO_SHOW 70k
      totalBookings: 5,
      cancelledCount: 1,
      noShowCount: 1,
      cancelRate: 0.4,
    });
    expect(res.series).toHaveLength(3);
    expect(res.series[2]).toEqual({
      date: today().toISOString().slice(0, 10),
      bookings: 5,
      revenue: 520_000,
    });
    expect(res.series[0]).toEqual({ date: res.series[0].date, bookings: 0, revenue: 0 });
    expect(res.topCourts).toEqual([
      { courtId: courtA, courtName: 'Sân A', bookings: 3, revenue: 220_000 },
      { courtId: courtB, courtName: 'Sân B', bookings: 2, revenue: 300_000 },
    ]);
  });

  it('chủ sân khác truy cập -> ForbiddenException VENUE_FORBIDDEN', async () => {
    if (!dbUp) return console.warn('[integration] skip');
    await expect(
      analytics.getOwnerAnalytics({ id: stranger.id, role: 'OWNER' }, venueId, 30),
    ).rejects.toThrow(ForbiddenException);
  });
});
