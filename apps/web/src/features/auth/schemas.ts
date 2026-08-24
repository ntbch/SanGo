/**
 * Zod schema cho các form xác thực — nguồn chân lý của validate phía client.
 * TODO(shared): khi backend (task T3) chốt DTO, dời nhóm schema này lên
 * packages/shared để web + api dùng chung; hiện đặt tại web vì phạm vi T7
 * chỉ gồm apps/web/src/**.
 */
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc.').email('Email không hợp lệ.'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự.'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự.').max(80, 'Họ tên tối đa 80 ký tự.'),
    email: z.string().min(1, 'Email là bắt buộc.').email('Email không hợp lệ.'),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự.').max(72, 'Mật khẩu tối đa 72 ký tự.'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp.',
    path: ['confirmPassword'],
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email là bắt buộc.').email('Email không hợp lệ.'),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
