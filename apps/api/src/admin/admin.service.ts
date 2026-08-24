import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AdminVenueListQueryDto } from './dto/admin.dto';

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
}
