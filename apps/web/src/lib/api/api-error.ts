/**
 * Lỗi API thống nhất theo quy ước đặc tả §4:
 * mọi lỗi từ backend có dạng { statusCode, message, code } với mã nghiệp vụ
 * (SLOT_TAKEN, HOLD_EXPIRED, INVALID_CREDENTIALS, ...).
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code?: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}
