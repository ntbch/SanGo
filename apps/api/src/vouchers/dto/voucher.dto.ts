import { z } from 'zod';

export const CreateVoucherSchema = z.object({
  code: z
    .string()
    .min(3, 'code tối thiểu 3 ký tự')
    .max(40, 'code tối đa 40 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'code chỉ gồm chữ cái, số, dấu gạch dưới và gạch ngang'),
  percentOff: z.number().int().min(1, 'percentOff tối thiểu 1').max(100, 'percentOff tối đa 100'),
  /// Cửa sổ khung giờ thấp điểm theo phút trong ngày (0–1440).
  validFromMinute: z.number().int().min(0).max(1440),
  validToMinute: z.number().int().min(0).max(1440),
  usageLimit: z.number().int().min(1).max(10_000),
  perUserLimit: z.number().int().min(1).max(10).default(1),
  /// Hạn dùng (ISO 8601 có múi giờ) — không truyền là không hạn.
  expiresAt: z.string().datetime({ offset: true }).optional(),
});
export type CreateVoucherDto = z.infer<typeof CreateVoucherSchema>;

export const ApplyVoucherSchema = z.object({
  holdId: z.string().uuid('holdId phải là UUID'),
  code: z.string().min(1, 'code không được trống').max(40),
});
export type ApplyVoucherDto = z.infer<typeof ApplyVoucherSchema>;

export const SetVoucherStatusSchema = z.object({
  active: z.boolean(),
});
export type SetVoucherStatusDto = z.infer<typeof SetVoucherStatusSchema>;
