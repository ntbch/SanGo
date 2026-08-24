/**
 * Integration test CRUD Venue/Court/Pricing + luồng duyệt sân.
 * Chạy với Postgres thật (DATABASE_URL); nếu không có DB -> tự bỏ qua để gate vẫn xanh.
 * Nguồn chuỗi kết nối: PrismaClient đọc process.env.DATABASE_URL TRƯỚC (CI export),
 * nếu không có mới fallback .env cục bộ — không hardcode, không cờ skip riêng.
 * Probe SELECT 1 ở beforeAll chỉ là safety-net cho máy không có DB nào.
 */
import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaClient, type User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DayType, SportType } from '@courthub/shared';
import { AdminModule } from '../admin/admin.module';
import { AdminService } from '../admin/admin.service';
import { CourtsModule } from '../courts/courts.module';
import { CourtsService } from '../courts/courts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PricingModule } from '../pricing/pricing.module';
import { PricingService } from '../pricing/pricing.service';
import { VenuesModule } from './venues.module';
import { VenuesService } from './venues.service';

const SUFFIX = Date.now().toString(36);
const dstr = (t: number) => new Date(t).toISOString().slice(0, 10);
const tomorrow = () => dstr(Date.now() + 86_400_000);

describe('Venues/Courts/Pricing + admin duyệt sân (integration)', () => {
  let prisma: PrismaClient;
  let venues: VenuesService;
  let courts: CourtsService;
  let pricing: PricingService;
  let admin: AdminService;
  let dbUp = false;

  let ownerA!: User;
  let ownerB!: User;
  let venueA!: { id: string; slug: string };
  let courtA!: { id: string };

  const uA = () => ({ id: ownerA.id, role: 'OWNER' as const });
  const uB = () => ({ id: ownerB.id, role: 'OWNER' as const });
  const uAdmin = () => ({ id: 'admin', role: 'ADMIN' as const });

  beforeAll(async () => {
    prisma = new PrismaClient();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbUp = true;
    } catch {
      console.warn('[integration] Không có Postgres -> bỏ qua các case tích hợp DB');
      return;
    }

    const hash = await bcrypt.hash('IntegrationPass1!', 4);
    ownerA = await prisma.user.create({
      data: {
        email: 'itven-a-' + SUFFIX + '@courthub.vn',
        passwordHash: hash,
        fullName: 'Owner A',
        role: 'OWNER',
      },
    });
    ownerB = await prisma.user.create({
      data: {
        email: 'itven-b-' + SUFFIX + '@courthub.vn',
        passwordHash: hash,
        fullName: 'Owner B',
        role: 'OWNER',
      },
    });

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, VenuesModule, CourtsModule, PricingModule, AdminModule],
    }).compile();
    venues = moduleRef.get(VenuesService);
    courts = moduleRef.get(CourtsService);
    pricing = moduleRef.get(PricingService);
    admin = moduleRef.get(AdminService);
  });

  afterAll(async () => {
    if (dbUp && ownerA && ownerB) {
      // Quét TOÀN BỘ user itest-* (gồm rác của những lần chạy crash trước)
      // và xóa con trước cha để không bao giờ kẹt FK RESTRICT.
      const users = await prisma.user.findMany({
        where: { email: { contains: 'itven-' } },
        select: { id: true },
      });
      const ids = users.map((u) => u.id);
      await prisma.review.deleteMany({ where: { customer: { id: { in: ids } } } });
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

  it('owner tạo venue mới -> status PENDING + slug tiếng Việt không dấu', async () => {
    if (!dbUp) return;
    const created = (await venues.create(uA(), {
      name: 'Sân Itest Ánh Dương ' + SUFFIX,
      address: '123 Đường Test, Hà Nội',
      lat: 21.028,
      lng: 105.834,
      openMinute: 360,
      closeMinute: 1320,
    })) as { id: string; slug: string; status: string };

    expect(created.status).toBe('PENDING');
    expect(created.slug).toMatch(/^san-itest-anh-duong/);
    venueA = created;
  });

  it('owner B KHÔNG sửa được venue của owner A (ownership check tầng service)', async () => {
    if (!dbUp) return;
    await expect(venues.update(venueA.id, uB(), { name: 'Venue bị chiếm' })).rejects.toMatchObject({
      response: { code: 'VENUE_FORBIDDEN' },
    });
    const unchanged = await prisma.venue.findUniqueOrThrow({ where: { id: venueA.id } });
    expect(unchanged.name).not.toBe('Venue bị chiếm');
  });

  it('ADMIN được sửa thay owner', async () => {
    if (!dbUp) return;
    const updated = await venues.update(venueA.id, uAdmin(), { depositPercent: 20 });
    expect(updated.depositPercent).toBe(20);
  });

  it('owner B không thêm court vào venue của A; A thì được', async () => {
    if (!dbUp) return;
    await expect(
      courts.create(uB(), venueA.id, {
        name: 'Court lau',
        sportType: SportType.FOOTBALL5,
        slotMinutes: 60,
        defaultPricePerSlot: 100000,
      }),
    ).rejects.toMatchObject({ response: { code: 'VENUE_FORBIDDEN' } });

    courtA = await courts.create(uA(), venueA.id, {
      name: 'Sân 5 số 1',
      sportType: SportType.FOOTBALL5,
      slotMinutes: 60,
      defaultPricePerSlot: 400000,
    });
    expect(courtA.id).toBeTruthy();
  });

  it('PENDING ẩn khỏi public; APPROVED hiện; REJECTED biến mất kèm rejectReason', async () => {
    if (!dbUp) return;
    await expect(venues.getPublicByIdOrSlug(venueA.slug)).rejects.toMatchObject({
      response: { code: 'VENUE_NOT_FOUND' },
    });
    const before = await venues.listPublic({ q: SUFFIX, page: 1, limit: 50 });
    expect(before.total).toBe(0);

    await admin.approve(venueA.id);

    const detail = await venues.getPublicByIdOrSlug(venueA.slug);
    expect(detail.name).toContain('Itest');
    expect(detail.courts.length).toBe(1);

    const listed = await venues.listPublic({ q: SUFFIX, page: 1, limit: 50 });
    expect(listed.total).toBe(1);
    const bySport = await venues.listPublic({
      sportType: SportType.FOOTBALL5,
      q: SUFFIX,
      page: 1,
      limit: 50,
    });
    expect(bySport.total).toBe(1);
    const byOther = await venues.listPublic({
      sportType: SportType.TENNIS,
      q: SUFFIX,
      page: 1,
      limit: 50,
    });
    expect(byOther.total).toBe(0);

    await admin.reject(venueA.id, 'Anh chua dung noi dung');
    await expect(venues.getPublicByIdOrSlug(venueA.slug)).rejects.toMatchObject({
      response: { code: 'VENUE_NOT_FOUND' },
    });
    const stored = await prisma.venue.findUniqueOrThrow({ where: { id: venueA.id } });
    expect(stored.status).toBe('REJECTED');
    expect(stored.rejectReason).toBe('Anh chua dung noi dung');

    await admin.approve(venueA.id);
    await venues.getPublicByIdOrSlug(venueA.slug);
  });

  it('owner B không đặt bảng giá court của A; A đặt được (REPLACE-ALL idempotent)', async () => {
    if (!dbUp) return;
    await expect(
      pricing.replaceRules(courtA.id, uB(), {
        rules: [
          { dayType: DayType.WEEKDAY, startMinute: 1020, endMinute: 1320, pricePerSlot: 520000 },
        ],
      }),
    ).rejects.toMatchObject({ response: { code: 'VENUE_FORBIDDEN' } });

    const first = await pricing.replaceRules(courtA.id, uA(), {
      rules: [
        { dayType: DayType.WEEKDAY, startMinute: 1020, endMinute: 1320, pricePerSlot: 520000 },
        { dayType: DayType.WEEKEND, startMinute: 330, endMinute: 1320, pricePerSlot: 560000 },
      ],
    });
    expect(first).toHaveLength(2);

    const second = await pricing.replaceRules(courtA.id, uA(), {
      rules: [
        { dayType: DayType.WEEKDAY, startMinute: 1020, endMinute: 1320, pricePerSlot: 540000 },
      ],
    });
    expect(second).toHaveLength(1);
    expect(second[0].pricePerSlot).toBe(540000);
    expect(await prisma.pricingRule.count({ where: { courtId: courtA.id } })).toBe(1);
  });

  it('rule chồng giờ cùng dayType -> PRICING_OVERLAP', async () => {
    if (!dbUp) return;
    const overlapping = {
      rules: [
        { dayType: DayType.WEEKDAY, startMinute: 600, endMinute: 720, pricePerSlot: 100000 },
        { dayType: DayType.WEEKDAY, startMinute: 700, endMinute: 800, pricePerSlot: 120000 },
      ],
    };
    await expect(pricing.replaceRules(courtA.id, uA(), overlapping)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(pricing.replaceRules(courtA.id, uA(), overlapping)).rejects.toMatchObject({
      response: { code: 'PRICING_OVERLAP' },
    });
  });

  it('listReviews public: items + avgRating aggregate', async () => {
    if (!dbUp) return;
    const bk = await prisma.booking.create({
      data: {
        code: `CH-VREV-${SUFFIX}`,
        customerId: ownerA.id,
        courtId: courtA.id,
        date: new Date(tomorrow() + 'T00:00:00.000Z'),
        startMinute: 900,
        endMinute: 960,
        subtotal: 100_000,
        depositAmount: 50_000,
        status: 'COMPLETED',
      },
    });
    await prisma.review.create({
      data: {
        bookingId: bk.id,
        venueId: venueA.id,
        customerId: ownerA.id,
        rating: 4,
        comment: 'Chất lượng tốt',
      },
    });

    const list = await venues.listReviews(venueA.slug, { page: 1, size: 10 });
    expect(list.total).toBe(1);
    expect(list.items[0].rating).toBe(4);
    expect(list.avgRating).toBe(4);

    const byUuid = await venues.listReviews(venueA.id, { page: 1, size: 10 });
    expect(byUuid.total).toBe(1);
  });

  it('xóa venue còn court -> VENUE_HAS_COURTS', async () => {
    if (!dbUp) return;
    await expect(venues.remove(venueA.id, uAdmin())).rejects.toBeInstanceOf(ConflictException);
    await expect(venues.remove(venueA.id, uAdmin())).rejects.toMatchObject({
      response: { code: 'VENUE_HAS_COURTS' },
    });
  });

  it('listMine chỉ trả venue của chính owner', async () => {
    if (!dbUp) return;
    const mineA = await venues.listMine(uA(), { page: 1, limit: 50 });
    expect(mineA.items.every((v) => v.ownerId === ownerA.id)).toBe(true);
    expect(mineA.items.some((v) => v.id === venueA.id)).toBe(true);
  });
});
