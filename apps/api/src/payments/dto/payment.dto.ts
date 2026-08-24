import { z } from 'zod';

export const CheckoutSchema = z.object({
  holdId: z.string().uuid('holdId phải là UUID'),
  type: z.enum(['DEPOSIT', 'FULL'], {
    errorMap: () => ({ message: 'type chỉ nhận DEPOSIT hoặc FULL' }),
  }),
});
export type CheckoutDto = z.infer<typeof CheckoutSchema>;
