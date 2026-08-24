import { describe, expect, it } from 'vitest';

import { forgotPasswordSchema, loginSchema, registerSchema } from './schemas';

describe('loginSchema', () => {
  it('chấp nhận thông tin hợp lệ', () => {
    const parsed = loginSchema.safeParse({ email: 'ban@courthub.vn', password: '123456' });
    expect(parsed.success).toBe(true);
  });

  it('từ chối email sai định dạng', () => {
    const parsed = loginSchema.safeParse({ email: 'khong-phai-email', password: '123456' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.email?.[0]).toBe('Email không hợp lệ.');
    }
  });

  it('từ chối mật khẩu quá ngắn', () => {
    const parsed = loginSchema.safeParse({ email: 'ban@courthub.vn', password: '123' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.password?.[0]).toBe('Mật khẩu tối thiểu 6 ký tự.');
    }
  });
});

describe('registerSchema', () => {
  const base = { fullName: 'Nguyễn Văn A', email: 'a@courthub.vn', password: '12345678' };

  it('chấp nhận khi mật khẩu nhập lại khớp', () => {
    expect(registerSchema.safeParse({ ...base, confirmPassword: '12345678' }).success).toBe(true);
  });

  it('từ chối khi mật khẩu nhập lại lệch', () => {
    const parsed = registerSchema.safeParse({ ...base, confirmPassword: 'khac-roi' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.confirmPassword?.[0]).toBe(
        'Mật khẩu nhập lại không khớp.',
      );
    }
  });

  it('từ chối mật khẩu dưới 8 ký tự', () => {
    const parsed = registerSchema.safeParse({ ...base, password: '123', confirmPassword: '123' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.password?.[0]).toBe('Mật khẩu tối thiểu 8 ký tự.');
    }
  });
});

describe('forgotPasswordSchema', () => {
  it('yêu cầu email hợp lệ', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.vn' }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false);
  });
});
