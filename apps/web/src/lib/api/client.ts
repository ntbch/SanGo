/**
 * Fetch wrapper thống nhất cho toàn app.
 * - Tự gắn Authorization: Bearer <accessToken> (token nằm trong memory).
 * - credentials: 'include' để cookie refresh httpOnly đi kèm mỗi request.
 * - Gặp 401: thử POST /auth/refresh đúng MỘT lần rồi retry; nếu refresh fail
 *   thì xoá phiên và ném lỗi (đặc tả §7 — access token 15', refresh xoay vòng).
 * - VITE_USE_MOCK=true thì chuyển hướng mọi request sang API giả lập trong bộ nhớ.
 */
import { env } from '../env';
import { useAuthStore } from '../auth/auth-store';
import { ApiError } from './api-error';
import { handleMockRequest } from './mock-server';
import { type AuthResponse } from './types';

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestOptions {
  method?: ApiMethod;
  /** Đối tượng JS tuỳ ý — sẽ được JSON.stringify tự động. */
  body?: unknown;
  signal?: AbortSignal;
}

/** Các endpoint auth không cần thử refresh khi gặp 401 (tránh vòng lặp). */
const AUTH_EXEMPT_PREFIXES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/refresh',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function toApiError(response: Response): Promise<ApiError> {
  let message = 'Lỗi HTTP ' + response.status;
  let code: string | undefined;

  try {
    const data: unknown = await response.json();
    if (isRecord(data)) {
      if (typeof data.message === 'string') message = data.message;
      if (typeof data.code === 'string') code = data.code;
    }
  } catch {
    // Body lỗi không phải JSON — giữ thông báo mặc định theo status.
  }

  return new ApiError(response.status, message, code);
}

let refreshInFlight: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  try {
    const response = await fetch(env.apiUrl + '/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) return false;

    const data = (await response.json()) as AuthResponse;
    useAuthStore.getState().setSession(data.user, data.accessToken);
    return true;
  } catch {
    return false;
  }
}

/** Gom các request 401 đồng thời vào đúng MỘT lời gọi refresh. */
function refreshSession(): Promise<boolean> {
  refreshInFlight ??= performRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {},
  allowRefreshRetry = true,
): Promise<T> {
  if (env.useMock) {
    return handleMockRequest<T>(path, options.method ?? 'GET', options.body);
  }

  const accessToken = useAuthStore.getState().accessToken;
  const response = await fetch(env.apiUrl + path, {
    method: options.method ?? 'GET',
    signal: options.signal,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: 'Bearer ' + accessToken } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (
    response.status === 401 &&
    allowRefreshRetry &&
    !AUTH_EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix))
  ) {
    const refreshed = await refreshSession();
    if (refreshed) return apiFetch<T>(path, options, false);
    // Refresh thất bại → phiên thật sự hết hạn, dọn trạng thái client.
    useAuthStore.getState().clearSession();
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}
