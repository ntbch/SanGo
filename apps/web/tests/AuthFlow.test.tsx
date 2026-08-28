import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ProfilePage,
} from '../src/features/auth/pages';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';

describe('Auth Flow Components', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, accessToken: null, status: 'unauthenticated' });
  });

  it('renders Login page and handles form inputs', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    expect(screen.getByRole('heading', { name: /Đăng Nhập Tài Khoản/i })).toBeDefined();
    const emailInput = screen.getByPlaceholderText(/name@example.com/i) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'user@sango.vn' } });
    expect(emailInput.value).toBe('user@sango.vn');

    const passInput = screen.getByPlaceholderText(/••••••••/i) as HTMLInputElement;
    fireEvent.change(passInput, { target: { value: 'password123' } });
    expect(passInput.value).toBe('password123');

    expect(screen.getByRole('button', { name: /Đăng Nhập Ngay/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Người Chơi/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Chủ Cụm Sân/i })).toBeDefined();
  });

  it('renders Register page and toggles role selection', () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>,
    );

    expect(screen.getByRole('heading', { name: /Tạo Tài Khoản Mới/i })).toBeDefined();
    const ownerRoleBtn = screen.getByRole('button', { name: /Chủ Cụm Sân/i });
    fireEvent.click(ownerRoleBtn);

    const nameInput = screen.getByPlaceholderText(/Nguyễn Văn A/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Lê Văn Chủ' } });
    expect(nameInput.value).toBe('Lê Văn Chủ');

    expect(screen.getByRole('button', { name: /Hoàn Tất Đăng Ký/i })).toBeDefined();
  });

  it('renders Forgot Password and Reset Password pages', () => {
    const { rerender } = render(
      <BrowserRouter>
        <ForgotPasswordPage />
      </BrowserRouter>,
    );
    expect(screen.getByRole('heading', { name: /Quên Mật Khẩu/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Gửi Liên Kết Khôi Phục/i })).toBeDefined();

    rerender(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>,
    );
    expect(screen.getByRole('heading', { name: /Đặt Lại Mật Khẩu/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Cập Nhật Mật Khẩu/i })).toBeDefined();
  });

  it('renders Profile page with side panel navigation and switches tabs', () => {
    useAuthStore.setState({
      user: {
        id: 'usr-1',
        email: 'player@sango.vn',
        fullName: 'Nguyễn Cầu Thủ',
        role: UserRole.CUSTOMER,
        reputationScore: 98,
      },
      status: 'authenticated',
    });

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>,
    );

    expect(screen.getAllByText(/Nguyễn Cầu Thủ/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/player@sango.vn/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/98\/100/i).length).toBeGreaterThan(0);

    // Side panel items
    expect(screen.getByRole('button', { name: /Tổng Quan & Thẻ VĐV/i })).toBeDefined();
    const profileTabBtn = screen.getByRole('button', { name: /Thông Tin Cá Nhân & Avatar/i });
    expect(profileTabBtn).toBeDefined();
    fireEvent.click(profileTabBtn);

    expect(screen.getByRole('heading', { name: /Chỉnh Sửa Thông Tin Cá Nhân/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Chọn ảnh từ máy/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Lưu Thay Đổi Thông Tin/i })).toBeDefined();

    // Switch to Security
    const secTabBtn = screen.getByRole('button', { name: /Bảo Mật & Đổi Mật Khẩu/i });
    fireEvent.click(secTabBtn);
    expect(screen.getByRole('heading', { name: /Bảo Mật & Đổi Mật Khẩu/i })).toBeDefined();
  });
});
