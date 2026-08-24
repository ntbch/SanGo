import { z } from 'zod';
import { SportType } from '@courthub/shared';

export const CreateCourtSchema = z.object({
  name: z.string().min(1, 'Tên sân con là bắt buộc').max(120),
  sportType: z.nativeEnum(SportType),
  slotMinutes: z.union([z.literal(60), z.literal(90)], {
    errorMap: () => ({ message: 'slotMinutes chỉ nhận 60 hoặc 90' }),
  }),
  defaultPricePerSlot: z.number().int().min(1000, 'Giá tối thiểu 1.000 VND').max(100_000_000),
  status: z.enum(['ACTIVE', 'MAINTENANCE']).optional(),
});
export type CreateCourtDto = z.infer<typeof CreateCourtSchema>;

export const UpdateCourtSchema = CreateCourtSchema.partial();
export type UpdateCourtDto = z.infer<typeof UpdateCourtSchema>;
