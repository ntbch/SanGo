import { z } from 'zod';
import { CreateHoldSchema, type CreateHoldDto } from './booking.dto';

/**
 * P5b — DTO tạo booking (POST /bookings/holds): mở rộng CreateHoldSchema với
 * requiresApproval passthrough (Boolean? — O1).
 * true  = kèo cần duyệt thành viên: POST /bookings/:id/join -> 409 APPROVAL_REQUIRED,
 *         người chơi phải gửi yêu cầu qua POST /matches/:id/requests.
 * null/undefined = DIRECT — join trực tiếp như cũ (kèo cũ không phá, chốt 2026-08-30).
 * CreateHoldSchema là ZodEffects (superRefine) nên nối bằng intersection để giữ
 * nguyên toàn bộ validate gốc thay vì nhân bản logic refine.
 */
export const CreateBookingSchema = CreateHoldSchema.and(
  z.object({
    requiresApproval: z.boolean().nullish(),
  }),
);

export type CreateBookingDto = CreateHoldDto & { requiresApproval?: boolean | null };
