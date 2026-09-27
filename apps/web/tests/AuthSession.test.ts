import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../src/lib/api-client';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';

const user = { id: 'session-user', email: 'person@example.com', fullName: 'Người chơi', role: UserRole.CUSTOMER };
const response = (status: number, data: unknown = {}) => ({ status, ok: status >= 200 && status < 300, json: async () => data }) as Response;

describe('session revocation and refresh', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().setSession(user, 'old-access');
  });
  afterEach(() => vi.unstubAllGlobals());

  it('only clears the session after server logout succeeds and reports failure', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(response(204));
    vi.stubGlobal('fetch', fetchMock);
    expect(await useAuthStore.getState().logout()).toBe(false);
    expect(useAuthStore.getState().user?.id).toBe(user.id);
    expect(useAuthStore.getState().logoutError).toBeTruthy();
    expect(await useAuthStore.getState().logout()).toBe(true);
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(localStorage.getItem('sango_access_token')).toBeNull();
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/logout');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'POST', credentials: 'include' });
  });

  it('publishes rotated REST token to consumers and does not refresh after logout', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(401))
      .mockResolvedValueOnce(response(200, { accessToken: 'new-access', user }))
      .mockResolvedValueOnce(response(200, { value: 42 }))
      .mockResolvedValueOnce(response(204))
      .mockResolvedValueOnce(response(401, { message: 'Unauthenticated' }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await apiClient('/private')).toEqual({ value: 42 });
    expect(useAuthStore.getState().accessToken).toBe('new-access');
    await useAuthStore.getState().logout();
    await expect(apiClient('/private')).rejects.toMatchObject({ statusCode: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });
});
