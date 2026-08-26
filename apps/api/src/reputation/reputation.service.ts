/**
 * F2 Ranking & Badge (Sprint 3) — điểm uy tín COMPUTE-ON-READ từ Booking:
 * KHÔNG tạo bảng lịch sử điểm, KHÔNG denormalize — mỗi lần đọc tính lại từ
 * dữ liệu hiện có, có cache in-memory 5 phút cho các lần xem liên tiếp.
 *
 * Quy tắc tính (đặc tả charter S3-F2):
 *  - Check-in ĐÚNG GIỜ (checkedInAt <= date+startMinute):            +10
 *  - Hủy sát giờ (cancelledAt trong cửa sổ <12h trước giờ chơi):     -5
 *  - No-show (= COMPLETED mà KHÔNG có checkedInAt):                  -20
 *  - Dữ liệu cũ / trường hợp khác: trung tính — không cộng không trừ.
 * Score = clamp(0..100, BASE + tổng delta).
 *
 * Quyết định đã thảo luận trong task: KHÔNG thêm sweep/cron NO_SHOW mới —
 * cron chuyển CONFIRMED -> COMPLETED qua giờ kết thúc đã tồn tại
 * (bookings.cron.service), nên "COMPLETED mà không có checkedInAt" tự suy
 * ra được khi đọc, không cần trạng thái phụ.
 */
import { Injectable } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Trọng số điểm — public để test và FE hiển thị luật cộng/trừ. */
export const REPUTATION_WEIGHTS = {
  BASE: 50,
  ON_TIME_CHECK_IN: 10,
  LATE_CANCEL: -5,
  NO_SHOW: -20,
} as const;

/** Ngưỡng hủy sát giờ: <12h trước giờ chơi — CHỐT captain: dùng chung mốc 12h
 * của tier hoàn tiền (bookings.service refundQuote: >24h 100%, 12–24h 50%, <12h 0%).
 * Từ 12h trở lên chỉ là huỷ bình thường, không trừ điểm. */
export const LATE_CANCEL_WINDOW_MS = 12 * 60 * 60 * 1000;

export const BADGE_DEFS = [
  { code: 'ON_TIME_10', name: 'Đúng giờ 10 lần', target: 10 },
  { code: 'BOOKINGS_10', name: '10 lần đặt sân', target: 10 },
] as const;

interface CachedReputation {
  expiresAt: number;
  data: ReputationResult;
}

export interface ReputationResult {
  score: number;
  breakdown: {
    onTimeCheckIns: number;
    lateCancels: number;
    noShows: number;
  };
  badges: Array<{
    code: string;
    name: string;
    unlocked: boolean;
    current: number;
    target: number;
  }>;
}

@Injectable()
export class ReputationService {
  /** Cache đọc 5 phút theo userId — demo single-node nên in-memory là đủ. */
  private static readonly CACHE_TTL_MS = 5 * 60 * 1000;
  private readonly cache = new Map<string, CachedReputation>();

  constructor(private readonly prisma: PrismaService) {}

  async getMyReputation(userId: string): Promise<ReputationResult> {
    const cached = this.cache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const result = await this.computeReputation(userId);
    this.cache.set(userId, {
      expiresAt: Date.now() + ReputationService.CACHE_TTL_MS,
      data: result,
    });
    return result;
  }

  private async computeReputation(userId: string): Promise<ReputationResult> {
    // Một lần quét các đơn có thể chấm điểm: CANCELLED (xét hủy sát giờ),
    // CHECKED_IN/COMPLETED (xét đúng giờ / no-show).
    const bookings = await this.prisma.booking.findMany({
      where: {
        customerId: userId,
        status: {
          in: [BookingStatus.CANCELLED, BookingStatus.CHECKED_IN, BookingStatus.COMPLETED],
        },
      },
      select: {
        date: true,
        startMinute: true,
        status: true,
        cancelledAt: true,
        checkedInAt: true,
      },
    });

    let delta = 0;
    let onTimeCheckIns = 0;
    let lateCancels = 0;
    let noShows = 0;

    for (const b of bookings) {
      const startAt = b.date.getTime() + b.startMinute * 60_000;

      if (b.status === BookingStatus.CANCELLED) {
        // Chỉ phạt khi huỷ TRONG cửa sổ sát giờ (<12h trước giờ chơi).
        if (
          b.cancelledAt !== null &&
          b.cancelledAt.getTime() > startAt - LATE_CANCEL_WINDOW_MS &&
          b.cancelledAt.getTime() <= startAt
        ) {
          lateCancels += 1;
          delta += REPUTATION_WEIGHTS.LATE_CANCEL;
        }
        continue;
      }

      if (b.checkedInAt === null) {
        // COMPLETED mà không có check-in => no-show trừ nặng.
        if (b.status === BookingStatus.COMPLETED) {
          noShows += 1;
          delta += REPUTATION_WEIGHTS.NO_SHOW;
        }
        continue;
      }

      if (b.checkedInAt.getTime() <= startAt) {
        onTimeCheckIns += 1;
        delta += REPUTATION_WEIGHTS.ON_TIME_CHECK_IN;
      }
      // Check-in muộn: trung tính theo đặc tả hiện tại.
    }

    const raw = REPUTATION_WEIGHTS.BASE + delta;
    const score = Math.max(0, Math.min(100, raw));

    const badges = await this.computeBadges(userId, onTimeCheckIns, bookings.length);

    return { score, breakdown: { onTimeCheckIns, lateCancels, noShows }, badges };
  }

  /** Badge dùng SQL aggregate (COUNT) — không load toàn bộ hàng về app. */
  private async computeBadges(
    userId: string,
    onTimeCheckIns: number,
    totalBookings: number,
  ): Promise<ReputationResult['badges']> {
    // Đếm on-time bằng SQL so sánh trực tiếp checkedInAt với date+startMinute.
    const onTimeSql = [
      'SELECT COUNT(*)::int AS cnt FROM "bookings"',
      'WHERE "customerId" = $1::uuid',
      'AND "checkedInAt" IS NOT NULL',
      "AND \"checkedInAt\" <= (\"date\" + (\"startMinute\" * interval '1 minute'))",
    ].join(' ');
    const onTimeRows = await this.prisma.$queryRawUnsafe<Array<{ cnt: number }>>(
      onTimeSql,
      userId,
    );
    const sqlOnTime = Number(onTimeRows[0]?.cnt ?? 0);

    const playedCount = await this.prisma.booking.count({
      where: {
        customerId: userId,
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.COMPLETED],
        },
      },
    });

    const currents: Record<string, number> = {
      ON_TIME_10: Math.max(onTimeCheckIns, sqlOnTime),
      BOOKINGS_10: Math.max(totalBookings, playedCount),
    };

    return BADGE_DEFS.map((def) => ({
      code: def.code,
      name: def.name,
      unlocked: currents[def.code] >= def.target,
      current: currents[def.code],
      target: def.target,
    }));
  }

  /**
   * Bảng xếp hạng (F2): chỉ người chơi có ít nhất một đơn ở trạng thái chấm điểm.
   * Tính lại từng người qua computeReputation, sort score desc — hoà thì ưu tiên
   * onTime nhiều hơn rồi tên tiếng Việt cho thứ tự ổn định giữa các lần gọi.
   */
  async getLeaderboard(limit: number) {
    const distinct = await this.prisma.booking.findMany({
      where: {
        status: {
          in: [BookingStatus.CANCELLED, BookingStatus.CHECKED_IN, BookingStatus.COMPLETED],
        },
      },
      select: { customerId: true },
      distinct: ['customerId'],
    });
    const ids = distinct.map((d) => d.customerId);
    if (ids.length === 0) {
      return { items: [], total: 0, generatedAt: new Date().toISOString() };
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, fullName: true },
    });

    const entries: Array<{
      userId: string;
      fullName: string;
      score: number;
      onTime: number;
      noShow: number;
    }> = [];
    for (const u of users) {
      const rep = await this.computeReputation(u.id);
      entries.push({
        userId: u.id,
        fullName: u.fullName,
        score: rep.score,
        onTime: rep.breakdown.onTimeCheckIns,
        noShow: rep.breakdown.noShows,
      });
    }

    entries.sort(
      (a, b) =>
        b.score - a.score ||
        b.onTime - a.onTime ||
        a.fullName.localeCompare(b.fullName, 'vi'),
    );

    return {
      items: entries.slice(0, limit),
      total: entries.length,
      generatedAt: new Date().toISOString(),
    };
  }
}
