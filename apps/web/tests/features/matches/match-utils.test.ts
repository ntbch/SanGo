import { describe, expect, it } from 'vitest';

import { formatJoinedCount, hostInitial, validateOpenMatchInput } from '../../../src/features/matches/match-utils';

describe('validateOpenMatchInput', () => {
  it('bắt buộc slotsNeeded là số nguyên trong khoảng 1..10 khi bật công khai', () => {
    expect(validateOpenMatchInput(true, 1).valid).toBe(true);
    expect(validateOpenMatchInput(true, 10).valid).toBe(true);
    expect(validateOpenMatchInput(true, 0).valid).toBe(false);
    expect(validateOpenMatchInput(true, 11).valid).toBe(false);
    expect(validateOpenMatchInput(true, null).valid).toBe(false);
    expect(validateOpenMatchInput(true, 2.5).valid).toBe(false);
  });

  it('không yêu cầu slotsNeeded khi không bật tìm người ghép', () => {
    expect(validateOpenMatchInput(false, undefined).valid).toBe(true);
    expect(validateOpenMatchInput(false, 0).valid).toBe(true);
  });

  it('trả về message tiếng Việt cho lỗi để toast trực tiếp', () => {
    expect(validateOpenMatchInput(true, 11).message).toContain('1 đến 10');
  });
});

describe('formatJoinedCount', () => {
  it('định dạng X/Y người theo kiểu vi-VN', () => {
    expect(formatJoinedCount(2, 4)).toBe('2/4 người');
    expect(formatJoinedCount(9, 9)).toBe('9/9 người');
  });

  it('chống dữ liệu lỗi: âm -> 0, cần 0 người -> gạch ngang', () => {
    expect(formatJoinedCount(-1, 4)).toBe('0/4 người');
    expect(formatJoinedCount(3, 0)).toBe('—');
  });
});

describe('hostInitial', () => {
  it('lấy chữ cái đầu của tên chủ đơn', () => {
    expect(hostInitial('Trần Thị Cẩm Lan')).toBe('T');
    expect(hostInitial('  nam ')).toBe('N');
    expect(hostInitial('')).toBe('?');
  });
});
