import { type UserRole } from '@courthub/shared';

/** Người dung tối giản client cần sau khi đăng nhập (payload auth của API). */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
}

/** Phản hồi chuẩn của login / register / refresh: access token mới + user. */
export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}
