import { UserRole } from '@courthub/shared';
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  MapPinned,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  Users,
  Wallet,
  Bell,
  TicketPercent,
  Medal,
  Trophy,
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
  { to: '/dashboard/my-bookings', label: 'Đơn của tôi', icon: CalendarDays, roles: ALL_ROLES },
  { to: '/dashboard/wallet', label: 'Ví của tôi', icon: Wallet, roles: ALL_ROLES },
  { to: '/dashboard/notifications', label: 'Thông báo', icon: Bell, roles: ALL_ROLES },
  { to: '/dashboard/teams', label: 'Đội nhóm', icon: Users, roles: ALL_ROLES },
  { to: '/dashboard/ranking', label: 'Bảng xếp hạng', icon: Medal, roles: ALL_ROLES },
  { to: '/dashboard/profile', label: 'Hồ sơ', icon: UserRound, roles: ALL_ROLES },
  { to: '/matches', label: 'Ghép trận', icon: Users, roles: ALL_ROLES },
  { to: '/tournaments', label: 'Giải đấu', icon: Trophy, roles: ALL_ROLES },
  { to: '/dashboard/manage', label: 'Quản lý sân', icon: MapPinned, roles: [UserRole.OWNER] },
  { to: '/dashboard/bookings', label: 'Đơn đặt', icon: CalendarDays, roles: [UserRole.OWNER] },
  { to: '/dashboard/statistics', label: 'Thống kê', icon: BarChart3, roles: [UserRole.OWNER] },
  { to: '/dashboard/vouchers', label: 'Voucher', icon: TicketPercent, roles: [UserRole.OWNER] },
  { to: '/dashboard/services', label: 'Dịch vụ', icon: ShoppingBag, roles: [UserRole.OWNER] },
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
