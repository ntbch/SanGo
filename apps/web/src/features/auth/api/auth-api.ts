import { apiClient } from '../../../lib/api-client';
import { User } from '../../../lib/auth-store';
import { UserRole } from '../../../lib/constants';

export interface LoginDto {
  email: string;
  password?: string;
}

export interface RegisterDto {
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
  role: UserRole;
}

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface ChangePasswordDto {
  currentPassword?: string;
  newPassword?: string;
}

export interface UpdateProfileDto {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

export async function loginApi(dto: LoginDto): Promise<AuthSessionResponse> {
  return apiClient<AuthSessionResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(dto),
    skipAuth: true,
  });
}

export async function registerApi(dto: RegisterDto): Promise<AuthSessionResponse> {
  return apiClient<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(dto),
    skipAuth: true,
  });
}

export async function forgotPasswordApi(email: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
    skipAuth: true,
  });
}

export async function resetPasswordApi(token: string, newPassword?: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
    skipAuth: true,
  });
}

export async function changePasswordApi(dto: ChangePasswordDto): Promise<void> {
  return apiClient<void>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateProfileApi(dto: UpdateProfileDto): Promise<User> {
  const res = await apiClient<{ user: User }>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
  return res.user;
}
