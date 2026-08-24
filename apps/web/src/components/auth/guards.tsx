import { type UserRole } from '@courthub/shared';
import type { ReactElement, ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuthStore } from '../../lib/auth/auth-store';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Nếu khai báo thì chỉ các vai trò này được đi tiếp, ngược lại về /dashboard. */
  roles?: readonly UserRole[];
}

/** Bắt buộc đăng nhập; tuỳ chọn giới hạn theo vai trò (RBAC đặc tả §7). */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps): ReactElement {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

interface GuestRouteProps {
  children?: ReactNode;
}

/** Trang dành cho khách chưa đăng nhập (login/register…) — đã đăng nhập thì về dashboard. */
export function GuestRoute({ children }: GuestRouteProps): ReactElement {
  const user = useAuthStore((state) => state.user);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Dùng như pathless layout route thì render con qua Outlet.
  if (children === undefined || children === null) {
    return <Outlet />;
  }

  return <>{children}</>;
}
