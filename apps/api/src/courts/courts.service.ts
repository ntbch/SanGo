import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { VenuesService } from '../venues/venues.service';
import type { CreateCourtDto, UpdateCourtDto } from './dto/court.dto';
import type { User } from '@prisma/client';

@Injectable()
export class CourtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly venues: VenuesService,
  ) {}

  /** Thêm sân con vào venue — phải là chủ venue đó. */
  async create(user: Pick<User, 'id' | 'role'>, venueId: string, dto: CreateCourtDto) {
    await this.venues.canManageVenue(venueId, user);
    return this.prisma.court.create({ data: { ...dto, venueId } });
  }

  private async getCourtForManage(courtId: string, user: Pick<User, 'id' | 'role'>) {
    const court = await this.prisma.court.findUnique({ where: { id: courtId } });
    if (!court)
      throw new NotFoundException({ message: 'Không tìm thấy sân con', code: 'COURT_NOT_FOUND' });
    await this.venues.canManageVenue(court.venueId, user);
    return court;
  }

  async update(courtId: string, user: Pick<User, 'id' | 'role'>, dto: UpdateCourtDto) {
    await this.getCourtForManage(courtId, user);
    return this.prisma.court.update({ where: { id: courtId }, data: dto });
  }

  /** Sân con có booking thì không xóa được (FK restrict) -> báo lỗi nghiệp vụ rõ ràng. */
  async remove(courtId: string, user: Pick<User, 'id' | 'role'>) {
    await this.getCourtForManage(courtId, user);
    try {
      await this.prisma.court.delete({ where: { id: courtId } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new ConflictException({
          message: 'Sân con đã có đơn đặt/giữ chỗ, không thể xóa',
          code: 'COURT_IN_USE',
        });
      }
      throw e;
    }
  }
}
