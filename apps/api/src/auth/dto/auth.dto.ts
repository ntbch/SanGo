import { z } from 'zod';

/** Mật khẩu: tối thiểu 8 ký tự, tối đa 72 (giới hạn của bcrypt). */
export const passwordSchema = z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(72);

export const RegisterSchema = z.object({
  email: z.string().email('Email không hợp lệ').max(254),
  password: passwordSchema,
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(80),
  phone: z
    .string()
    .regex(/^0\d{8,10}$/, 'Số điện thoại Việt Nam không hợp lệ (vd: 0901234567)')
    .optional(),
});
export type RegisterDto = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: passwordSchema,
});
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: passwordSchema,
});
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
