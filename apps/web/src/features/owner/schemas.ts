/** Schema form khu owner — khớp DTO backend (CreateVenue/CreateCourt). */
import { z } from 'zod';

export const AMENITY_OPTIONS = [
  'Ánh sáng',
  'Trạm nước',
  'Toilet',
  'Phòng thay đồ',
  'Bãi xe',
  'Ghim bóng miễn phí',
] as const;

export const venueFormSchema = z
  .object({
    name: z.string().min(3, 'Tên sân tối thiểu 3 ký tự').max(120),
    address: z.string().min(5, 'Địa chỉ quá ngắn').max(255),
    /** Toạ độ nhập tay ở GĐ1 (bản đồ chọn điểm là GĐ2). */
    lat: z.coerce.number().min(-90, 'Vĩ độ không hợp lệ').max(90, 'Vĩ độ không hợp lệ'),
    lng: z.coerce.number().min(-180, 'Kinh độ không hợp lệ').max(180, 'Kinh độ không hợp lệ'),
    openHour: z.coerce.number().int().min(0).max(23),
    closeHour: z.coerce.number().int().min(1).max(24),
    depositPercent: z.coerce.number().int().min(0).max(100),
    images: z.array(z.string().url('Ảnh phải là URL hợp lệ')).max(10),
    amenities: z.array(z.string().min(1).max(60)).max(20),
  })
  .refine((values) => values.openHour * 60 < values.closeHour * 60, {
    message: 'Giờ mở cửa phải trước giờ đóng cửa',
    path: ['closeHour'],
  });

export type VenueFormValues = z.infer<typeof venueFormSchema>;

export const courtFormSchema = z.object({
  name: z.string().min(1, 'Tên sân con là bắt buộc').max(120),
  sportType: z.enum(['PICKLEBALL', 'BADMINTON', 'TENNIS', 'FOOTBALL5', 'FOOTBALL7']),
  slotMinutes: z.union([z.literal(60), z.literal(90)], {
    errorMap: () => ({ message: 'Độ dài slot chỉ nhận 60 hoặc 90 phút' }),
  }),
  defaultPricePerSlot: z.coerce
    .number()
    .int('Giá phải là số nguyên VND')
    .min(1000, 'Giá tối thiểu 1.000 VND')
    .max(100_000_000, 'Giá quá lớn'),
});

export type CourtFormValues = z.infer<typeof courtFormSchema>;

/* ===================== F3: Voucher ===================== */

/** 'HH:mm' -> phút trong ngày (0–1440), khớp validFromMinute/validToMinute của BE. */
export function hhmmToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

const DAY_LABELS_HINT = 'Chọn thứ áp dụng';

export const voucherFormSchema = z
  .object({
    code: z
      .string()
      .min(3, 'Mã tối thiểu 3 ký tự')
      .max(40, 'Mã tối đa 40 ký tự')
      .regex(/^[A-Za-z0-9_-]+$/, 'Mã chỉ gồm chữ cái, số, dấu gạch dưới và gạch ngang'),
    percentOff: z.coerce
      .number()
      .int('Phần trăm giảm là số nguyên')
      .min(1, 'Giảm tối thiểu 1%')
      .max(100, 'Giảm tối đa 100%'),
    dayOfWeek: z.coerce.number().int().min(0).max(6, DAY_LABELS_HINT),
    /** 'HH:mm' — chuyển sang phút khi submit. */
    fromTime: z.string().regex(/^\d{2}:\d{2}$/, 'Chọn giờ bắt đầu cửa sổ'),
    toTime: z.string().regex(/^\d{2}:\d{2}$/, 'Chọn giờ kết thúc cửa sổ'),
    usageLimit: z.coerce
      .number()
      .int()
      .min(1, 'Tối thiểu 1 lượt')
      .max(10_000, 'Tối đa 10.000 lượt'),
    perUserLimit: z.coerce.number().int().min(1).max(10, 'Tối đa 10 lượt mỗi người'),
    /** datetime-local; rỗng = không hạn. */
    expiresAt: z.string().optional(),
  })
  .refine((values) => hhmmToMinutes(values.fromTime) < hhmmToMinutes(values.toTime), {
    message: 'Giờ bắt đầu phải trước giờ kết thúc',
    path: ['toTime'],
  });

export type VoucherFormValues = z.infer<typeof voucherFormSchema>;
