import { z } from 'zod';

export const CreateVoucherSchema = z.object({
  code: z
    .string()
    .min(3, 'code tối thiểu 3 ký tự')
    .max(40, 'code tối đa 40 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'code chỉ gồm chữ cái, số, dấu gạch dưới và gạch ngang'),
  percentOff: z.number().int().min(1, 'percentOff tối thiểu 1').max(100, 'percentOff tối đa 100'),
  /// Cửa sổ khung giờ thấp điểm: thứ trong tuần (0=CN..6=7, khớp getUTCDay()).
  dayOfWeek: z.number().int().min(0).max(6),
  /// Khoảng phút trong ngày của cửa sổ (0–1440).
  validFromMinute: z.number().int().min(0).max(1440),
  validToMinute: z.number().int().min(0).max(1440),
  usageLimit: z.number().int().min(1).max(10_000),
  perUserLimit: z.number().int().min(1).max(10).default(1),
  /// Hạn dùng (ISO 8601 có múi giờ) — không truyền là không hạn.
  expiresAt: z.string().datetime({ offset: true }).optional(),
});
export type CreateVoucherDto = z.infer<typeof CreateVoucherSchema>;

/** PATCH /owner/vouchers/:id — cập nhật một phần; code không cho đổi. */
export const UpdateVoucherSchema = CreateVoucherSchema.omit({ code: true })
  .partial()
  .extend({ active: z.boolean().optional() });
export type UpdateVoucherDto = z.infer<typeof UpdateVoucherSchema>;

export const ApplyVoucherSchema = z.object({
  code: z.string().min(1, 'code không được trống').max(40),
});
export type ApplyVoucherDto = z.infer<typeof ApplyVoucherSchema>;

/** :id trên path phải là UUID. */
export const VoucherIdParamSchema = z.object({ id: z.string().uuid('id phải là UUID') });
export type VoucherIdParamDto = z.infer<typeof VoucherIdParamSchema>;
