import { Injectable } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { OpenMatchesQueryDto, OpenMatchesResponse } from './dto/open-match.dto';

/** Số ghép trận mỗi trang — public list chỉ cần page, giữ cố định cho đơn giản. */
const PAGE_LIMIT = 12;

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Danh sách ghép trận mở (§3.11): đơn CONFIRMED công khai chưa đủ người.
   * Đơn qua giờ chơi sẽ bị cron chuyển COMPLETED -> tự rơi khỏi danh sách.
   */
  async listOpen(query: OpenMatchesQueryDto): Promise<OpenMatchesResponse> {
    const where: Prisma.BookingWhereInput = {
      status: BookingStatus.CONFIRMED,
      isPublicMatch: true,
      OR: [{ matchFull: false }, { matchFull: null }],
      ...(query.sportType ? { court: { sportType: query.sportType } } : {}),
      ...(query.date ? { date: new Date(query.date + 'T00:00:00.000Z') } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: [{ date: 'asc' }, { startMinute: 'asc' }],
        skip: (query.page - 1) * PAGE_LIMIT,
        take: PAGE_LIMIT,
        select: {
          id: true,
          code: true,
          date: true,
          startMinute: true,
          endMinute: true,
          subtotal: true,
          depositAmount: true,
          slotsNeeded: true,
          court: { select: { name: true, sportType: true, slotMinutes: true } },
          customer: { select: { fullName: true } },
          _count: { select: { participants: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      items: rows.map((b) => ({
        bookingId: b.id,
        code: b.code,
        courtName: b.court.name,
        sportType: b.court.sportType,
        date: b.date.toISOString().slice(0, 10),
        startMinute: b.startMinute,
        endMinute: b.endMinute,
        subtotal: b.subtotal,
        depositAmount: b.depositAmount,
        hostName: b.customer.fullName,
        slotsNeeded: b.slotsNeeded ?? 0,
        joinedCount: b._count.participants,
      })),
      total,
      page: query.page,
      limit: PAGE_LIMIT,
      pages: Math.max(1, Math.ceil(total / PAGE_LIMIT)),
    };
  }
}
