import { z } from 'zod';
import { VenueStatus } from '@courthub/shared';

export const AdminVenueListQuerySchema = z.object({
  status: z.nativeEnum(VenueStatus).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type AdminVenueListQueryDto = z.infer<typeof AdminVenueListQuerySchema>;

export const RejectVenueSchema = z.object({
  reason: z.string().trim().min(4, 'Vui lòng nêu lý do từ chối (tối thiểu 4 ký tự)').max(500),
});
export type RejectVenueDto = z.infer<typeof RejectVenueSchema>;
