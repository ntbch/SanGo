import { UserRole } from '@courthub/shared';
import { beforeEach, describe, expect, it } from 'vitest';

import { getCurrentUser, useAuthStore } from './auth-store';
import { type AuthUser } from '../api/types';

const sampleUser: AuthUser = {
  id: 'u-1',
  email: 'test@courthub.vn',
  fullName: 'Người Dùng Thử',
  role: UserRole.CUSTOMER,
};

describe('auth-store', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
  });

  it('ban đầu chưa đăng nhập', () => {
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(getCurrentUser()).toBeNull();
  });

  it('setSession lưu cả user và access token trong bộ nhớ', () => {
    useAuthStore.getState().setSession(sampleUser, 'token-abc');

    expect(useAuthStore.getState().user?.email).toBe('test@courthub.vn');
    expect(useAuthStore.getState().accessToken).toBe('token-abc');
  });

  it('setUser cập nhật riêng thông tin user nhưng giữ nguyên token', () => {
    useAuthStore.getState().setSession(sampleUser, 'token-abc');
    useAuthStore.getState().setUser({ ...sampleUser, fullName: 'Tên Mới' });

    expect(useAuthStore.getState().user?.fullName).toBe('Tên Mới');
    expect(useAuthStore.getState().accessToken).toBe('token-abc');
  });

  it('clearSession xoá sạch phiên đăng nhập', () => {
    useAuthStore.getState().setSession(sampleUser, 'token-abc');
    useAuthStore.getState().clearSession();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
