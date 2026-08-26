import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { NotificationType } from '@sango/shared';
import { PrismaService } from '../prisma/prisma.service';
import { roundVnd } from '../bookings/pricing.util';
import { NotifyService } from '../notifications/notify.service';
import type { ApplyVoucherDto, CreateVoucherDto, UpdateVoucherDto } from './dto/voucher.dto';

/**
 * F3 Voucher — áp mã giảm giá PERCENT vào BookingHold.
 *
 * Nguyên tắc (roadmap v5):
 * - SNAPSHOT discountAmount/finalAmount NGAY LÚC ÁP MÃ vì callback VNPay recompute
 *   giá rồi so vnp_Amount — phải đọc giá đã chốt từ hold.
 * - Chặn lạm dụng: usageLimit bằng UPDATE ... WHERE usedCount < usageLimit (atomic),
 *   mỗi user giới hạn bởi UNIQUE(voucherId, userId).
 */
@Injectable()
export class VouchersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: NotifyService,
  ) {}

  async createVoucher(
    owner: Pick<User, 'id'>,
    dto: CreateVoucherDto,
  ): Promise<{ id: string; code: string }> {
    if (dto.validFromMinute >= dto.validToMinute) {
      throw new BadRequestException({
        message: 'Cửa sổ giờ không hợp lệ (validFromMinute phải nhỏ hơn validToMinute)',
        code: 'VOUCHER_BAD_WINDOW',
      });
    }
    const voucher = await this.prisma.voucher.create({
      data: {
        code: dto.code,
        percentOff: dto.percentOff,
        dayOfWeek: dto.dayOfWeek,
        validFromMinute: dto.validFromMinute,
        validToMinute: dto.validToMinute,
        usageLimit: dto.usageLimit,
        perUserLimit: dto.perUserLimit,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        ownerId: owner.id,
      },
      select: { id: true, code: true },
    });
    return voucher;
  }

  async listOwnVouchers(ownerId: string) {
    return this.prisma.voucher.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { redemptions: true } } },
    });
  }

  /** Cập nhật một phần voucher (kể cả active/status) — chỉ owner của mã được phép. */
  async updateVoucher(ownerId: string, voucherId: string, dto: UpdateVoucherDto): Promise<void> {
    if (
      dto.validFromMinute !== undefined &&
      dto.validToMinute !== undefined &&
      dto.validFromMinute >= dto.validToMinute
    ) {
      throw new BadRequestException({
        message: 'Cửa sổ giờ không hợp lệ (validFromMinute phải nhỏ hơn validToMinute)',
        code: 'VOUCHER_BAD_WINDOW',
      });
    }
    const updated = await this.prisma.voucher.updateMany({
      where: { id: voucherId, ownerId },
      data: {
        ...(dto.percentOff !== undefined ? { percentOff: dto.percentOff } : {}),
        ...(dto.dayOfWeek !== undefined ? { dayOfWeek: dto.dayOfWeek } : {}),
        ...(dto.validFromMinute !== undefined ? { validFromMinute: dto.validFromMinute } : {}),
        ...(dto.validToMinute !== undefined ? { validToMinute: dto.validToMinute } : {}),
        ...(dto.usageLimit !== undefined ? { usageLimit: dto.usageLimit } : {}),
        ...(dto.perUserLimit !== undefined ? { perUserLimit: dto.perUserLimit } : {}),
        ...(dto.expiresAt !== undefined
          ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }
          : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
    if (updated.count === 0) {
      throw new NotFoundException({ message: 'Không tìm thấy voucher', code: 'VOUCHER_NOT_FOUND' });
    }
  }

  /** Xoá hẳn mã — hold đã áp vẫn giữ giá đã snapshot (voucherId không FK). */
  async deleteVoucher(ownerId: string, voucherId: string): Promise<void> {
    const deleted = await this.prisma.voucher.deleteMany({ where: { id: voucherId, ownerId } });
    if (deleted.count === 0) {
      throw new NotFoundException({ message: 'Không tìm thấy voucher', code: 'VOUCHER_NOT_FOUND' });
    }
  }

  /**
   * Áp mã vào hold của chính mình — CHỈ SNAPSHOT GIÁ (discountAmount/finalAmount/voucherId)
   * vào hold ngay lúc áp mã: callback VNPay recompute giá rồi so vnp_Amount nên phải đọc
   * giá đã chốt từ hold; voucher bị tắt/hết hạn sau đó không làm lệch số tiền đã xem.
   * QUOTA KHÔNG tiêu ở đây — consume redemption trong tx confirmFromHold (atomic,
   * pattern BookingCodeSeq) để hold hết hạn/không thanh toán không đốt lượt dùng.
   */
  async applyToHold(
    user: Pick<User, 'id'>,
    dto: ApplyVoucherDto & { holdId: string },
  ): Promise<{
    holdId: string;
    code: string;
    percentOff: number;
    subtotal: number;
    discountAmount: number;
    finalAmount: number;
  }> {
    const hold = await this.prisma.bookingHold.findUnique({
      where: { id: dto.holdId },
      include: { court: { include: { venue: { select: { ownerId: true } } } } },
    });
    if (!hold) {
      throw new NotFoundException({ message: 'Không tìm thấy hold', code: 'HOLD_NOT_FOUND' });
    }
    if (hold.userId !== user.id) {
      throw new NotFoundException({ message: 'Không tìm thấy hold', code: 'HOLD_NOT_FOUND' });
    }
    if (hold.status !== 'ACTIVE') {
      throw new ConflictException({ message: 'Hold không còn hiệu lực', code: 'HOLD_EXPIRED' });
    }
    if (hold.expiresAt <= new Date()) {
      throw new ConflictException({ message: 'Hold đã hết hạn', code: 'HOLD_EXPIRED' });
    }
    if (hold.discountAmount !== null) {
      throw new ConflictException({
        message: 'Hold này đã áp voucher rồi',
        code: 'VOUCHER_ALREADY_APPLIED',
      });
    }

    const voucher = await this.prisma.voucher.findUnique({ where: { code: dto.code } });
    if (!voucher || !voucher.active || (voucher.expiresAt && voucher.expiresAt <= new Date())) {
      // Không phân biệt mã lạ với mã hết hạn/bị tắt để không dò mã.
      throw new NotFoundException({ message: 'Mã không khả dụng', code: 'VOUCHER_NOT_FOUND' });
    }
    if (voucher.ownerId !== hold.court.venue.ownerId) {
      throw new BadRequestException({
        message: 'Mã không áp dụng cho sân này',
        code: 'VOUCHER_NOT_APPLICABLE',
      });
    }
    // Cửa sổ khung giờ thấp điểm: đúng thứ trong tuần + khoảng chơi nằm trọn cửa sổ.
    // date lưu @db.Date (nửa đêm UTC) nên lấy thứ bằng getUTCDay() cho tất định.
    if (hold.date.getUTCDay() !== voucher.dayOfWeek) {
      throw new BadRequestException({
        message: 'Mã chỉ áp dụng cho ngày trong tuần cụ thể',
        code: 'VOUCHER_OUT_OF_WINDOW',
      });
    }
    if (hold.startMinute < voucher.validFromMinute || hold.endMinute > voucher.validToMinute) {
      throw new BadRequestException({
        message: `Mã chỉ áp dụng cho khung giờ ${voucher.validFromMinute}-${voucher.validToMinute} phút`,
        code: 'VOUCHER_OUT_OF_WINDOW',
      });
    }
    const usedByUser = await this.prisma.voucherRedemption.count({
      where: { voucherId: voucher.id, userId: user.id },
    });
    if (usedByUser >= voucher.perUserLimit) {
      throw new ConflictException({
        message: 'Bạn đã dùng hết lượt cho mã này',
        code: 'VOUCHER_USER_LIMIT',
      });
    }

    const discountAmount = Math.min(
      roundVnd((hold.subtotal * voucher.percentOff) / 100),
      hold.subtotal,
    );
    const finalAmount = hold.subtotal - discountAmount;

    // Snapshot giá + liên kết voucher vào hold. Per-user check ở trên chỉ là báo sớm:
    // gate chính thức (quota + UNIQUE) nằm trong tx confirmFromHold.
    await this.prisma.bookingHold.update({
      where: { id: hold.id },
      data: { discountAmount, finalAmount, voucherId: voucher.id },
    });

    // F8 wave-1: thông báo VOUCHER — gọi SAU khi transaction áp mã đã commit.
    await this.notify
      .dispatch({
        userId: user.id,
        type: NotificationType.VOUCHER,
        title: 'Áp dụng mã giảm giá thành công',
        body: `Mã ${voucher.code} giảm ${discountAmount.toLocaleString('vi-VN')}đ. Giá cần thanh toán còn ${finalAmount.toLocaleString('vi-VN')}đ.`,
        link: '/dat-san',
      })
      .catch(() => undefined); // best-effort: lỗi thông báo không chặn kết quả áp mã

    return {
      holdId: hold.id,
      code: voucher.code,
      percentOff: voucher.percentOff,
      subtotal: hold.subtotal,
      discountAmount,
      finalAmount,
    };
  }
}
