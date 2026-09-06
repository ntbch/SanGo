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
  status?: string;
  reputationScore?: number;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: AuthStatus;
  setSession: (user: User, accessToken: string, refreshToken?: string) => void;
  setStatus: (status: AuthStatus) => void;
  logout: () => void;
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

    setSession: (user, accessToken, refreshToken) => {
      localStorage.setItem('sango_access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('sango_refresh_token', refreshToken);
      }
      localStorage.setItem('sango_user', JSON.stringify(user));
      set({ user, accessToken, status: 'authenticated' });
    },

    setStatus: (status) => set({ status }),

    logout: () => {
      localStorage.removeItem('sango_access_token');
      localStorage.removeItem('sango_refresh_token');
      localStorage.removeItem('sango_user');
      set({ user: null, accessToken: null, status: 'unauthenticated' });
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
        set({ user: null, accessToken: null, status: 'unauthenticated' });
        return;
      }

      try {
        const user = JSON.parse(cachedUserStr);
        set({ user, accessToken: token, status: 'authenticated' });
      } catch {
        set({ user: null, accessToken: null, status: 'unauthenticated' });
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
    const token = localStorage.getItem('sango_access_token');
    const userStr = localStorage.getItem('sango_user');
    if (!token || !userStr) {
      useAuthStore.setState({ user: null, accessToken: null, status: 'unauthenticated' });
    }
  });
}
