import { LogOut, Trophy } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import { APP_NAME, UserRole } from '@courthub/shared';
import { cn } from '../../lib/utils';
import { logout } from '../../features/auth/api';
import { useAuthStore } from '../../lib/auth/auth-store';
import { navItemsForRole } from './navigation';
import { ThemeToggle } from '../theme/theme-toggle';
import { Badge, type BadgeProps } from '../ui/badge';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { toast } from '../ui/use-toast';

const ROLE_META: Record<UserRole, { label: string; variant: BadgeProps['variant'] }> = {
  [UserRole.CUSTOMER]: { label: 'Khách hàng', variant: 'secondary' },
  [UserRole.OWNER]: { label: 'Chủ sân', variant: 'success' },
  [UserRole.ADMIN]: { label: 'Quản trị', variant: 'warning' },
};

function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '?';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

interface UserMenuProps {
  compact?: boolean;
}

function UserMenu({ compact = false }: UserMenuProps): ReactElement {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  if (!user) return <span />;

  const handleLogout = async (): Promise<void> => {
    await logout();
    toast({ title: 'Đã đăng xuất', description: 'Hẹn gặp lại bạn trên sân! 👋' });
    navigate('/login', { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn('h-auto w-full justify-start gap-2 px-2 py-2', compact && 'w-auto')}
          aria-label="Menu tài khoản"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {initialsOf(user.fullName)}
          </span>
          {!compact && (
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium">{user.fullName}</span>
              <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? 'end' : 'start'} className="w-56">
        <DropdownMenuLabel>
          <span className="block truncate">{user.fullName}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => void handleLogout()}
          className="text-destructive focus:text-destructive"
        >
          <LogOut aria-hidden />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Khung dashboard: sidebar theo vai trò (desktop) + topbar & nav cuộn ngang (mobile). */
export function DashboardLayout(): ReactElement {
  const user = useAuthStore((state) => state.user);
  if (!user) return <span />; // ProtectedRoute đã chặn trước đó

  const items = navItemsForRole(user.role);
  const roleMeta = ROLE_META[user.role];

  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    cn(
      'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
    );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card p-3 md:flex">
        <Link to="/" className="flex items-center gap-2 px-2 py-3 font-bold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Trophy className="size-5" aria-hidden />
          </span>
          {APP_NAME}
        </Link>
        <nav className="mt-3 flex flex-col gap-1" aria-label="Menu chính">
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
        <div className="mt-auto border-t pt-3">
          <UserMenu />
          <div className="mt-2 flex items-center justify-between px-2 pb-1">
            <Badge variant={roleMeta.variant}>{roleMeta.label}</Badge>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur md:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2 font-bold">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Trophy className="size-5" aria-hidden />
              </span>
              {APP_NAME}
            </Link>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <UserMenu compact />
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Menu chính">
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
        <main className="flex-1 bg-muted/30 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
