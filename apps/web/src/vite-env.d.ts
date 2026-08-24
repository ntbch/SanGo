/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'true'/'1' → chạy API mock trong bộ nhớ để UI demo không cần backend thật. */
  readonly VITE_USE_MOCK?: string;
  /** Base URL REST API (đặc tả §4), mặc định '/api/v1'. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
