import { z } from 'zod';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** GET /courts/:courtId/slots?from=YYYY-MM-DD&days=7 */
export const SlotsQuerySchema = z.object({
  from: z.string().regex(DATE_RE, 'from phải là YYYY-MM-DD'),
  days: z.coerce.number().int().min(1).max(14).default(7),
});
export type SlotsQueryDto = z.infer<typeof SlotsQuerySchema>;

/**
 * POST /bookings/holds — spec §6.1: {courtId, date, slots[]}.
 * slots = mảng phút BẮT ĐẦU các slot liền kề (vd [1020,1110] cho 2 slot 90').
 */
export const CreateHoldSchema = z.object({
  courtId: z.string().uuid('courtId phải là UUID'),
  date: z.string().regex(DATE_RE, 'date phải là YYYY-MM-DD'),
  slots: z
    .array(z.number().int().min(0).max(1439))
    .min(1, 'Chọn ít nhất một slot')
    .max(8, 'Tối đa 8 slot liền kề mỗi lần giữ'),
});
export type CreateHoldDto = z.infer<typeof CreateHoldSchema>;

export const CancelBookingSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});
export type CancelBookingDto = z.infer<typeof CancelBookingSchema>;
export const CreateReviewSchema = z.object({
  rating: z.number().int().min(1, 'Chấm từ 1 đến 5 sao').max(5, 'Chấm từ 1 đến 5 sao'),
  comment: z.string().trim().min(4, 'Nhận xét tối thiểu 4 ký tự').max(500),
});
export type CreateReviewDto = z.infer<typeof CreateReviewSchema>;
export const MyBookingsQuerySchema = z.object({
  filter: z.enum(['upcoming', 'history', 'cancelled']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type MyBookingsQueryDto = z.infer<typeof MyBookingsQuerySchema>;

export const CheckInSchema = z.object({
  code: z.string().trim().min(1, 'Mã đơn là bắt buộc'),
});
export type CheckInDto = z.infer<typeof CheckInSchema>;

export const OwnerBookingsQuerySchema = z.object({
  venueId: z.string().uuid('venueId phải là UUID'),
  date: z.string().regex(DATE_RE, 'date phải là YYYY-MM-DD').optional(),
  status: z.enum(['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type OwnerBookingsQueryDto = z.infer<typeof OwnerBookingsQuerySchema>;
