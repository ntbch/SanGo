import { z } from 'zod';

/** Đồng bộ ràng buộc BE (wallets/dto/wallet.dto.ts): nạp tối thiểu 10.000₫, tối đa 50.000.000₫. */
export const TOPUP_MIN = 10_000;
export const TOPUP_MAX = 50_000_000;

export const TopupFormSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: 'Số tiền nạp phải là số' })
    .int('Số tiền nạp phải là số nguyên')
    .min(TOPUP_MIN, `Số tiền nạp tối thiểu ${TOPUP_MIN.toLocaleString('vi-VN')}₫`)
    .max(TOPUP_MAX, `Số tiền nạp tối đa ${TOPUP_MAX.toLocaleString('vi-VN')}₫`),
});
export type TopupFormValues = z.infer<typeof TopupFormSchema>;
