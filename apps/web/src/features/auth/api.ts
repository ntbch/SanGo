/** Lớp gọi API cho tính năng xác thực (đặc tả §3.1). */
import { apiFetch } from '../../lib/api/client';
import { type AuthResponse } from '../../lib/api/types';
import { useAuthStore } from '../../lib/auth/auth-store';
import { type ForgotPasswordValues, type LoginValues, type RegisterValues } from './schemas';

export interface MessageResponse {
  message: string;
}

export function login(values: LoginValues): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: values });
}

export function register(values: RegisterValues): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: {
      fullName: values.fullName.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
    },
  });
}

export function forgotPassword(values: ForgotPasswordValues): Promise<MessageResponse> {
  return apiFetch<MessageResponse>('/auth/forgot-password', {
    method: 'POST',
    body: { email: values.email.trim().toLowerCase() },
  });
}

/** Đăng xuất: gọi API xoá refresh cookie rồi luôn dọn trạng thái client. */
export async function logout(): Promise<void> {
  try {
    await apiFetch<MessageResponse | undefined>('/auth/logout', { method: 'POST' });
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
    return await apiFetch<AuthResponse>('/auth/refresh', { method: 'POST' });
  } catch {
    return null;
  }
}
