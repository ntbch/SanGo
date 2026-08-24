import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VenuesService } from '../venues/venues.service';
import type { ReplaceRulesDto } from './dto/pricing-rule.dto';
import type { User } from '@prisma/client';

@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly venues: VenuesService,
  ) {}

  /** Đọc bảng giá của sân con — công khai để khách xem trước khi đặt. */
  async listRules(courtId: string) {
    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
      select: { id: true },
    });
    if (!court)
      throw new NotFoundException({ message: 'Không tìm thấy sân con', code: 'COURT_NOT_FOUND' });
    return this.prisma.pricingRule.findMany({
      where: { courtId },
      orderBy: [{ dayType: 'asc' }, { startMinute: 'asc' }],
    });
  }

  /** Thay toàn bộ rules của court trong 1 transaction (semantics REPLACE-ALL theo contract). */
  async replaceRules(courtId: string, user: Pick<User, 'id' | 'role'>, dto: ReplaceRulesDto) {
    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
      select: { id: true, venueId: true },
    });
    if (!court)
      throw new NotFoundException({ message: 'Không tìm thấy sân con', code: 'COURT_NOT_FOUND' });
    await this.venues.canManageVenue(court.venueId, user);

    // Defense-in-depth: zod đã chặn, service chặn lại để bảo vệ mọi caller.
    const byDay = new Map<string, { startMinute: number; endMinute: number }[]>();
    for (const r of dto.rules) {
      const arr = byDay.get(r.dayType) ?? [];
      arr.push({ startMinute: r.startMinute, endMinute: r.endMinute });
      byDay.set(r.dayType, arr);
    }
    for (const windows of byDay.values()) {
      windows.sort((a, b) => a.startMinute - b.startMinute);
      for (let i = 1; i < windows.length; i++) {
        if (windows[i].startMinute < windows[i - 1].endMinute) {
          throw new BadRequestException({
            message: 'Các rule cùng loại ngày không được chồng lấn khung giờ',
            code: 'PRICING_OVERLAP',
          });
        }
      }
    }

    await this.prisma.$transaction([
      this.prisma.pricingRule.deleteMany({ where: { courtId } }),
      this.prisma.pricingRule.createMany({
        data: dto.rules.map((r) => ({ ...r, courtId })),
      }),
    ]);
    return this.listRules(courtId);
  }
}
