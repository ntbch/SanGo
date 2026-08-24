import { describe, expect, it } from 'vitest';

import { forgotPasswordSchema, loginSchema, registerFormSchema } from './schemas';

describe('loginForm (dựa shared LoginDto)', () => {
  it('mật khẩu rỗng theo message contract', () => {
    const parsed = loginSchema.safeParse({ email: 'ban@courthub.vn', password: '' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.password?.[0]).toBe('Vui lòng nhập mật khẩu');
    }
  });

  it('email sai định dạng báo lỗi shared', () => {
    const parsed = loginSchema.safeParse({ email: 'khong-phai-email', password: 'x' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.email?.[0]).toBe('Email không hợp lệ');
    }
  });
});

describe('registerForm (shared RegisterDto + confirmPassword UI-only)', () => {
  const base = { fullName: 'Nguyễn Văn A', email: 'a@courthub.vn', password: 'Courthub@2026' };

  it('chấp nhận khi có confirmPassword khớp, phone bỏ trống', () => {
    const parsed = registerFormSchema.safeParse({
      ...base,
      phone: '',
      confirmPassword: 'Courthub@2026',
    });
    expect(parsed.success).toBe(true);
  });

  it('phone rỗng được tiền xử lý thành undefined (không dính regex)', () => {
    const parsed = registerFormSchema.safeParse({
      ...base,
      phone: '',
      confirmPassword: 'Courthub@2026',
    });
    if (parsed.success) expect(parsed.data.phone).toBeUndefined();
  });

  it('confirmPassword lệch bị chặn ở web', () => {
    const parsed = registerFormSchema.safeParse({
      ...base,
      phone: undefined,
      confirmPassword: 'khac-roi',
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.confirmPassword?.[0]).toBe(
        'Mật khẩu nhập lại không khớp.',
      );
    }
  });

  it('mật khẩu ngắn dùng message của shared passwordSchema', () => {
    const parsed = registerFormSchema.safeParse({
      fullName: 'Nguyễn Văn A',
      email: 'a@courthub.vn',
      password: '123',
      phone: undefined,
      confirmPassword: '123',
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.password?.[0]).toBe('Mật khẩu tối thiểu 8 ký tự');
    }
  });
});

describe('forgotPassword (shared)', () => {
  it('yêu cầu email hợp lệ', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.vn' }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false);
  });
});
