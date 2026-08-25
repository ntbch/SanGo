/**
 * Test forgotPassword ở chế độ API THẬT (VITE_USE_MOCK=false): đọc raw token
 * từ header X-Dev-Reset-Token mà backend trả khi NODE_ENV!=production (t1).
 */
import { describe, expect, it, vi } from 'vitest';

import { forgotPassword } from '../api';

describe('forgotPassword với API thật (dev header)', () => {
  it('đọc X-Dev-Reset-Token từ header và xây devResetLink đúng', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const token = 'a'.repeat(64);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => (name.toLowerCase() === 'x-dev-reset-token' ? token : null),
      },
      json: async () => ({ message: 'Nếu email tồn tại...' }),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    try {
      const res = await forgotPassword({ email: 'customer@courthub.vn' });
      expect(res.devResetLink).toBe('/dat-lai-mat-khau?token=' + token);
      // Gọi đúng endpoint public POST /auth/forgot-password.
      expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/auth/forgot-password');
    } finally {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
    }
  });

  it('API thật không trả header dev → không có devResetLink', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'false');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ message: 'Nếu email tồn tại...' }),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    try {
      const res = await forgotPassword({ email: 'customer@courthub.vn' });
      expect(res.devResetLink).toBeUndefined();
    } finally {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
    }
  });
});
