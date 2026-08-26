import { Menu } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

import { APP_NAME, UserRole } from '@sango/shared';
import { NotificationBell } from '../../features/notifications/components/notification-bell';
import { ThemeToggle } from '../theme/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { useAuthStore } from '../../lib/auth/auth-store';

/** Container chuẩn của design "Athletic Synergy": tối đa 1280px, gutter 16/24px. */
const SHELL_CONTAINER = 'w-full px-4 sm:px-6 lg:px-10';

/**
 * Khung trang công khai: header trong suốt mờ (docked) + footer navy full-bleed.
 * Trang chủ ("/") cần hero tràn viền nên render Outlet không bọc container;
 * các trang còn lại giữ container 1280px như cũ để không vỡ layout hiện có.
 */
export function PublicLayout(): ReactElement {
  const user = useAuthStore((state) => state.user);
  const { pathname } = useLocation();
  const isFullBleedPage = pathname === '/';

  // "Bảng điều khiển" chỉ dành cho chủ sân/quản trị; khách hàng đi bằng nav "Đơn đặt sân".
  const isStaff = user?.role === UserRole.OWNER || user?.role === UserRole.ADMIN;

  // Điều hướng chính: mục "Đơn đặt sân" chỉ dành cho thành viên đã đăng nhập.
  const navItems = [
    { to: '/venues', label: 'Tìm sân' },
    { to: '/matches', label: 'Ghép trận' },
    ...(user ? [{ to: '/dashboard/my-bookings', label: 'Đơn đặt sân' }] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 shadow-[0_1px_12px_rgba(15,23,42,0.04)] backdrop-blur-md">
        <div className={`${SHELL_CONTAINER} flex h-20 items-center justify-between`}>
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-primary"
            >
              <img
                src="/logo-256.png"
                alt={`Logo ${APP_NAME}`}
                className="size-9 rounded-lg object-cover shadow-[0_4px_20px_rgba(15,23,42,0.08)]"
              />
              {APP_NAME}
            </Link>
            {/* Điều hướng public cho khách (P1-F1): xem được sân/trận trước khi đăng nhập */}
            <nav aria-label="Điều hướng công khai" className="hidden items-center gap-5 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive
                      ? 'border-b-2 border-primary pb-1 text-sm font-bold text-primary'
                      : 'border-b-2 border-transparent pb-1 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary'
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {/* Menu điều hướng cho màn hình nhỏ (< md): mọi đích đi đều nằm ở đây */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Mở menu điều hướng"
                >
                  <Menu className="size-5" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <Link to={item.to}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
                {isStaff ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">Bảng điều khiển</Link>
                    </DropdownMenuItem>
                  </>
                ) : null}
                {!user ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/login">Đăng nhập</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/register">Đăng ký</Link>
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
            {user ? <NotificationBell /> : null}
            <ThemeToggle />
            {isStaff ? (
              <Button
                asChild
                className="rounded-lg font-bold shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_12px_30px_rgba(15,23,42,0.1)]"
              >
                <Link to="/dashboard">Bảng điều khiển</Link>
              </Button>
            ) : user ? null : (
              <>
                <Button
                  variant="ghost"
                  asChild
                  className="font-semibold text-muted-foreground hover:text-primary"
                >
                  <Link to="/login">Đăng nhập</Link>
                </Button>
                <Button
                  asChild
                  className="rounded-lg font-bold shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_12px_30px_rgba(15,23,42,0.1)]"
                >
                  <Link to="/register">Đăng ký</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {isFullBleedPage ? (
          <Outlet />
        ) : (
          <div className={`${SHELL_CONTAINER} py-8`}>
            <Outlet />
          </div>
        )}
      </main>

      {/* Footer navy full-bleed — nền phủ toàn viewport, nội dung vẫn nằm trong container 1280px */}
      <footer className="bg-navy text-white/70">
        <div
          className={`${SHELL_CONTAINER} flex flex-col justify-between gap-6 py-10 md:flex-row md:items-center`}
        >
          <div>
            <div className="mb-1 flex items-center gap-2 text-lg font-extrabold tracking-tight text-turf-bright">
              <img
                src="/logo-256.png"
                alt={`Logo ${APP_NAME}`}
                className="size-8 rounded-lg object-cover bg-white/10"
              />
              {APP_NAME}
            </div>
            <p className="text-sm">
              © 2026 {APP_NAME} · Đồ án tốt nghiệp — hệ thống đặt và quản lý sân thể thao trực tuyến
            </p>
          </div>
          <nav
            aria-label="Liên kết chân trang"
            className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium"
          >
            <Link to="/venues" className="transition-colors duration-200 hover:text-turf-bright">
              Tìm sân
            </Link>
            <Link to="/matches" className="transition-colors duration-200 hover:text-turf-bright">
              Ghép trận
            </Link>
            <Link to="/register" className="transition-colors duration-200 hover:text-turf-bright">
              Đăng ký chủ sân
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
