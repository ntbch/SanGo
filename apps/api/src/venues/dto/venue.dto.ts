import { z } from 'zod';
import { SportType } from '@courthub/shared';

/** Tạo venue: owner gửi, status luôn bị server ép về PENDING (đặc tả §3.2). */
export const CreateVenueSchema = z
  .object({
    name: z.string().min(3, 'Tên sân tối thiểu 3 ký tự').max(120),
    address: z.string().min(5, 'Địa chỉ quá ngắn').max(255),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    openMinute: z.number().int().min(0).max(1440),
    closeMinute: z.number().int().min(0).max(1440),
    depositPercent: z.number().int().min(0).max(100).optional(),
    images: z.array(z.string().url('Ảnh phải là URL')).max(10).optional(),
    amenities: z.array(z.string().min(1).max(60)).max(20).optional(),
  })
  .refine((v) => v.openMinute < v.closeMinute, {
    message: 'Giờ mở cửa phải trước giờ đóng cửa',
    path: ['closeMinute'],
  });
export type CreateVenueDto = z.infer<typeof CreateVenueSchema>;

/** Cập nhật: không cho sửa slug/ownerId/status/rejectReason qua endpoint này. */
export const UpdateVenueSchema = CreateVenueSchema.innerType().partial();
export type UpdateVenueDto = z.infer<typeof UpdateVenueSchema>;

export const VenueListQuerySchema = z.object({
  sportType: z.nativeEnum(SportType).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
export type VenueListQueryDto = z.infer<typeof VenueListQuerySchema>;

export const OwnerVenueListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type OwnerVenueListQueryDto = z.infer<typeof OwnerVenueListQuerySchema>;
export const ReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(50).default(10),
});
export type ReviewsQueryDto = z.infer<typeof ReviewsQuerySchema>;
