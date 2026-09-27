import { create } from 'zustand';
import { UserRole } from './constants';
import { apiClient } from './api-client';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  avatarUrl?: string | null;
  bio?: string | null;
  notifyEmail?: boolean;
  notifyInApp?: boolean;
  status?: string;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: AuthStatus;
  setSession: (user: User, accessToken: string, refreshToken?: string) => void;
  setStatus: (status: AuthStatus) => void;
  logout: () => Promise<boolean>;
  logoutError: string | null;
  restoreSession: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const getInitialAuthState = (): { user: User | null; accessToken: string | null; status: AuthStatus } => {
  if (typeof window === 'undefined') {
    return { user: null, accessToken: null, status: 'idle' };
  }
  try {
    const token = localStorage.getItem('sango_access_token');
    const userStr = localStorage.getItem('sango_user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      return {
        user,
        accessToken: token,
        status: 'authenticated',
      };
    }
  } catch {}
  return { user: null, accessToken: null, status: 'unauthenticated' };
};

export const useAuthStore = create<AuthState>((set, get) => {
  const initial = getInitialAuthState();

  return {
    user: initial.user,
    accessToken: initial.accessToken,
    status: initial.status,
    logoutError: null,

    setSession: (user, accessToken, refreshToken) => {
      localStorage.setItem('sango_access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('sango_refresh_token', refreshToken);
      }
      localStorage.setItem('sango_user', JSON.stringify(user));
      set({ user, accessToken, status: 'authenticated', logoutError: null });
    },

    setStatus: (status) => set({ status }),

    logout: async () => {
      set({ logoutError: null });
      try {
        await apiClient('/auth/logout', { method: 'POST', skipAuth: true });
      } catch {
        set({ logoutError: 'Chưa thể thu hồi phiên đăng nhập. Kiểm tra kết nối và thử đăng xuất lại.' });
        return false;
      }
      localStorage.removeItem('sango_access_token');
      localStorage.removeItem('sango_refresh_token');
      localStorage.removeItem('sango_user');
      set({ user: null, accessToken: null, status: 'unauthenticated', logoutError: null });
      return true;
    },

    updateUser: (partialUser) => {
      const current = get().user;
      if (current) {
        const updated = { ...current, ...partialUser };
        localStorage.setItem('sango_user', JSON.stringify(updated));
        set({ user: updated });
      }
    },

    restoreSession: async () => {
      const token = localStorage.getItem('sango_access_token');
      const cachedUserStr = localStorage.getItem('sango_user');

      if (!token || !cachedUserStr) {
        set({ user: null, accessToken: null, status: 'unauthenticated', logoutError: null });
        return;
      }

      try {
        const user = JSON.parse(cachedUserStr);
        set({ user, accessToken: token, status: 'authenticated' });
      } catch {
        set({ user: null, accessToken: null, status: 'unauthenticated', logoutError: null });
        return;
      }

      try {
        const res = await apiClient<{ user: User }>('/users/me');
        const freshUser = res?.user;
        if (freshUser && freshUser.id) {
          localStorage.setItem('sango_user', JSON.stringify(freshUser));
          set({ user: freshUser, accessToken: localStorage.getItem('sango_access_token'), status: 'authenticated' });
        }
      } catch {
        // Nếu token hết hạn và không refresh được, apiClient đã tự chuyển event sango_auth_change
      }
    },
  };
});

if (typeof window !== 'undefined') {
  window.addEventListener('sango_auth_change', () => {
    // logoutError chỉ có nghĩa khi phiên vẫn còn hiệu lực; khi phiên đã chết thì phải xoá để không bị treo thông báo.
    useAuthStore.setState({ ...getInitialAuthState(), logoutError: null });
  });
}
