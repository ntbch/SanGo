import { render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { App } from '../src/App';
import { useAuthStore } from '../src/lib/auth-store';
import { UserRole } from '../src/lib/constants';

describe('Auth & Routes Navigation Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, accessToken: null, status: 'unauthenticated' });
  });

  it('renders home page with branding and public nav links', () => {
    render(<App />);
    expect(screen.getAllByText(/SanGo/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /Đặt Sân Thể Thao & Ghép Kèo Nhanh/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /^Đăng nhập$/i })).toBeDefined();
  });

  it('updates auth state on setSession', () => {
    useAuthStore.getState().setSession(
      {
        id: 'usr-1',
        email: 'test@sango.vn',
        fullName: 'Nguyễn Văn A',
        role: UserRole.CUSTOMER,
      },
      'fake-access-token',
    );

    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.user?.fullName).toBe('Nguyễn Văn A');
  });
});
