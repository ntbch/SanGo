import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import type {
  AddBookingAddOnsDto,
  CreateVenueServiceDto,
  UpdateVenueServiceDto,
} from './dto/venue-service.dto';

@Injectable()
export class VenueServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
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

  /** Thêm dịch vụ đi kèm cho một booking CONFIRMED/CHECKED_IN */
  async addBookingAddOns(
    user: { id: string; role?: string },
    bookingId: string,
    dto: AddBookingAddOnsDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        court: { include: { venue: { select: { id: true, ownerId: true } } } },
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
    if (booking.status !== 'CONFIRMED' && booking.status !== 'CHECKED_IN') {
      throw new ConflictException({
        message: 'Chỉ có thể thêm dịch vụ cho đơn đã xác nhận hoặc đã check-in',
        code: 'BOOKING_NOT_CONFIRMED',
      });
    }

    const venueId = booking.court.venue.id;

    // Validate tất cả services
    for (const item of dto.items) {
      const service = await this.prisma.venueService.findUnique({
        where: { id: item.serviceId },
      });
      if (!service || service.venueId !== venueId) {
        throw new BadRequestException({
          message: 'Dịch vụ không tồn tại hoặc không thuộc cụm sân này',
          code: 'SERVICE_NOT_FOUND',
        });
      }
      if (!service.isAvailable) {
        throw new BadRequestException({
          message: `Dịch vụ ${service.name} hiện không khả dụng`,
          code: 'SERVICE_UNAVAILABLE',
        });
      }

      // Upsert: nếu đã có thì cộng thêm số lượng, snapshot giá hiện tại
      await this.prisma.bookingAddOn.upsert({
        where: {
          bookingId_serviceId: {
            bookingId,
            serviceId: item.serviceId,
          },
        },
        create: {
          bookingId,
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitPrice: service.price,
        },
        update: {
          quantity: { increment: item.quantity },
          unitPrice: service.price,
        },
      });
    }

    return this.listBookingAddOns(user, bookingId);
  }

  /** Tạo lệnh thanh toán cho addon chưa trả của booking */
  createAddonCheckout(user: { id: string; role?: string }, bookingId: string) {
    return this.paymentsService.createAddonCheckout(user, bookingId);
  }
}
