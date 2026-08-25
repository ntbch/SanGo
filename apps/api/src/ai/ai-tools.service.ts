import { vnToday } from '@courthub/shared';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { SlotsService } from '../bookings/slots.service';
import type { CreateHoldDto } from '../bookings/dto/booking.dto';
import type { AiSlotSuggestion, AiSlotsResult, AiVenueCard, SportTypeValue } from './dto/ai.dto';

const fmt = (minute: number) =>
  String(Math.floor(minute / 60)).padStart(2, '0') + ':' + String(minute % 60).padStart(2, '0');

/** Giờ vàng khi người dùng chưa có lịch sử (§3.13): khung 17–20h và 6–7h. */
const GOLDEN_HOURS = new Set([6, 17, 18, 19]);
const GOLDEN_BONUS = 5;
const HISTORY_WEIGHT = 10;
const HISTORY_SAMPLE = 10;

export interface SearchVenuesFilter {
  sportType?: SportTypeValue;
  location?: string;
  query?: string;
}

/**
 * Tool-call nội bộ của trợ lý AI (§3.12): MỌI số liệu slot/venue đều đọc từ DB thật
 * qua service hiện có — AI KHÔNG tự suy diễn hay bịa dữ liệu (anti-hallucination).
 */
@Injectable()
export class AiToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slots: SlotsService,
    private readonly bookings: BookingsService,
  ) {}

  /** Tìm venue APPROVED (tối đa 6) kèm sân con + giá thấp nhất cho card UI. */
  async searchVenues(filter: SearchVenuesFilter): Promise<AiVenueCard[]> {
    const where = {
      status: 'APPROVED' as const,
      ...(filter.sportType ? { courts: { some: { sportType: filter.sportType } } } : {}),
      ...(filter.location
        ? {
            OR: [
              { district: { contains: filter.location, mode: 'insensitive' as const } },
              { address: { contains: filter.location, mode: 'insensitive' as const } },
              { city: { contains: filter.location, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(filter.query ? { name: { contains: filter.query, mode: 'insensitive' as const } } : {}),
    };
    const venues = await this.prisma.venue.findMany({
      where,
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        courts: {
          where: filter.sportType ? { sportType: filter.sportType } : undefined,
          select: {
            id: true,
            name: true,
            sportType: true,
            defaultPricePerSlot: true,
            slotMinutes: true,
          },
        },
      },
    });
    return venues.map((v) => ({
      venueId: v.id,
      name: v.name,
      address: v.address,
      ...(v.images.length > 0 ? { image: v.images[0] } : {}),
      minPrice:
        v.courts.length > 0 ? Math.min(...v.courts.map((c) => c.defaultPricePerSlot)) : null,
      courts: v.courts.map((c) => ({
        courtId: c.id,
        name: c.name,
        sportType: c.sportType,
        pricePerSlot: c.defaultPricePerSlot,
        slotMinutes: c.slotMinutes,
      })),
    }));
  }

  /**
   * Lịch trống 1 ngày của sân con — GỌI THẲNG SlotsService.week(courtId, date, 1),
   * trả chip giờ trống dạng HH:mm cho UI chat.
   */
  async checkSlots(courtId: string, date: string): Promise<AiSlotsResult> {
    const week = await this.slots.week(courtId, date, 1);
    const day = week.byDate[0];
    return {
      courtId,
      courtName: await this.courtName(courtId),
      date,
      slotMinutes: week.slotMinutes,
      available: day.slots
        .filter((s) => s.state === 'AVAILABLE')
        .map((s) => ({
          label: fmt(s.startMinute) + '–' + fmt(s.endMinute),
          startMinute: s.startMinute,
          endMinute: s.endMinute,
        })),
    };
  }

  /**
   * Giữ chỗ từ chat — GUARDRAIL §3.12: gọi thẳng BookingsService.createHold để
   * tái dùng toàn bộ transaction chống double-booking; endpoint bắt buộc JWT.
   */
  async createHold(user: { id: string }, dto: CreateHoldDto) {
    return this.bookings.createHold(user, dto);
  }

  /**
   * AI-2 gợi ý khung giờ (§3.13): histogram giờ bắt đầu từ tối đa 10 đơn COMPLETED
   * gần nhất của user; chưa có lịch sử thì ưu tiên giờ vàng. Thuần SQL aggregate,
   * không tốn phí API. Top 4 kèm score + reason.
   */
  async getSuggestedSlots(
    courtId: string,
    opts: { date?: string; userId?: string } = {},
  ): Promise<{ courtId: string; date: string; suggestions: AiSlotSuggestion[] }> {
    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
      include: { venue: { select: { openMinute: true, closeMinute: true } } },
    });
    if (!court)
      throw new NotFoundException({ message: 'Không tìm thấy sân con', code: 'COURT_NOT_FOUND' });

    const date = opts.date ?? vnToday();

    // Histogram theo GIỜ bắt đầu (floor phút/60) từ lịch sử COMPLETED của chính user.
    const historyByHour = new Map<number, number>();
    if (opts.userId) {
      const rows = await this.prisma.booking.findMany({
        where: { customerId: opts.userId, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: HISTORY_SAMPLE,
        select: { startMinute: true },
      });
      for (const r of rows) {
        const h = Math.floor(r.startMinute / 60);
        historyByHour.set(h, (historyByHour.get(h) ?? 0) + 1);
      }
    }

    const startHour = Math.max(5, Math.floor(court.venue.openMinute / 60));
    const endHour = Math.min(21, Math.ceil(court.venue.closeMinute / 60));
    const candidates: AiSlotSuggestion[] = [];
    for (let h = startHour; h <= endHour; h++) {
      const minute = h * 60;
      if (minute < court.venue.openMinute || minute + court.slotMinutes > court.venue.closeMinute) {
        continue;
      }
      const historyHits = historyByHour.get(h) ?? 0;
      const isGolden = GOLDEN_HOURS.has(h);
      const score = historyHits * HISTORY_WEIGHT + (isGolden ? GOLDEN_BONUS : 0);
      candidates.push({
        startMinute: minute,
        label: fmt(minute) + '–' + fmt(minute + court.slotMinutes),
        score,
        reason:
          historyHits > 0
            ? 'Bạn thường chơi khung này (' + historyHits + ' trận gần đây)'
            : isGolden
              ? 'Giờ vàng nhiều người chọn'
              : 'Khung giờ thoáng, ít người đặt',
      });
    }

    return {
      courtId,
      date,
      suggestions: candidates
        .sort((a, b) => b.score - a.score || a.startMinute - b.startMinute)
        .slice(0, 4),
    };
  }

  private async courtName(courtId: string): Promise<string> {
    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
      select: { name: true },
    });
    return court?.name ?? '';
  }
}
