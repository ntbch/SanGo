/** Lớp gọi API cho tính năng xác thực (đặc tả §3.1). */
import { type ResetPasswordDto } from '@courthub/shared';
import { endpoints } from '../../lib/api/endpoints';
import { apiFetch } from '../../lib/api/client';
import { type AuthResponse } from '../../lib/api/types';
import { useAuthStore } from '../../lib/auth/auth-store';
import {
  type ChangePasswordFormValues,
  type ForgotPasswordDto,
  type LoginDto,
  type RegisterFormValues,
} from './schemas';

export interface MessageResponse {
  message: string;
}

/** Phản hồi quên mật khẩu — mock/dev có thể kèm link đặt lại để demo. */
export interface ForgotPasswordResponse extends MessageResponse {
  /** Chỉ có ở mock mode: link /dat-lai-mat-khau?token=... để mở thẳng form. */
  devResetLink?: string;
}

export function login(values: LoginDto): Promise<AuthResponse> {
  return apiFetch<AuthResponse>(endpoints.auth.login(), { method: 'POST', body: values });
}

export function register(values: RegisterFormValues): Promise<AuthResponse> {
  return apiFetch<AuthResponse>(endpoints.auth.register(), {
    method: 'POST',
    body: {
      fullName: values.fullName.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
      ...(values.phone !== undefined ? { phone: values.phone.trim() } : {}),
    },
  });
}

export async function forgotPassword(values: ForgotPasswordDto): Promise<ForgotPasswordResponse> {
  // API thật (dev, NODE_ENV!=production): backend trả raw token qua header
  // X-Dev-Reset-Token — đây là path chính để xây link đặt lại; devResetLink
  // trong body chỉ là cơ chế tương đương của mock (mock không có lớp HTTP).
  let devToken: string | undefined;
  const response = await apiFetch<ForgotPasswordResponse>(endpoints.auth.forgotPassword(), {
    method: 'POST',
    body: { email: values.email.trim().toLowerCase() },
    onResponse: (res) => {
      const token = res.headers.get('X-Dev-Reset-Token');
      if (token !== null && token !== '') devToken = token;
    },
  });
  return devToken !== undefined
    ? { ...response, devResetLink: '/dat-lai-mat-khau?token=' + devToken }
    : response;
}

/** Đặt lại mật khẩu bằng token từ email — API trả 204 không body. */
export async function requestResetPassword(values: ResetPasswordDto): Promise<void> {
  await apiFetch<undefined>(endpoints.auth.resetPassword(), {
    method: 'POST',
    body: { token: values.token, newPassword: values.newPassword },
  });
}

/** Đổi mật khẩu khi đang đăng nhập — API trả 204 và thu hồi mọi phiên cũ. */
export async function changePassword(values: ChangePasswordFormValues): Promise<void> {
  await apiFetch<undefined>(endpoints.auth.changePassword(), {
    method: 'POST',
    body: { currentPassword: values.currentPassword, newPassword: values.newPassword },
  });
}

/** Đăng xuất: gọi API xoá refresh cookie rồi luôn dọn trạng thái client. */
export async function logout(): Promise<void> {
  try {
    await apiFetch<MessageResponse | undefined>(endpoints.auth.logout(), { method: 'POST' });
  } finally {
    useAuthStore.getState().clearSession();
  }
}

/**
 * Khôi phục phiên sau F5: nhờ cookie refresh httpOnly đổi lấy access token mới.
 * Trả về null nếu cookie hết hạn/không có (chưa từng đăng nhập).
 */
export async function restoreSession(): Promise<AuthResponse | null> {
  try {
    return await apiFetch<AuthResponse>(endpoints.auth.refresh(), { method: 'POST' });
  } catch {
    return null;
  }
}
