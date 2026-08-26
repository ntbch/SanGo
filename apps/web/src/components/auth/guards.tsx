import { type UserRole } from '@sango/shared';
import type { ReactElement, ReactNode } from 'react';
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom';

import { useAuthStore } from '../../lib/auth/auth-store';

/** Chỉ nhận đích nội bộ (bắt đầu bằng '/', không phải '//') — chống open-redirect. */
export function safeInternalTarget(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined || !raw.startsWith('/') || raw.startsWith('//')) {
    return null;
  }
  return raw;
}

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
  const location = useLocation();
  const [searchParams] = useSearchParams();

  if (user) {
    // QA-T4-01 (v2): setSession (external store) thông báo subscriber đồng bộ nên
    // GuestRoute có thể re-render với location CŨ trong khi useNavigate của
    // LoginPage commit qua React state — hai lệnh navigate đua nhau và
    // /dashboard từng thắng. Cho GuestRoute tự tôn trọng đích next/from để
    // DÙ trang nào thắng cuộc đua thì đích cuối cũng là next → tất định đúng.
    const next =
      safeInternalTarget(searchParams.get('next')) ??
      safeInternalTarget((location.state as { from?: string } | null)?.from);
    return <Navigate to={next ?? '/dashboard'} replace />;
  }

  // Dùng như pathless layout route thì render con qua Outlet.
  if (children === undefined || children === null) {
    return <Outlet />;
  }

  return <>{children}</>;
}
