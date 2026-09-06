import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  MatchJoinRequestStatus,
  MatchLevel,
  Prisma,
  SportType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateJoinRequestDto,
  CreateMatchCommentDto,
  OpenMatchesQueryDto,
  ReviewJoinRequestDto,
} from './dto/open-match.dto';

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Danh sách ghép trận mở (§3.11 & P6): đơn CONFIRMED công khai, hỗ trợ lọc môn, khu vực, level, khung giờ
   */
  async listOpen(query: OpenMatchesQueryDto) {
    const pageLimit = query.limit ?? 12;

    // Filter môn thể thao (gộp hoặc riêng lẻ)
    let sportTypes: SportType[] | undefined;
    if (query.sportType) {
      sportTypes = [query.sportType as SportType];
    } else if (query.sportGroup === 'FOOTBALL') {
      sportTypes = [SportType.FOOTBALL5, SportType.FOOTBALL7];
    } else if (query.sportGroup) {
      sportTypes = [query.sportGroup as SportType];
    }

    const where: Prisma.BookingWhereInput = {
      status: BookingStatus.CONFIRMED,
      isPublicMatch: true,
      OR: [{ matchFull: false }, { matchFull: null }],
      ...(sportTypes ? { court: { sportType: { in: sportTypes } } } : {}),
      ...(query.date ? { date: new Date(query.date + 'T00:00:00.000Z') } : {}),
      ...(query.level ? { matchLevel: query.level as MatchLevel } : {}),
      ...(query.fromMinute !== undefined ? { startMinute: { gte: query.fromMinute } } : {}),
      ...(query.toMinute !== undefined ? { endMinute: { lte: query.toMinute } } : {}),
      ...(query.city || query.district
        ? {
            court: {
              venue: {
                ...(query.city ? { city: { contains: query.city, mode: 'insensitive' } } : {}),
                ...(query.district ? { district: { contains: query.district, mode: 'insensitive' } } : {}),
              },
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: [{ date: 'asc' }, { startMinute: 'asc' }],
        skip: (query.page - 1) * pageLimit,
        take: pageLimit,
        select: {
          id: true,
          code: true,
          date: true,
          startMinute: true,
          endMinute: true,
          subtotal: true,
          depositAmount: true,
          slotsNeeded: true,
          matchLevel: true,
          targetPositions: true,
          costPerPerson: true,
          court: {
            select: {
              name: true,
              sportType: true,
              slotMinutes: true,
              venue: { select: { id: true, name: true, address: true, city: true, district: true } },
            },
          },
          customer: { select: { id: true, fullName: true, avatarUrl: true } },
          _count: { select: { participants: true, matchComments: true } },
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
        venue: b.court.venue,
        date: b.date.toISOString().slice(0, 10),
        startMinute: b.startMinute,
        endMinute: b.endMinute,
        subtotal: b.subtotal,
        depositAmount: b.depositAmount,
        costPerPerson: b.costPerPerson ?? Math.round(b.subtotal / Math.max(1, (b.slotsNeeded ?? 0) + 1)),
        matchLevel: b.matchLevel ?? 'FRIENDLY',
        targetPositions: b.targetPositions,
        host: b.customer,
        slotsNeeded: b.slotsNeeded ?? 0,
        joinedCount: b._count.participants,
        commentsCount: b._count.matchComments,
      })),
      total,
      page: query.page,
      limit: pageLimit,
      pages: Math.max(1, Math.ceil(total / pageLimit)),
    };
  }

  /** Chi tiết 1 kèo ghép trận (bao gồm participants, join requests nếu là host, và comments) */
  async getMatchDetail(bookingId: string, user?: { id: string }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        court: {
          include: {
            venue: {
              select: { id: true, name: true, address: true, city: true, district: true, lat: true, lng: true },
            },
          },
        },
        customer: {
          select: { id: true, fullName: true, avatarUrl: true, bio: true, phone: true },
        },
        participants: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true, preferredPositions: true } },
          },
        },
        _count: { select: { matchComments: true } },
      },
    });

    if (!booking || !booking.isPublicMatch) {
      throw new NotFoundException({ message: 'Không tìm thấy kèo ghép trận', code: 'MATCH_NOT_FOUND' });
    }

    const isHost = user && user.id === booking.customerId;

    // Lấy trạng thái yêu cầu join của user hiện tại (nếu có)
    let myJoinRequest = null;
    if (user) {
      myJoinRequest = await this.prisma.matchJoinRequest.findUnique({
        where: { bookingId_userId: { bookingId, userId: user.id } },
      });
    }

    return {
      bookingId: booking.id,
      code: booking.code,
      status: booking.status === 'COMPLETED' ? 'COMPLETED' : booking.matchFull ? 'FULL' : 'OPEN',
      date: booking.date.toISOString().slice(0, 10),
      startMinute: booking.startMinute,
      endMinute: booking.endMinute,
      subtotal: booking.subtotal,
      depositAmount: booking.depositAmount,
      costPerPerson: booking.costPerPerson ?? Math.round(booking.subtotal / Math.max(1, (booking.slotsNeeded ?? 0) + 1)),
      matchLevel: booking.matchLevel ?? 'FRIENDLY',
      targetPositions: booking.targetPositions,
      slotsNeeded: booking.slotsNeeded ?? 0,
      joinedCount: booking.participants.length,
      court: {
        id: booking.court.id,
        name: booking.court.name,
        sportType: booking.court.sportType,
        venue: booking.court.venue,
      },
      host: booking.customer,
      participants: booking.participants.map((p) => ({
        id: p.user.id,
        fullName: p.user.fullName,
        avatarUrl: p.user.avatarUrl,
        preferredPositions: p.user.preferredPositions,
        joinedAt: p.joinedAt,
      })),
      myJoinRequest,
      isHost,
    };
  }

  /** Gửi yêu cầu xin tham gia kèo (P6 Join Request) */
  async createJoinRequest(bookingId: string, user: { id: string }, dto: CreateJoinRequestDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking || !booking.isPublicMatch || booking.status !== BookingStatus.CONFIRMED) {
      throw new NotFoundException({ message: 'Kèo không khả dụng', code: 'MATCH_NOT_AVAILABLE' });
    }
    if (booking.customerId === user.id) {
      throw new BadRequestException({
        message: 'Bạn là chủ kèo, không thể gửi yêu cầu xin tham gia',
        code: 'SELF_JOIN_REQUEST',
      });
    }
    if (booking.matchFull) {
      throw new ConflictException({ message: 'Kèo đã đủ người', code: 'MATCH_FULL' });
    }

    // M6 fix: kèo có yêu cầu vị trí (spec §3.11) thì position khai báo phải thuộc
    // targetPositions — host vẫn có thể duyệt ngoại lệ ở bước review nếu muốn.
    const targetPositions = booking.targetPositions ?? [];
    if (
      targetPositions.length > 0 &&
      dto.position != null &&
      !targetPositions.includes(dto.position)
    ) {
      throw new BadRequestException({
        message: 'Vị trí không nằm trong yêu cầu của kèo này',
        code: 'POSITION_NOT_ALLOWED',
      });
    }

    // Kiểm tra đã là participant chưa
    const isParticipant = await this.prisma.matchParticipant.findUnique({
      where: { bookingId_userId: { bookingId, userId: user.id } },
    });
    if (isParticipant) {
      throw new ConflictException({ message: 'Bạn đã tham gia kèo này rồi', code: 'ALREADY_JOINED' });
    }

    return this.prisma.matchJoinRequest.upsert({
      where: { bookingId_userId: { bookingId, userId: user.id } },
      create: {
        bookingId,
        userId: user.id,
        position: dto.position ?? null,
        message: dto.message ?? null,
        status: MatchJoinRequestStatus.PENDING,
      },
      update: {
        position: dto.position ?? null,
        message: dto.message ?? null,
        status: MatchJoinRequestStatus.PENDING,
      },
    });
  }

  /** Xem danh sách yêu cầu xin tham gia (Chủ kèo xem) */
  async listJoinRequests(bookingId: string, user: { id: string }) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException({ message: 'Không tìm thấy kèo', code: 'MATCH_NOT_FOUND' });
    }
    if (booking.customerId !== user.id) {
      throw new ForbiddenException({ message: 'Chỉ chủ kèo mới có quyền xem danh sách yêu cầu', code: 'HOST_ONLY' });
    }

    return this.prisma.matchJoinRequest.findMany({
      where: { bookingId },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, preferredPositions: true, selfLevel: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Chủ kèo duyệt / từ chối yêu cầu xin tham gia */
  async reviewJoinRequest(bookingId: string, requestId: string, user: { id: string }, dto: ReviewJoinRequestDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException({ message: 'Không tìm thấy kèo', code: 'MATCH_NOT_FOUND' });
    }
    if (booking.customerId !== user.id) {
      throw new ForbiddenException({ message: 'Chỉ chủ kèo mới có quyền duyệt yêu cầu', code: 'HOST_ONLY' });
    }

    const req = await this.prisma.matchJoinRequest.findUnique({ where: { id: requestId } });
    if (!req || req.bookingId !== bookingId) {
      throw new NotFoundException({ message: 'Không tìm thấy yêu cầu', code: 'REQUEST_NOT_FOUND' });
    }

    if (dto.status === 'REJECTED') {
      return this.prisma.matchJoinRequest.update({
        where: { id: requestId },
        data: { status: MatchJoinRequestStatus.REJECTED },
      });
    }

    // Nếu APPROVED -> Thêm vào matchParticipant
    return this.prisma.$transaction(async (tx) => {
      // M1 fix: khoá dòng booking (pattern bookings.joinOpenMatch:1085) — hai lần
      // duyệt song song xếp hàng tại đây, đếm đọc sau khi tx trước đã commit.
      await tx.$queryRaw`SELECT id FROM "bookings" WHERE id = ${bookingId}::uuid FOR UPDATE`;
      const fresh = await tx.booking.findUniqueOrThrow({
        where: { id: bookingId },
        select: { slotsNeeded: true },
      });
      const currentParticipants = await tx.matchParticipant.count({ where: { bookingId } });
      const needed = fresh.slotsNeeded ?? 0;
      if (currentParticipants >= needed) {
        throw new ConflictException({ message: 'Kèo đã đủ người, không thể duyệt thêm', code: 'MATCH_FULL' });
      }

      try {
        await tx.matchParticipant.create({
          data: {
            bookingId,
            userId: req.userId,
          },
        });
      } catch (e) {
        // UNIQUE(bookingId, userId) chặn duyệt trùng người (P2002) trong race.
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          throw new ConflictException({
            message: 'Người này đã tham gia kèo này rồi',
            code: 'ALREADY_JOINED',
          });
        }
        throw e;
      }

      const updatedReq = await tx.matchJoinRequest.update({
        where: { id: requestId },
        data: { status: MatchJoinRequestStatus.APPROVED },
      });

      if (currentParticipants + 1 >= needed) {
        await tx.booking.update({ where: { id: bookingId }, data: { matchFull: true } });
      }

      return updatedReq;
    });
  }

  /** Danh sách bình luận trong kèo */
  async listComments(bookingId: string) {
    return this.prisma.matchComment.findMany({
      where: { bookingId },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Tạo bình luận trong kèo */
  async createComment(bookingId: string, user: { id: string }, dto: CreateMatchCommentDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || !booking.isPublicMatch) {
      throw new NotFoundException({ message: 'Không tìm thấy kèo ghép trận', code: 'MATCH_NOT_FOUND' });
    }

    return this.prisma.matchComment.create({
      data: {
        bookingId,
        userId: user.id,
        content: dto.content,
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  }
}
