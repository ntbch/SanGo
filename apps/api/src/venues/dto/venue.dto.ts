import { z } from 'zod';
import { SportType, isSupportedCity, isValidDistrictForCity } from '@sango/shared';

/**
 * Cascade TP → Quận ở tầng DTO:
 *  - city có mặt nhưng không thuộc SUPPORTED_CITIES -> từ chối (CITY_NOT_SUPPORTED).
 *  - district có mặt -> hợp lệ theo thành phố hiệu dụng (create: thiếu city thì suy ra
 *    mặc định 'Hà Nội' để tránh cặp lệch ngầm với DB default). Update một phần chỉ gửi
 *    1 trường vẫn cho qua ở đây — kiểm tra trạng thái sau merge nằm ở VenuesService.update.
 */
function addLocationChecks<T extends z.ZodTypeAny>(
  schema: T,
  opts: { resolveDefaultCity?: boolean } = {},
): z.ZodEffects<T> {
  return schema.superRefine((value, ctx) => {
    const v = value as { city?: string; district?: string };
    if (v.city !== undefined && !isSupportedCity(v.city)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `CITY_NOT_SUPPORTED: "${v.city}" chưa được hỗ trợ (chỉ Hà Nội, TP. Hồ Chí Minh)`,
        path: ['city'],
      });
    }
    if (v.district === undefined) return;
    const effectiveCity = opts.resolveDefaultCity && v.city === undefined ? 'Hà Nội' : v.city;
    if (!effectiveCity || !isSupportedCity(effectiveCity)) return;
    if (!isValidDistrictForCity(effectiveCity, v.district)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `DISTRICT_NOT_IN_CITY: "${v.district}" không thuộc thành phố "${effectiveCity}"`,
        path: ['district'],
      });
    }
  });
}

/** Tạo venue: owner gửi, status luôn bị server ép về PENDING (đặc tả §3.2). */
export const CreateVenueSchema = z
  .object({
    name: z.string().min(3, 'Tên sân tối thiểu 3 ký tự').max(120),
    address: z.string().min(5, 'Địa chỉ quá ngắn').max(255),
    city: z.string().trim().max(100).default('Hà Nội').optional(),
    district: z.string().trim().max(100).default('Cầu Giấy').optional(),
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
/** Bản create đã kèm cascade TP→Quận (thiếu city suy ra mặc định). */
export const CreateVenueWithLocationSchema = addLocationChecks(CreateVenueSchema, {
  resolveDefaultCity: true,
});

/** Cập nhật: không cho sửa slug/ownerId/status/rejectReason qua endpoint này. */
const UpdateVenueBaseSchema = CreateVenueSchema.innerType().partial();
export const UpdateVenueSchema = addLocationChecks(UpdateVenueBaseSchema);
export type UpdateVenueDto = z.infer<typeof UpdateVenueSchema>;

export const VenueListQuerySchema = z
  .object({
    sportType: z.nativeEnum(SportType).optional(),
    q: z.string().trim().max(100).optional(),
    city: z.string().trim().max(100).optional(),
    district: z.string().trim().max(100).optional(),
    userLat: z.coerce.number().min(-90).max(90).optional(),
    userLng: z.coerce.number().min(-180).max(180).optional(),
    radiusKm: z.coerce.number().positive().max(500).optional(),
    sortBy: z.enum(['distance', 'price_asc', 'price_desc']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  })
  .refine(
    (q) =>
      q.radiusKm === undefined || (typeof q.userLat === 'number' && typeof q.userLng === 'number'),
    {
      message: 'RADIUS_REQUIRES_COORDS: radiusKm yêu cầu phải cung cấp đầy đủ userLat và userLng',
      path: ['radiusKm'],
    },
  );
export type VenueListQueryDto = z.infer<typeof VenueListQuerySchema>;
export const VenuesQuerySchema = VenueListQuerySchema;
export type VenuesQueryDto = VenueListQueryDto;

/** F5 Map nâng cao: Tìm kiếm sân theo khung nhìn bản đồ (bounding box). */
export const VenueMapQuerySchema = z
  .object({
    bbox: z
      .string({ required_error: 'bbox là bắt buộc (minLat,minLng,maxLat,maxLng)' })
      .regex(
        /^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/,
        'bbox phải có định dạng minLat,minLng,maxLat,maxLng',
      ),
    sportType: z.enum(['FOOTBALL', 'FOOTBALL5', 'FOOTBALL7', 'PICKLEBALL', 'BADMINTON', 'TENNIS']).optional(),
    q: z.string().trim().max(100).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .transform((data) => {
    const [minLat, minLng, maxLat, maxLng] = data.bbox.split(',').map(Number);
    return {
      ...data,
      bounds: { minLat, minLng, maxLat, maxLng },
    };
  })
  .refine((d) => d.bounds.minLat <= d.bounds.maxLat && d.bounds.minLng <= d.bounds.maxLng, {
    message: 'Tọa độ bbox không hợp lệ: minLat <= maxLat và minLng <= maxLng',
    path: ['bbox'],
  });
export type VenueMapQueryDto = z.infer<typeof VenueMapQuerySchema>;

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
