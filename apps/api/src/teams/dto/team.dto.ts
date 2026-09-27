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
  userId: z.string().uuid('userId phải là UUID').optional(),
  email: z.string().trim().toLowerCase().email('Email không hợp lệ').optional(),
  role: z.literal('MEMBER').default('MEMBER'),
}).refine((dto) => Boolean(dto.userId) !== Boolean(dto.email), {
  message: 'Cung cấp userId hoặc email của người được mời',
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
  bookingId: z.string().uuid('bookingId phải là UUID').optional(),
  bookingCode: z.string().trim().min(1).max(100).optional(),
  memberIds: z
    .array(z.string().uuid('memberId phải là UUID'))
    .min(1, 'Chọn ít nhất 1 thành viên để chia tiền'),
  note: z.string().trim().max(200).optional(),
}).refine((dto) => Boolean(dto.bookingId) !== Boolean(dto.bookingCode), {
  message: 'Cung cấp bookingId hoặc bookingCode',
});
export type SplitBookingExpenseDto = z.infer<typeof SplitBookingExpenseSchema>;

export const UpdateExpenseShareStatusSchema = z.object({
  status: z.enum(['UNPAID', 'PAID'], {
    errorMap: () => ({ message: 'status chỉ nhận UNPAID hoặc PAID' }),
  }),
});
export type UpdateExpenseShareStatusDto = z.infer<typeof UpdateExpenseShareStatusSchema>;

// P5: Team Treasury DTOs

export const CreateFundDriveSchema = z.object({
  title: z.string().trim().min(2, 'Tiêu đề tối thiểu 2 ký tự').max(100),
  description: z.string().trim().max(500).optional(),
  scope: z.enum(['MONTHLY', 'MATCH']).default('MONTHLY'),
  targetAmount: z.number().int().positive('Mục tiêu phải là số nguyên dương'),
  amountPerMember: z.number().int().positive('Số tiền mỗi thành viên phải là số nguyên dương'),
  bookingId: z.string().uuid('bookingId phải là UUID').optional(),
  deadline: z.string().datetime().optional(),
});
export type CreateFundDriveDto = z.infer<typeof CreateFundDriveSchema>;

export const ContributeFundSchema = z.object({
  amount: z.number().int().positive('Số tiền đóng phải là số nguyên dương (VND)'),
  note: z.string().trim().max(200).optional(),
});
export type ContributeFundDto = z.infer<typeof ContributeFundSchema>;

export const CreateTeamExpenseSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).default('EXPENSE'),
  amount: z.number().int().positive('Số tiền phải là số nguyên dương (VND)'),
  reason: z.string().trim().min(2, 'Lý do tối thiểu 2 ký tự').max(255).optional(),
  title: z.string().trim().min(2, 'Tiêu đề tối thiểu 2 ký tự').max(255).optional(),
  receiptUrl: z.string().url('Link ảnh hóa đơn không hợp lệ').optional().or(z.literal('')),
  billImageUrl: z.string().url('Link ảnh hóa đơn không hợp lệ').optional().or(z.literal('')),
  occurredAt: z.string().datetime().optional(),
});
export type CreateTeamExpenseDto = z.infer<typeof CreateTeamExpenseSchema>;
