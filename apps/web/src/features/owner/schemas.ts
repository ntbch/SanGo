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
