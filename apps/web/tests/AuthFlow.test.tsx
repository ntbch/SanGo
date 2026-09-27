import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ProfilePage,
} from '../src/features/auth/pages';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';
import * as authApi from '../src/features/auth/api/auth-api';
import * as client from '../src/lib/api-client';

describe('Auth Flow Components', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, accessToken: null, status: 'unauthenticated' });
  });
  it('registers customers only with a real required email', () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>,
    );

    expect(screen.getByRole('heading', { name: /Tạo Tài Khoản Mới/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /Chủ Cụm Sân/i })).toBeNull();
    expect(screen.getByText(/liên hệ quản trị viên để được xét duyệt/i)).toBeDefined();
    const emailInput = screen.getByPlaceholderText(/name@example.com/i) as HTMLInputElement;
    expect(emailInput.required).toBe(true);
    fireEvent.change(emailInput, { target: { value: 'người-mới@example.com' } });
    expect(emailInput.value).toBe('người-mới@example.com');
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

  it('wires the login form inputs and the demo role buttons to the login API', async () => {
    // Mỗi tài khoản demo trả về phiên riêng để phân nhánh theo vai trò là thật, không phải echo.
    const login = vi.spyOn(authApi, 'loginApi').mockImplementation(async ({ email }) => {
      const isOwner = email === 'owner@sango.vn';
      return {
        accessToken: isOwner ? 'token-owner' : 'token-customer',
        refreshToken: isOwner ? 'refresh-owner' : 'refresh-customer',
        user: {
          id: isOwner ? 'usr-owner' : 'usr-9',
          email,
          fullName: isOwner ? 'Chủ Sân Mẫu' : 'Khách Mẫu',
          role: isOwner ? UserRole.OWNER : UserRole.CUSTOMER,
        },
      };
    });

    const renderLogin = () =>
      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard/owner/venues" element={<p>Bang chu san cua chu</p>} />
            <Route path="/" element={<p>Trang chu</p>} />
          </Routes>
        </MemoryRouter>,
      );

    const loggedOut = () => {
      useAuthStore.setState({ user: null, accessToken: null, status: 'unauthenticated' });
      localStorage.clear();
    };

    let { container, unmount } = renderLogin();

    expect(screen.getByRole('heading', { name: /Đăng Nhập Tài Khoản/i })).toBeDefined();

    const emailInput = screen.getByPlaceholderText('name@example.com') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    // Nút mắt bật/tắt hiển thị mật khẩu là state thật của component.
    const revealBtn = container.querySelector('form div.relative button') as HTMLButtonElement;
    expect(revealBtn).not.toBeNull();
    fireEvent.click(revealBtn);
    expect(passwordInput.type).toBe('text');
    fireEvent.click(revealBtn);
    expect(passwordInput.type).toBe('password');

    // Submit khi form rỗng phải bị chặn ngay trong component và không gọi API.
    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);
    expect(screen.getByText(/điền đầy đủ email và mật khẩu/i)).toBeDefined();
    expect(login).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('unauthenticated');

    fireEvent.change(emailInput, { target: { value: 'khach@sango.vn' } });
    fireEvent.change(passwordInput, { target: { value: 'Sango@2026' } });
    expect(emailInput.value).toBe('khach@sango.vn');
    expect(passwordInput.value).toBe('Sango@2026');

    fireEvent.click(screen.getByRole('button', { name: /Đăng Nhập Ngay/i }));
    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({ email: 'khach@sango.vn', password: 'Sango@2026' }),
    );

    // Phiên phải được ghi vào store + localStorage, và chuyển hướng theo vai trò CUSTOMER.
    await waitFor(() => expect(useAuthStore.getState().status).toBe('authenticated'));
    expect(useAuthStore.getState().user?.id).toBe('usr-9');
    expect(useAuthStore.getState().user?.role).toBe(UserRole.CUSTOMER);
    expect(useAuthStore.getState().accessToken).toBe('token-customer');
    expect(localStorage.getItem('sango_access_token')).toBe('token-customer');
    expect(localStorage.getItem('sango_refresh_token')).toBe('refresh-customer');
    expect(await screen.findByText(/Trang chu/i)).toBeDefined();
    expect(screen.queryByText(/điền đầy đủ email và mật khẩu/i)).toBeNull();

    // Nút đăng nhập mẫu phải tự điền tài khoản demo, không phụ thuộc ô form.
    unmount();
    loggedOut();
    login.mockClear();
    ({ unmount } = renderLogin());
    fireEvent.click(screen.getByRole('button', { name: /Người Chơi/i }));
    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({ email: 'customer@sango.vn', password: 'Sango@2026' }),
    );
    await waitFor(() => expect(useAuthStore.getState().accessToken).toBe('token-customer'));
    expect(await screen.findByText(/Trang chu/i)).toBeDefined();

    unmount();
    loggedOut();
    login.mockClear();
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /Chủ Cụm Sân/i }));
    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({ email: 'owner@sango.vn', password: 'Sango@2026' }),
    );
    await waitFor(() => expect(useAuthStore.getState().user?.role).toBe(UserRole.OWNER));
    expect(useAuthStore.getState().accessToken).toBe('token-owner');
    expect(await screen.findByText(/Bang chu san cua chu/i)).toBeDefined();
  });

  it('loads actual reputation and persists an empty phone and edited bio', async () => {
    useAuthStore.setState({
      user: {
        id: 'usr-1',
        email: 'player@sango.vn',
        fullName: 'Nguyễn Cầu Thủ',
        role: UserRole.CUSTOMER,
        bio: 'Tiểu sử cũ',
      },
      status: 'authenticated',
    });
    vi.spyOn(client, 'apiClient').mockResolvedValue({ score: 50 });
    const save = vi.spyOn(authApi, 'updateProfileApi').mockResolvedValue({
      id: 'usr-1', email: 'player@sango.vn', fullName: 'Nguyễn Cầu Thủ', role: UserRole.CUSTOMER,
      phone: null, bio: 'Thủ môn',
    });

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>,
    );

    expect(screen.getAllByText(/Nguyễn Cầu Thủ/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/player@sango.vn/i).length).toBeGreaterThan(0);
    expect(await screen.findByText('50/100')).toBeDefined();

    // Side panel items
    expect(screen.getByRole('button', { name: /Tổng Quan & Thẻ VĐV/i })).toBeDefined();
    const profileTabBtn = screen.getByRole('button', { name: /Thông Tin Cá Nhân & Avatar/i });
    expect(profileTabBtn).toBeDefined();
    fireEvent.click(profileTabBtn);

    expect(screen.getByRole('heading', { name: /Chỉnh Sửa Thông Tin Cá Nhân/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Chọn ảnh từ máy/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Lưu Thay Đổi Thông Tin/i })).toBeDefined();
    fireEvent.change(screen.getByPlaceholderText('Môn sở trường, vị trí thi đấu...'), { target: { value: 'Thủ môn' } });
    fireEvent.click(screen.getByRole('button', { name: /Lưu Thay Đổi Thông Tin/i }));
    await waitFor(() => expect(save).toHaveBeenCalledWith({ fullName: 'Nguyễn Cầu Thủ', phone: null, bio: 'Thủ môn' }));
    await waitFor(() => expect(useAuthStore.getState().user?.bio).toBe('Thủ môn'));

    // Switch to Security
    const secTabBtn = screen.getByRole('button', { name: /Bảo Mật & Đổi Mật Khẩu/i });
    fireEvent.click(secTabBtn);
    expect(screen.getByRole('heading', { name: /Bảo Mật & Đổi Mật Khẩu/i })).toBeDefined();
  });
});
