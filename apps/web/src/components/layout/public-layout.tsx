import { Trophy } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link, Outlet } from 'react-router-dom';

import { APP_NAME } from '@courthub/shared';
import { ThemeToggle } from '../theme/theme-toggle';
import { Button } from '../ui/button';
import { useAuthStore } from '../../lib/auth/auth-store';

/** Khung trang công khai: header thương hiệu + footer, nội dung qua <Outlet />. */
export function PublicLayout(): ReactElement {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Trophy className="size-5" aria-hidden />
            </span>
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Bảng điều khiển</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Đăng nhập</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Đăng ký</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4">
          <Outlet />
        </div>
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © 2026 {APP_NAME} · Đồ án tốt nghiệp — hệ thống đặt và quản lý sân thể thao trực tuyến
      </footer>
    </div>
  );
}
