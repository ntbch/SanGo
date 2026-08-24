import { UserRole } from '@courthub/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../auth/auth-store';
import { ApiError } from './api-error';
import { apiFetch } from './client';
import { type AuthResponse, type AuthUser } from './types';

const sampleUser: AuthUser = {
  id: 'u-1',
  email: 'test@courthub.vn',
  fullName: 'Người Dùng Thử',
  role: UserRole.CUSTOMER,
};

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('apiFetch — chế độ mock', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_USE_MOCK', 'true');
    useAuthStore.getState().clearSession();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('login mock hợp lệ trả về user + access token', async () => {
    const result = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email: 'owner@courthub.vn', password: '12345678' },
    });

    expect(result.accessToken).toMatch(/^mock-access-/);
    expect(result.user.role).toBe(UserRole.OWNER);
  });

  it('sai mật khẩu ném ApiError 401 INVALID_CREDENTIALS', async () => {
    const promise = apiFetch('/auth/login', {
      method: 'POST',
      body: { email: 'owner@courthub.vn', password: 'sai-roi' },
    });

    await expect(promise).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
  });
});

describe('apiFetch — tự refresh khi gặp 401', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    useAuthStore.getState().clearSession();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('401 → refresh thành công → retry với token mới', async () => {
    useAuthStore.getState().setSession(sampleUser, 'token-cu');
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) {
        return jsonResponse(200, { accessToken: 'token-moi', user: sampleUser });
      }
      const header = (init?.headers as Record<string, string>)?.Authorization ?? '';
      if (header.endsWith('token-cu')) {
        return jsonResponse(401, { statusCode: 401, message: 'expired', code: 'TOKEN_EXPIRED' });
      }
      return jsonResponse(200, { ok: true, sawAuth: header });
    });

    const result = await apiFetch<{ ok: boolean; sawAuth: string }>('/bookings');

    expect(result.ok).toBe(true);
    expect(result.sawAuth).toBe('Bearer token-moi');
    expect(fetchMock).toHaveBeenCalledTimes(3); // gốc + refresh + retry
    expect(useAuthStore.getState().accessToken).toBe('token-moi');
  });

  it('refresh thất bại → xoá phiên và ném lỗi 401 gốc', async () => {
    useAuthStore.getState().setSession(sampleUser, 'token-cu');
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/auth/refresh')) {
        return jsonResponse(401, { statusCode: 401, message: 'hết hạn', code: 'SESSION_EXPIRED' });
      }
      return jsonResponse(401, { statusCode: 401, message: 'expired', code: 'TOKEN_EXPIRED' });
    });

    const promise = apiFetch('/bookings');

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await promise.catch((error: ApiError) => {
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('TOKEN_EXPIRED');
    });
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2); // không retry sau refresh fail
  });

  it('endpoint login 401 không kích hoạt refresh (tránh vòng lặp)', async () => {
    fetchMock.mockImplementation(async () =>
      jsonResponse(401, { statusCode: 401, message: 'sai', code: 'INVALID_CREDENTIALS' }),
    );

    const promise = apiFetch('/auth/login', {
      method: 'POST',
      body: { email: 'a@b.c', password: 'x' },
    });

    await expect(promise).rejects.toMatchObject({ statusCode: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
