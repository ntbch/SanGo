import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { uniqueSlug } from './slug.util';
import type {
  CreateVenueDto,
  OwnerVenueListQueryDto,
  ReviewsQueryDto,
  UpdateVenueDto,
  VenueListQueryDto,
} from './dto/venue.dto';
import type { User } from '@prisma/client';

const courtCard = {
  id: true,
  name: true,
  sportType: true,
  slotMinutes: true,
  defaultPricePerSlot: true,
} as const;

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  // TODO(unaccent): bật extension unaccent để tìm kiếm tên sân bỏ dấu tiếng Việt.
  /** Danh sách PUBLIC — chỉ venue APPROVED (đặc tả §3.2). Lọc sportType qua sân con ACTIVE. */
  async listPublic(query: VenueListQueryDto) {
    const where: Prisma.VenueWhereInput = {
      status: 'APPROVED',
      ...(query.q ? { name: { contains: query.q, mode: 'insensitive' } } : {}),
      ...(query.sportType
        ? { courts: { some: { sportType: query.sportType, status: 'ACTIVE' } } }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.venue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          lat: true,
          lng: true,
          images: true,
          amenities: true,
          depositPercent: true,
          openMinute: true,
          closeMinute: true,
          courts: { where: { status: 'ACTIVE' }, orderBy: { name: 'asc' }, select: courtCard },
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

  /** Chi tiết public theo slug hoặc id — 404 nếu chưa APPROVED (không lộ sân chờ duyệt). */
  async getPublicByIdOrSlug(idOrSlug: string) {
    // Chỉ tra theo id khi giá trị có dạng UUID, tránh lỗi cast ở Postgres khi nhận slug.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const venue = await this.prisma.venue.findFirst({
      where: {
        OR: [{ slug: idOrSlug }, ...(isUuid ? [{ id: idOrSlug }] : [])],
        status: 'APPROVED',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        lat: true,
        lng: true,
        images: true,
        amenities: true,
        depositPercent: true,
        openMinute: true,
        closeMinute: true,
        courts: { where: { status: 'ACTIVE' }, orderBy: { name: 'asc' }, select: courtCard },
      },
    });
    if (!venue)
      throw new NotFoundException({ message: 'Không tìm thấy sân', code: 'VENUE_NOT_FOUND' });
    return venue;
  }

  /** Danh sách venue của chính owner (mọi trạng thái, để quản lý). */
  async listMine(user: Pick<User, 'id' | 'role'>, query: OwnerVenueListQueryDto) {
    const where: Prisma.VenueWhereInput = user.role === 'ADMIN' ? {} : { ownerId: user.id };
    const [items, total] = await Promise.all([
      this.prisma.venue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { _count: { select: { courts: true } } },
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

  /** Owner tạo venue mới -> luôn ở trạng thái PENDING chờ admin duyệt. */
  async create(user: Pick<User, 'id'>, dto: CreateVenueDto) {
    const slug = await uniqueSlug(dto.name, (slug) =>
      this.prisma.venue.findUnique({ where: { slug } }).then((v) => Boolean(v)),
    );
    const { images, amenities, ...rest } = dto;
    return this.prisma.venue.create({
      data: {
        ...rest,
        ownerId: user.id,
        slug,
        status: 'PENDING',
        images: images ?? [],
        amenities: amenities ?? [],
      },
    });
  }

  /**
   * Ownership check TẠNG SERVICE (đặc tả §7): owner chỉ sửa venue của mình,
   * ADMIN được thao tác mọi venue. Trả về venue nếu hợp lệ, ngược lại 404/403.
   */
  async canManageVenue(venueId: string, user: Pick<User, 'id' | 'role'>) {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue)
      throw new NotFoundException({ message: 'Không tìm thấy sân', code: 'VENUE_NOT_FOUND' });
    if (user.role !== 'ADMIN' && venue.ownerId !== user.id) {
      throw new ForbiddenException({
        message: 'Bạn không phải chủ của sân này',
        code: 'VENUE_FORBIDDEN',
      });
    }
    return venue;
  }

  async update(id: string, user: Pick<User, 'id' | 'role'>, dto: UpdateVenueDto) {
    await this.canManageVenue(id, user);
    return this.prisma.venue.update({ where: { id }, data: dto });
  }

  async remove(id: string, user: Pick<User, 'id' | 'role'>) {
    await this.canManageVenue(id, user);
    const courtCount = await this.prisma.court.count({ where: { venueId: id } });
    if (courtCount > 0) {
      throw new ConflictException({
        message: 'Phải xóa hết sân con trước khi xóa cụm sân',
        code: 'VENUE_HAS_COURTS',
      });
    }
    await this.prisma.venue.delete({ where: { id } });
  }
  /**
   * Đánh giá công khai của một sân (đặc tả §3.8) — chỉ venue APPROVED,
   * nhận cả slug lẫn UUID, kèm điểm trung bình aggregate.
   */
  async listReviews(idOrSlug: string, query: ReviewsQueryDto) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const venue = await this.prisma.venue.findFirst({
      where: {
        OR: [{ slug: idOrSlug }, ...(isUuid ? [{ id: idOrSlug }] : [])],
        status: 'APPROVED',
      },
      select: { id: true },
    });
    if (!venue)
      throw new NotFoundException({ message: 'Không tìm thấy sân', code: 'VENUE_NOT_FOUND' });

    const [agg, items, total] = await Promise.all([
      this.prisma.review.aggregate({ where: { venueId: venue.id }, _avg: { rating: true } }),
      this.prisma.review.findMany({
        where: { venueId: venue.id },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.size,
        take: query.size,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          customer: { select: { fullName: true } },
        },
      }),
      this.prisma.review.count({ where: { venueId: venue.id } }),
    ]);
    return {
      items,
      total,
      page: query.page,
      size: query.size,
      pages: Math.max(1, Math.ceil(total / query.size)),
      avgRating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
    };
  }
}
