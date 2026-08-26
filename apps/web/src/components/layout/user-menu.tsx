import { LogOut } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { cn } from '../../lib/utils';
import { logout } from '../../features/auth/api';
import { useAuthStore } from '../../lib/auth/auth-store';
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

function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '?';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

/** Liên kết trang cá nhân hiển thị trong menu — khách hàng dùng khung public nên cần đủ mục điều hướng. */
export interface UserMenuLink {
  to: string;
  label: string;
}

interface UserMenuProps {
  compact?: boolean;
  /** Liên kết hiện phía trên nút Đăng xuất (bỏ qua nếu không truyền). */
  links?: readonly UserMenuLink[];
}

/** Menu tài khoản dùng chung dashboard topbar và navbar public. */
export function UserMenu({ compact = false, links }: UserMenuProps): ReactElement {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  if (!user) return <span />;

  const handleLogout = async (): Promise<void> => {
    await logout();
    toast({ title: 'Đã đăng xuất', description: 'Hẹn gặp lại bạn trên sân!' });
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
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="size-9 shrink-0 rounded-full border border-border/60 object-cover"
            />
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {initialsOf(user.fullName)}
            </span>
          )}
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
        {(links ?? []).map((link) => (
          <DropdownMenuItem key={link.to} asChild>
            <Link to={link.to}>{link.label}</Link>
          </DropdownMenuItem>
        ))}
        {links && links.length > 0 ? <DropdownMenuSeparator /> : null}
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
