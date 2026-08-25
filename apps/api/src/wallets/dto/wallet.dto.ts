import { z } from 'zod';

/** Giới hạn nạp demo (F6): đủ ăn điểm demo, chặn giá trị rác. */
export const TOPUP_MIN = 10_000;
export const TOPUP_MAX = 50_000_000;

export const TopupSchema = z.object({
  amount: z
    .number({ errorMap: () => ({ message: 'amount phải là số nguyên (đồng)' }) })
    .int('amount phải là số nguyên (đồng)')
    .min(TOPUP_MIN, 'Số tiền nạp tối thiểu 10.000đ')
    .max(TOPUP_MAX, 'Số tiền nạp tối đa 50.000.000đ'),
});
export type TopupDto = z.infer<typeof TopupSchema>;

export const WalletMeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});
export type WalletMeQueryDto = z.infer<typeof WalletMeQuerySchema>;
