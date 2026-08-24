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

/**
 * Bản đồ mã lỗi chuẩn của backend (contract auth t4) → thông báo tiếng Việt
 * hiển thị cho người dùng. Các mã chưa liệt kê sẽ dùng message gốc từ server.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_TAKEN: 'Email này đã được sử dụng.',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  ACCOUNT_LOCKED: 'Tài khoản của bạn đã bị khoá. Vui lòng liên hệ quản trị viên.',
  REFRESH_INVALID: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
  TOKEN_REUSED: 'Phát hiện phiên đăng nhập bất thường, vui lòng đăng nhập lại.',
  RESET_TOKEN_INVALID: 'Liên kết đặt lại mật khẩu không hợp lệ.',
  RESET_TOKEN_STALE: 'Liên kết đặt lại mật khẩu đã hết hạn, hãy yêu cầu liên kết mới.',
  VALIDATION_FAILED: 'Dữ liệu chưa hợp lệ, vui lòng kiểm tra lại.',
  UNAUTHENTICATED: 'Bạn cần đăng nhập để thực hiện thao tác này.',
  // Booking engine (t6):
  SLOT_TAKEN: 'Có người vừa đặt nhanh hơn bạn. Vui lòng chọn slot khác.',
  HOLD_LIMIT: 'Bạn đang có một đơn giữ chỗ. Hãy hoàn tất hoặc huỷ trước khi đặt tiếp.',
  COURT_MAINTENANCE: 'Sân đang bảo trì, vui lòng chọn sân khác.',
  SLOTS_NOT_CONTIGUOUS: 'Các slot trong một đơn phải liền kề nhau.',
  SLOTS_MISALIGNED: 'Slot không khớp độ dài cấu hình của sân.',
  OUTSIDE_OPENING_HOURS: 'Thời gian chọn nằm ngoài giờ mở cửa của sân.',
  FORBIDDEN_ROLE: 'Bạn không có quyền thực hiện thao tác này.',
};

/**
 * Chọn thông báo hiển thị: ưu tiên map theo code chuẩn, rồi đến message server,
 * cuối cùng là fallback do UI cung cấp (lỗi mạng, lỗi không rõ...).
 */
export function friendlyApiMessage(
  error: unknown,
  fallback = 'Có lỗi xảy ra, vui lòng thử lại sau.',
): string {
  if (error instanceof ApiError && error.code !== undefined) {
    const mapped = ERROR_MESSAGES[error.code];
    if (mapped !== undefined) return mapped;
  }
  if (error instanceof ApiError && error.message.trim() !== '') return error.message;
  return fallback;
}
