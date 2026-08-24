/**
 * Zod schema xác thực dùng chung web + api.
 * Nguồn chính tắc: apps/api/src/auth/dto/auth.dto.ts — message giữ nguyên văn
 * của backend; instance đặt camelCase, type infer theo tên DTO của API
 * (quyết định của captain theo đề xuất backend-api).
 */
import { z } from 'zod';

/** Mật khẩu: tối thiểu 8 ký tự, tối đa 72 (giới hạn của bcrypt). */
export const passwordSchema = z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(72);

export const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ').max(254),
  password: passwordSchema,
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(80),
  phone: z
    .string()
    .regex(/^0\d{8,10}$/, 'Số điện thoại Việt Nam không hợp lệ (vd: 0901234567)')
    .optional(),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: passwordSchema,
});
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
