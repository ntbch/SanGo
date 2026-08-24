import { describe, expect, it } from 'vitest';

import { ApiError, friendlyApiMessage } from './api-error';

describe('friendlyApiMessage', () => {
  it('ưu tiên map theo mã lỗi chuẩn', () => {
    const error = new ApiError(409, 'Email already exists', 'EMAIL_TAKEN');
    expect(friendlyApiMessage(error)).toBe('Email này đã được sử dụng.');
  });

  it('dùng message gốc của server với mã chưa map', () => {
    const error = new ApiError(409, 'Slot đã có người giữ', 'SLOT_TAKEN');
    expect(friendlyApiMessage(error)).toBe('Slot đã có người giữ');
  });

  it('fallback cho lỗi không rõ (mạng...)', () => {
    expect(friendlyApiMessage(new Error('boom'))).toBe('Có lỗi xảy ra, vui lòng thử lại sau.');
    expect(friendlyApiMessage(new ApiError(0, '', undefined), 'Mất kết nối')).toBe('Mất kết nối');
  });
});
