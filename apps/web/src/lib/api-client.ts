import { API_BASE_URL } from './constants';

export interface ApiErrorResponse {
  message: string;
  code?: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  code: string;
  statusCode: number;
  errors?: Record<string, string[]>;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export async function apiClient<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, skipAuth = false, headers = {}, ...customConfig } = options;

  let base = API_BASE_URL;
  if (!base.startsWith('http')) {
    const origin =
      typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null'
        ? window.location.origin
        : 'http://localhost:5173';
    base = `${origin}${base.startsWith('/') ? '' : '/'}${base}`;
  }

  let url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += `${url.includes('?') ? '&' : '?'}${qs}`;
    }
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('sango_access_token') : null;
  if (token && !skipAuth) {
    reqHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...customConfig,
    credentials: 'include',
    headers: reqHeaders,
  });

  // Tự động làm mới token trong nền khi gặp 401 qua httpOnly cookie sango_refresh
  if (response.status === 401 && !skipAuth && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        failedQueue.push({
          resolve: () => {
            resolve(apiClient<T>(endpoint, options));
          },
          reject: (err) => {
            reject(err);
          },
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshRes = await fetch(`${base}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!refreshRes.ok) {
        throw new Error('Refresh token invalid or expired');
      }

      const refreshData = await refreshRes.json();
      if (refreshData.accessToken) {
        localStorage.setItem('sango_access_token', refreshData.accessToken);
        if (refreshData.user) {
          localStorage.setItem('sango_user', JSON.stringify(refreshData.user));
        }
      }

      processQueue(null, refreshData.accessToken);
      return apiClient<T>(endpoint, options);
    } catch (err) {
      processQueue(err as Error, null);
      localStorage.removeItem('sango_access_token');
      localStorage.removeItem('sango_refresh_token');
      localStorage.removeItem('sango_user');
      window.dispatchEvent(new Event('sango_auth_change'));
      throw new ApiError('Phiên đăng nhập đã hết hạn, đăng nhập lại.', 401, 'UNAUTHORIZED');
    } finally {
      isRefreshing = false;
    }
  }

  if (response.status === 204) {
    return {} as T;
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new ApiError(
      data.message || 'Yêu cầu không thành công',
      response.status,
      data.code || 'ERROR',
      data.errors,
    );
  }

  return data as T;
}
