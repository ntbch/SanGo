import { create } from 'zustand';

import { type AuthUser } from '../api/types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  setSession: (user: AuthUser, accessToken: string) => void;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
}

/**
 * Store xác thực toàn cục (zustand). Access token CHỈ nằm trong bộ nhớ
 * (đặc tả §7) — không persist xuống localStorage để giảm rủi ro XSS;
 * phiên dài hạn dựa vào refresh token trong cookie httpOnly do backend quản.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  setSession: (user, accessToken) => set({ user, accessToken }),
  setUser: (user) => set({ user }),
  clearSession: () => set({ user: null, accessToken: null }),
}));

/** Đọc user ngoài component (dùng trong api client, guards). */
export function getCurrentUser(): AuthUser | null {
  return useAuthStore.getState().user;
}

/** Đọc access token ngoài component. */
export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}
