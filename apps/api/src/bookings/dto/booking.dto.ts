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
