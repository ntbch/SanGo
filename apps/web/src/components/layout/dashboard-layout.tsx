import { Trophy } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { APP_NAME, UserRole } from '@sango/shared';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../lib/auth/auth-store';
import { navItemsForRole } from './navigation';
import { NotificationBell } from '../../features/notifications/components/notification-bell';
import { WalletBalanceBadge } from '../../features/wallet/components/wallet-balance-badge';
import { ThemeToggle } from '../theme/theme-toggle';
import { Badge, type BadgeProps } from '../ui/badge';
import { UserMenu } from './user-menu';

const ROLE_META: Record<UserRole, { label: string; variant: BadgeProps['variant'] }> = {
  [UserRole.CUSTOMER]: { label: 'Khách hàng', variant: 'secondary' },
  [UserRole.OWNER]: { label: 'Chủ sân', variant: 'success' },
  [UserRole.ADMIN]: { label: 'Quản trị', variant: 'warning' },
};

/** Khung dashboard A4: sidebar trái cố định w-64 + topbar mờ; nội dung fluid không mx-auto. */
export function DashboardLayout(): ReactElement {
  const user = useAuthStore((state) => state.user);
  if (!user) return <span />; // ProtectedRoute đã chặn trước đó

  const items = navItemsForRole(user.role);
  const roleMeta = ROLE_META[user.role];

  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    cn(
      'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors',
      isActive
        ? 'bg-accent font-semibold text-accent-foreground'
        : 'font-medium text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground',
    );

  return (
    <div className="min-h-screen bg-background">
      {/* A4: sidebar trái cố định — hidden < md, w-64, nền card, viền phải */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card shadow-lg md:flex">
        <Link
          to="/"
          className="flex items-center gap-2 px-4 pb-2 pt-5 text-lg font-extrabold tracking-tight text-primary"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_4px_20px_rgba(15,23,42,0.08)]">
            <Trophy className="size-5" aria-hidden />
          </span>
          {APP_NAME}
        </Link>
        <p className="px-4 pb-1 pt-5 font-score text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Điều hướng
        </p>
        <nav className="flex flex-col gap-1 px-3" aria-label="Menu chính">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={navLinkClass}
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-border/60 p-4">
          <Badge variant={roleMeta.variant}>{roleMeta.label}</Badge>
        </div>
      </aside>

      {/* Cột nội dung: offset đúng bằng sidebar (pl-64) — KHÔNG mx-auto/max-w chồng lên */}
      <div className="flex min-h-screen min-w-0 flex-col md:pl-64">
        {/* Topbar mờ dùng chung mọi breakpoint */}
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 shadow-[0_1px_12px_rgba(15,23,42,0.04)] backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 md:px-6">
            <Link to="/" className="flex items-center gap-2 font-bold md:hidden">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Trophy className="size-5" aria-hidden />
              </span>
              {APP_NAME}
            </Link>
            <div className="ml-auto flex items-center gap-1">
              <WalletBalanceBadge />
              <NotificationBell />
              <ThemeToggle />
              <UserMenu compact />
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden" aria-label="Menu chính">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={navLinkClass}
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="flex-1 bg-muted/30 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
