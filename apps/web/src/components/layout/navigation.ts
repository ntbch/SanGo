import { UserRole } from '@courthub/shared';
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  MapPinned,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: readonly UserRole[];
}

const ALL_ROLES: readonly UserRole[] = [UserRole.CUSTOMER, UserRole.OWNER, UserRole.ADMIN];

/** Menu sidebar của dashboard — lọc theo vai trò người dùng. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard, roles: ALL_ROLES },
  { to: '/dashboard/manage', label: 'Quản lý sân', icon: MapPinned, roles: [UserRole.OWNER] },
  { to: '/dashboard/bookings', label: 'Đơn đặt', icon: CalendarDays, roles: [UserRole.OWNER] },
  { to: '/dashboard/statistics', label: 'Thống kê', icon: BarChart3, roles: [UserRole.OWNER] },
  {
    to: '/dashboard/admin',
    label: 'Quản trị hệ thống',
    icon: ShieldCheck,
    roles: [UserRole.ADMIN],
  },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
