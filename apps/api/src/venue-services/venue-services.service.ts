import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AddBookingAddOnsDto,
  CreateVenueServiceDto,
  UpdateVenueServiceDto,
} from './dto/venue-service.dto';

@Injectable()
export class VenueServicesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private async verifyVenueOwner(user: { id: string; role?: string }, venueId: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, ownerId: true },
    });
    if (!venue) {
      throw new NotFoundException({
        message: 'Không tìm thấy cụm sân',
        code: 'VENUE_NOT_FOUND',
      });
    }
    if (user.role !== 'ADMIN' && venue.ownerId !== user.id) {
      throw new ForbiddenException({
        message: 'Không phải cụm sân của bạn',
        code: 'VENUE_FORBIDDEN',
      });
    }
    return venue;
  }

  /** [OWNER] Tạo dịch vụ mới cho cụm sân */
  async createService(
    user: { id: string; role?: string },
    venueId: string,
    dto: CreateVenueServiceDto,
  ) {
    await this.verifyVenueOwner(user, venueId);
    return this.prisma.venueService.create({
      data: {
        venueId,
        name: dto.name,
        price: dto.price,
        type: dto.type,
        isAvailable: dto.isAvailable ?? true,
      },
    });
  }

  /** Danh sách dịch vụ của cụm sân (onlyAvailable = true cho khách, false cho owner) */
  async listVenueServices(
    venueId: string,
    onlyAvailable = false,
    user?: { id: string; role?: string },
  ) {
    if (!onlyAvailable && user) {
      await this.verifyVenueOwner(user, venueId);
    }
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true },
    });
    if (!venue) {
      throw new NotFoundException({
        message: 'Không tìm thấy cụm sân',
        code: 'VENUE_NOT_FOUND',
      });
    }
    return this.prisma.venueService.findMany({
      where: {
        venueId,
        ...(onlyAvailable ? { isAvailable: true } : {}),
      },
      orderBy: [{ type: 'asc' }, { price: 'asc' }],
    });
  }

  /** [OWNER] Cập nhật thông tin/giá/trạng thái dịch vụ */
  async updateService(
    user: { id: string; role?: string },
    venueId: string,
    serviceId: string,
    dto: UpdateVenueServiceDto,
  ) {
    await this.verifyVenueOwner(user, venueId);
    const service = await this.prisma.venueService.findFirst({
      where: { id: serviceId, venueId },
    });
    if (!service) {
      throw new NotFoundException({
        message: 'Không tìm thấy dịch vụ',
        code: 'SERVICE_NOT_FOUND',
      });
    }
    return this.prisma.venueService.update({
      where: { id: serviceId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.isAvailable !== undefined ? { isAvailable: dto.isAvailable } : {}),
      },
    });
  }

  /** [OWNER] Xóa hoặc tắt dịch vụ */
  async deleteService(user: { id: string; role?: string }, venueId: string, serviceId: string) {
    await this.verifyVenueOwner(user, venueId);
    const service = await this.prisma.venueService.findFirst({
      where: { id: serviceId, venueId },
      include: { _count: { select: { addOns: true } } },
    });
    if (!service) {
      throw new NotFoundException({
        message: 'Không tìm thấy dịch vụ',
        code: 'SERVICE_NOT_FOUND',
      });
    }

    // Nếu dịch vụ đã được đặt trong đơn -> chuyển sang tắt (isAvailable: false) để bảo tồn lịch sử
    if (service._count.addOns > 0) {
      await this.prisma.venueService.update({
        where: { id: serviceId },
        data: { isAvailable: false },
      });
      return { id: serviceId, deleted: false, disabled: true };
    }

    await this.prisma.venueService.delete({ where: { id: serviceId } });
    return { id: serviceId, deleted: true, disabled: false };
  }

  /** Danh sách dịch vụ đã đặt của một booking */
  async listBookingAddOns(user: { id: string; role?: string }, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        court: { include: { venue: { select: { ownerId: true } } } },
      },
    });
    if (!booking) {
      throw new NotFoundException({
        message: 'Không tìm thấy đơn đặt sân',
        code: 'BOOKING_NOT_FOUND',
      });
    }
    const isOwner = user.role !== 'CUSTOMER' && booking.court.venue.ownerId === user.id;
    if (booking.customerId !== user.id && user.role !== 'ADMIN' && !isOwner) {
      throw new ForbiddenException({
        message: 'Không phải đơn đặt sân của bạn',
        code: 'BOOKING_FORBIDDEN',
      });
    }

    const items = await this.prisma.bookingAddOn.findMany({
      where: { bookingId },
      include: { service: true },
      orderBy: { createdAt: 'asc' },
    });

    const totalCost = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const payments = await this.prisma.payment.findMany({
      where: { bookingId, type: 'ADD_ON', status: 'PAID' },
    });
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const unpaidAmount = Math.max(0, totalCost - paidAmount);

    return {
      bookingId,
      items,
      totalCost,
      paidAmount,
      unpaidAmount,
    };
  }

  /** Thêm dịch vụ đi kèm cho một booking — ĐÃ VÔ HIỆU HÓA: dịch vụ chỉ được chọn khi đang đặt sân */
  async addBookingAddOns(
    _user: { id: string; role?: string },
    _bookingId: string,
    _dto: AddBookingAddOnsDto,
  ): Promise<never> {
    throw new BadRequestException({
      message: 'Không thể thêm dịch vụ sau khi đã đặt sân. Dịch vụ chỉ được chọn cùng lúc khi đặt sân.',
      code: 'ADDON_AFTER_BOOKING_DISABLED',
    });
  }

  /** Tạo lệnh thanh toán cho addon riêng lẻ — ĐÃ VÔ HIỆU HÓA: dịch vụ thanh toán cùng lúc khi đặt sân */
  createAddonCheckout(_user: { id: string; role?: string }, _bookingId: string): never {
    throw new BadRequestException({
      message: 'Không thể thanh toán dịch vụ riêng lẻ sau khi đã đặt sân. Dịch vụ được thanh toán cùng lúc khi đặt sân.',
      code: 'ADDON_AFTER_BOOKING_DISABLED',
    });
  }
}
