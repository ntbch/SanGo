/**
 * Schema form xác thực của web — NỀN là schema dùng chung từ @courthub/shared
 * (nguồn chính tắc: apps/api/src/auth/dto/auth.dto.ts). Phần UI-only
 * (confirmPassword + refine khớp mật khẩu, tiền xử lý phone rỗng → undefined)
 * được GIỮ lại ở web theo quyết định của captain.
 */
import { z } from 'zod';
import {
  forgotPasswordSchema,
  loginSchema,
  passwordSchema,
  registerSchema as registerSchemaBase,
  resetPasswordSchema,
  type ForgotPasswordDto,
  type LoginDto,
  type RegisterDto,
} from '@courthub/shared';

// Dùng lại nguyên xi từ shared:
export { forgotPasswordSchema, loginSchema };
export type { LoginDto, ForgotPasswordDto };

/** Form đặt lại mật khẩu = DTO API + confirm (UI-only). */
export const resetPasswordFormSchema = z
  .object({
    token: resetPasswordSchema.shape.token,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp.',
    path: ['confirmPassword'],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

/** Form đổi mật khẩu (đã đăng nhập) = DTO API + confirm (UI-only). */
export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp.',
    path: ['confirmPassword'],
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

/**
 * Form đăng ký = DTO API + confirmPassword (UI-only). Phone rỗng được tiền xử
 * lý thành undefined để regex optional của shared không báo lỗi khi bỏ trống.
 */
export const registerFormSchema = z
  .object({
    email: registerSchemaBase.shape.email,
    password: registerSchemaBase.shape.password,
    fullName: registerSchemaBase.shape.fullName,
    phone: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      registerSchemaBase.shape.phone,
    ),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp.',
    path: ['confirmPassword'],
  });

/** Giá trị form đăng ký: DTO API + confirmPassword. */
export type RegisterFormValues = RegisterDto & { confirmPassword: string };
