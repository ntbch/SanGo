import { z } from 'zod';
import { SportType } from '@prisma/client';

export const CreateTeamSchema = z.object({
  name: z.string().trim().min(2, 'Tên đội tối thiểu 2 ký tự').max(100, 'Tên đội tối đa 100 ký tự'),
  logoUrl: z.string().url('logoUrl phải là URL hợp lệ').optional().or(z.literal('')),
  description: z.string().trim().max(500, 'Mô tả tối đa 500 ký tự').optional(),
  sportType: z.nativeEnum(SportType, { errorMap: () => ({ message: 'sportType không hợp lệ' }) }),
});
export type CreateTeamDto = z.infer<typeof CreateTeamSchema>;

export const UpdateTeamSchema = CreateTeamSchema.partial();
export type UpdateTeamDto = z.infer<typeof UpdateTeamSchema>;

export const InviteMemberSchema = z.object({
  userId: z.string().uuid('userId phải là UUID'),
  role: z.enum(['CAPTAIN', 'MEMBER']).default('MEMBER'),
});
export type InviteMemberDto = z.infer<typeof InviteMemberSchema>;

export const RespondInviteSchema = z.object({
  accept: z.boolean({ required_error: 'accept là bắt buộc (true/false)' }),
});
export type RespondInviteDto = z.infer<typeof RespondInviteSchema>;

export const CreateExpenseShareSchema = z.object({
  bookingId: z.string().uuid('bookingId phải là UUID').optional(),
  debtorId: z.string().uuid('debtorId phải là UUID'),
  amount: z.number().int().positive('Số tiền chia phải là số nguyên dương (đồng)'),
  note: z.string().trim().max(200).optional(),
});
export type CreateExpenseShareDto = z.infer<typeof CreateExpenseShareSchema>;

export const SplitBookingExpenseSchema = z.object({
  bookingId: z.string().uuid('bookingId phải là UUID'),
  memberIds: z.array(z.string().uuid('memberId phải là UUID')).min(1, 'Chọn ít nhất 1 thành viên để chia tiền'),
  note: z.string().trim().max(200).optional(),
});
export type SplitBookingExpenseDto = z.infer<typeof SplitBookingExpenseSchema>;

export const UpdateExpenseShareStatusSchema = z.object({
  status: z.enum(['UNPAID', 'PAID'], { errorMap: () => ({ message: 'status chỉ nhận UNPAID hoặc PAID' }) }),
});
export type UpdateExpenseShareStatusDto = z.infer<typeof UpdateExpenseShareStatusSchema>;
