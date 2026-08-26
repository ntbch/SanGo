import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DAY_MS, buildAnalyticsRange, dayKey } from '../analytics/analytics.service';
import { toSafeUser } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AdminBookingListItem,
  AdminBookingsQueryDto,
  AdminStatsResponse,
  AdminUserListItem,
  AdminUserListQueryDto,
  AdminVenueListQueryDto,
  UpdateUserStatusDto,
  UpdateVenueStatusDto,
} from './dto/admin.dto';

/** Số sự kiện mới nhất trả về trong recentActivity. */
const ACTIVITY_LIMIT = 8;
/** Số sân trong bảng xếp hạng topVenues. */
const TOP_VENUES_LIMIT = 5;

/** Nghiệp vụ duyệt sân của ADMIN (đặc tả §2, §3.2). */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listVenues(query: AdminVenueListQueryDto) {
    const where: Prisma.VenueWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q ? { name: { contains: query.q, mode: 'insensitive' } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.venue.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          owner: { select: { email: true, fullName: true } },
          _count: { select: { courts: true } },
        },
      }),
      this.prisma.venue.count({ where }),
    ]);
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async getVenue(id: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, email: true, fullName: true, phone: true } },
        courts: { orderBy: { name: 'asc' } },
      },
    });
    if (!venue)
      throw new NotFoundException({ message: 'Không tìm thấy sân', code: 'VENUE_NOT_FOUND' });
    return venue;
  }

  /** Duyệt sân: PENDING/REJECTED -> APPROVED, xóa rejectReason cũ. */
  async approve(id: string) {
    await this.getVenue(id);
    return this.prisma.venue.update({
      where: { id },
      data: { status: 'APPROVED', rejectReason: null },
    });
  }

  /** Từ chối/take-down: đặt REJECTED kèm lý do bắt buộc. */
  async reject(id: string, reason: string) {
    await this.getVenue(id);
    return this.prisma.venue.update({
      where: { id },
      data: { status: 'REJECTED', rejectReason: reason },
    });
  }

  /**
   * Thống kê nền tảng cho dashboard ADMIN (GET /admin/stats?days=14).
   * Định nghĩa doanh thu: revenueVnd = SUM(Payment.amount WHERE status = PAID
   * ("SUCCESS" trong đặc tả — schema PaymentStatus không có SUCCESS)
   * AND type != REFUND) trong khoảng thống kê.
   */
  async getStats(days: number, now: Date = new Date()): Promise<AdminStatsResponse> {
    // Khoảng [from, toExclusive) theo ngày kinh doanh VN — tái dùng đúng quy ước
    // zero-fill của analytics.service (QA t8), keys đủ `days` điểm tính đến hôm nay.
    const { from, toExclusive, keys } = buildAnalyticsRange(days, now);
    const todayKey = keys[keys.length - 1] ?? dayKey(from);
    const todayFrom = new Date(Date.parse(`${todayKey}T00:00:00.000Z`));

    const [
      usersByRole,
      venuesByStatus,
      bookingsTotal,
      bookingsToday,
      bookingsByDay,
      bookingsByCourt,
      paymentsInRange,
      recentVenues,
      recentBookings,
    ] = await Promise.all([
      this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      this.prisma.venue.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.booking.count(),
      // Booking không có cột startTime — "bookingsToday" quy ước là đơn có NGÀY CHƠI
      // (`date`) rơi vào hôm nay theo múi giờ kinh doanh VN, khớp biên analytics.
      this.prisma.booking.count({
        where: { date: { gte: todayFrom, lt: new Date(todayFrom.getTime() + DAY_MS) } },
      }),
      this.prisma.booking.groupBy({
        by: ['date'],
        where: { date: { gte: from, lt: toExclusive } },
        _count: { _all: true },
      }),
      this.prisma.booking.groupBy({
        by: ['courtId'],
        where: { date: { gte: from, lt: toExclusive } },
        _count: { _all: true },
      }),
      this.prisma.payment.findMany({
        where: {
          status: 'PAID',
          type: { not: 'REFUND' },
          paidAt: { gte: from, lt: toExclusive },
        },
        select: {
          amount: true,
          paidAt: true,
          booking: { select: { court: { select: { venueId: true } } } },
        },
      }),
      this.prisma.venue.findMany({
        orderBy: { createdAt: 'desc' },
        take: ACTIVITY_LIMIT,
        select: { id: true, name: true, createdAt: true },
      }),
      this.prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: ACTIVITY_LIMIT,
        select: {
          code: true,
          createdAt: true,
          customer: { select: { fullName: true } },
          court: { select: { venue: { select: { name: true } } } },
        },
      }),
    ]);

    /* ---- totals ---- */
    const roleCount = (role: string) =>
      usersByRole.find((r) => r.role === role)?._count._all ?? 0;
    const users = usersByRole.reduce((sum, r) => sum + r._count._all, 0);
    const venueCount = (status: string) =>
      venuesByStatus.find((v) => v.status === status)?._count._all ?? 0;
    const venuesTotal = venuesByStatus.reduce((sum, v) => sum + v._count._all, 0);
    const totals = {
      users,
      customers: roleCount('CUSTOMER'),
      owners: roleCount('OWNER'),
      venues: {
        total: venuesTotal,
        PENDING: venueCount('PENDING'),
        APPROVED: venueCount('APPROVED'),
        REJECTED: venueCount('REJECTED'),
        SUSPENDED: venueCount('SUSPENDED'),
      },
      bookingsTotal,
      bookingsToday,
      revenueTodayVnd: 0, // điền sau khi gom doanh thu theo ngày bên dưới
    };

    /* ---- series + gom doanh thu ---- */
    const bookingsDayMap = new Map<string, number>(
      bookingsByDay.map((row) => [dayKey(row.date), row._count._all]),
    );
    const revenueDayMap = new Map<string, number>();
    for (const p of paymentsInRange) {
      if (!p.paidAt) continue; // phòng thủ: PAID luôn có paidAt
      const key = dayKey(p.paidAt);
      revenueDayMap.set(key, (revenueDayMap.get(key) ?? 0) + p.amount);
    }
    totals.revenueTodayVnd = revenueDayMap.get(todayKey) ?? 0;
    const series = keys.map((date) => ({
      date,
      bookings: bookingsDayMap.get(date) ?? 0,
      revenueVnd: revenueDayMap.get(date) ?? 0,
    }));

    /* ---- topVenues: top theo số bookings trong khoảng, tie-break theo doanh thu ---- */
    const courts = bookingsByCourt.length
      ? await this.prisma.court.findMany({
          where: { id: { in: bookingsByCourt.map((row) => row.courtId) } },
          select: { id: true, venueId: true, venue: { select: { id: true, name: true } } },
        })
      : [];
    const venueByCourt = new Map(courts.map((c) => [c.id, c.venue]));
    const aggByVenue = new Map<
      string,
      { venueId: string; name: string; bookings: number; revenueVnd: number }
    >();
    const venueAgg = (venueId: string, name: string) => {
      let agg = aggByVenue.get(venueId);
      if (!agg) {
        agg = { venueId, name, bookings: 0, revenueVnd: 0 };
        aggByVenue.set(venueId, agg);
      }
      return agg;
    };
    for (const row of bookingsByCourt) {
      const venue = venueByCourt.get(row.courtId);
      if (!venue) continue;
      venueAgg(venue.id, venue.name).bookings += row._count._all;
    }
    for (const p of paymentsInRange) {
      const venue = p.booking.court;
      if (!venue) continue;
      venueAgg(venue.venueId, '').revenueVnd += p.amount;
    }
    // Điền tên venue cho các venue chỉ có doanh revenue chưa kèm bookings.
    const namesById = new Map(courts.map((c) => [c.venue.id, c.venue.name]));
    const topVenues = [...aggByVenue.values()]
      .map((agg) => ({ ...agg, name: agg.name || namesById.get(agg.venueId) || '' }))
      .sort(
        (a, b) =>
          b.bookings - a.bookings || b.revenueVnd - a.revenueVnd || a.name.localeCompare(b.name),
      )
      .slice(0, TOP_VENUES_LIMIT);

    /* ---- recentActivity: 8 sự kiện mới nhất trộn sân mới nộp + đơn mới đặt ---- */
    const activity = [
      ...recentVenues.map((v) => ({
        type: 'VENUE_SUBMITTED' as const,
        at: v.createdAt.getTime(),
        label: v.name,
      })),
      ...recentBookings.map((b) => ({
        type: 'BOOKING_CREATED' as const,
        at: b.createdAt.getTime(),
        label: `${b.code} · ${b.customer.fullName} @ ${b.court.venue.name}`,
      })),
    ]
      .sort((a, b) => b.at - a.at)
      .slice(0, ACTIVITY_LIMIT)
      .map((e) => ({ type: e.type, at: new Date(e.at).toISOString(), label: e.label }));

    return { totals, series, topVenues, recentActivity: activity };
  }

  /**
   * Danh sách người dùng cho dashboard ADMIN: tìm kiếm contains insensitive trên
   * fullName/email, lọc role + status, phân trang (pageSize tối đa 100).
   */
  async listUsers(query: AdminUserListQueryDto) {
    const where: Prisma.UserWhereInput = {
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          _count: { select: { bookings: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    const items: AdminUserListItem[] = rows.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
      bookingCount: u._count.bookings,
    }));
    return { items, total };
  }

  /**
   * Khoá/mở khoá tài khoản (ADMIN). Ràng buộc:
   * - Không tự khoá chính mình -> CANNOT_LOCK_SELF.
   * - Không khoá ADMIN khác -> CANNOT_LOCK_ADMIN.
   * - Mở khoá (ACTIVE) luôn được phép, kể cả admin bị khoá bởi admin khác.
   */
  async updateUserStatus(actorId: string, userId: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      throw new NotFoundException({ message: 'Không tìm thấy người dùng', code: 'USER_NOT_FOUND' });
    if (dto.status === 'LOCKED') {
      if (actorId === userId)
        throw new BadRequestException({
          message: 'Không thể tự khóa chính mình',
          code: 'CANNOT_LOCK_SELF',
        });
      if (user.role === 'ADMIN')
        throw new BadRequestException({
          message: 'Không thể khóa tài khoản quản trị viên khác',
          code: 'CANNOT_LOCK_ADMIN',
        });
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: dto.status },
    });
    return toSafeUser(updated);
  }

  /**
   * Treo/kích hoạt cụm sân (ADMIN). Chỉ cho phép chuyển APPROVED <-> SUSPENDED:
   * PENDING/REJECTED phải đi qua POST /admin/venues/:id/approve|reject —
   * sai luồng trả 400 INVALID_STATUS_TRANSITION.
   */
  async updateVenueStatus(id: string, dto: UpdateVenueStatusDto) {
    const venue = await this.getVenue(id);
    const allowed =
      (venue.status === 'APPROVED' && dto.status === 'SUSPENDED') ||
      (venue.status === 'SUSPENDED' && dto.status === 'APPROVED');
    if (!allowed) {
      throw new BadRequestException({
        message: 'Chỉ chuyển được giữa APPROVED và SUSPENDED; sân chờ/từ chối dùng duyệt hoặc từ chối',
        code: 'INVALID_STATUS_TRANSITION',
      });
    }
    return this.prisma.venue.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  /**
   * Tra cứu đơn toàn hệ thống (GET /admin/bookings): lọc date/status/venueId,
   * tìm search trên mã đơn HOẶC tên khách, phân trang items/total.
   * Include venue+court+customer trong MỘT findMany — không N+1.
   */
  async listBookings(query: AdminBookingsQueryDto) {
    const where: Prisma.BookingWhereInput = {
      // Cột date là @db.Date — so khớp đúng midnight UTC của ngày chỉ định.
      ...(query.date ? { date: new Date(`${query.date}T00:00:00.000Z`) } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.venueId ? { court: { venueId: query.venueId } } : {}),
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: 'insensitive' } },
              { customer: { fullName: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          court: {
            select: { name: true, venueId: true, venue: { select: { id: true, name: true } } },
          },
          customer: { select: { fullName: true, email: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);
    const items: AdminBookingListItem[] = rows.map((b) => {
      // startTime/endTime ghép từ ngày chơi + phút trong ngày (biên bucket UTC
      // thống nhất với analytics), trả ISO để frontend format theo múi giờ VN.
      const dayStartMs = Date.parse(`${dayKey(b.date)}T00:00:00.000Z`);
      return {
        id: b.id,
        code: b.code,
        venueId: b.court.venueId,
        venueName: b.court.venue.name,
        courtName: b.court.name,
        customerName: b.customer.fullName,
        customerEmail: b.customer.email,
        startTime: new Date(dayStartMs + b.startMinute * 60_000).toISOString(),
        endTime: new Date(dayStartMs + b.endMinute * 60_000).toISOString(),
        status: b.status,
        // Tổng tiền đơn = subtotal; depositAmount chỉ là phần cọc phải trả trước.
        totalPriceVnd: b.subtotal,
        createdAt: b.createdAt.toISOString(),
      };
    });
    return { items, total };
  }
}
