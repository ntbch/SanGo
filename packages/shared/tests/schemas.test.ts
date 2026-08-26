import { describe, expect, it } from 'vitest';

import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '../src/schemas';

describe('loginSchema (shared)', () => {
  it('mật khẩu rỗng báo theo contract', () => {
    const parsed = loginSchema.safeParse({ email: 'a@sango.vn', password: '' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.password?.[0]).toBe('Vui lòng nhập mật khẩu');
    }
  });

  it('chấp nhận thông tin hợp lệ', () => {
    expect(loginSchema.safeParse({ email: 'a@sango.vn', password: 'x' }).success).toBe(true);
  });
});

describe('registerSchema (shared)', () => {
  const base = { fullName: 'Nguyễn Văn A', email: 'a@sango.vn', password: 'Sango@2026' };

  it('không có phone vẫn hợp lệ (optional)', () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it('phone đúng định dạng Việt Nam được chấp nhận', () => {
    expect(registerSchema.safeParse({ ...base, phone: '0901234567' }).success).toBe(true);
  });

  it('phone sai định dạng báo lỗi chuẩn', () => {
    const parsed = registerSchema.safeParse({ ...base, phone: '12345' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.phone?.[0]).toBe(
        'Số điện thoại Việt Nam không hợp lệ (vd: 0901234567)',
      );
    }
  });
});

describe('resetPasswordSchema (shared)', () => {
  it('token quá ngắn bị từ chối', () => {
    expect(
      resetPasswordSchema.safeParse({ token: 'abc', newPassword: 'Sango@2026' }).success,
    ).toBe(false);
  });

  it('hợp lệ với token dài và mật khẩu đạt chuẩn', () => {
    expect(
      resetPasswordSchema.safeParse({ token: 'x'.repeat(10), newPassword: 'Sango@2026' })
        .success,
    ).toBe(true);
  });
});

describe('forgotPasswordSchema (shared)', () => {
  it('yêu cầu email hợp lệ', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.vn' }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: 'khong-hop-le' }).success).toBe(false);
  });
});
