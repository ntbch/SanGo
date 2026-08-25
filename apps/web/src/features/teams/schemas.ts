/** Zod schemas cho form F1 Teams — khớp CreateTeamSchema backend. */
import { z } from 'zod';

export const createTeamFormSchema = z.object({
  name: z.string().trim().min(2, 'Tên đội tối thiểu 2 ký tự').max(100, 'Tên đội tối đa 100 ký tự'),
  logoUrl: z.string().url('Logo phải là URL hợp lệ').optional().or(z.literal('')),
  description: z.string().trim().max(500, 'Mô tả tối đa 500 ký tự').optional(),
  sportType: z.enum(['PICKLEBALL', 'BADMINTON', 'TENNIS', 'FOOTBALL5', 'FOOTBALL7'], {
    errorMap: () => ({ message: 'Chọn môn thể thao' }),
  }),
});

export type CreateTeamFormValues = z.infer<typeof createTeamFormSchema>;

export const inviteMemberFormSchema = z.object({
  userId: z.string().uuid('userId phải là UUID'),
});

export const expenseShareFormSchema = z.object({
  debtorId: z.string().min(1, 'Chọn người ghi nợ'),
  amount: z.coerce.number().int('Số tiền là số nguyên').positive('Số tiền phải dương'),
  note: z.string().trim().max(200, 'Ghi chú tối đa 200 ký tự').optional(),
});

export type ExpenseShareFormValues = z.infer<typeof expenseShareFormSchema>;
