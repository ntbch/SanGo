interface AppEnv {
  /** Bật chế độ API giả lập trong bộ nhớ (flag VITE_USE_MOCK=true|1). */
  readonly useMock: boolean;
  /** Base URL REST API, mặc định '/api/v1' (đặc tả §4). */
  readonly apiUrl: string;
}

/**
 * Đọc biến môi trường qua getter để unit test có thể vi.stubEnv()
 * rồi thấy giá trị mới ngay cả khi module đã được import.
 */
export const env: AppEnv = {
  get useMock(): boolean {
    const raw = import.meta.env.VITE_USE_MOCK?.toLowerCase();
    return raw === 'true' || raw === '1';
  },
  get apiUrl(): string {
    return import.meta.env.VITE_API_URL ?? '/api/v1';
  },
};
