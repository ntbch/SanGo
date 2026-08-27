import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  Coffee,
  Grid,
  Home,
  LogOut,
  MapPin,
  Shield,
  Users,
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';
import { UserRole } from '../../lib/constants';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export function DashboardSidebar(): React.ReactElement {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isOwner = user?.role === UserRole.OWNER || user?.role === UserRole.ADMIN;
  const isAdmin = user?.role === UserRole.ADMIN;

  const ownerLinks = [
    { to: '/dashboard/owner/venues', label: 'Cụm sân của tôi', icon: MapPin },
    { to: '/dashboard/owner/bookings', label: 'Lịch vận hành & Check-in', icon: CalendarDays },
    { to: '/dashboard/owner/pricing', label: 'Cấu hình bảng giá', icon: CircleDollarSign },
    { to: '/dashboard/owner/services', label: 'Dịch vụ tiện ích', icon: Coffee },
    { to: '/dashboard/owner/analytics', label: 'Báo cáo doanh thu', icon: BarChart3 },
  ];

  const adminLinks = [
    { to: '/dashboard/admin/stats', label: 'Tổng quan nền tảng', icon: BarChart3 },
    { to: '/dashboard/admin/venues', label: 'Hàng chờ duyệt sân', icon: ClipboardCheck },
    { to: '/dashboard/admin/users', label: 'Quản lý người dùng', icon: Users },
    { to: '/dashboard/admin/bookings', label: 'Tra cứu đơn toàn sàn', icon: Grid },
  ];

  return (
    <aside className="w-64 border-r border-border/80 bg-card/95 min-h-screen flex flex-col justify-between p-4 transition-all">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 py-1">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold text-sm shadow-xs">
              SG
            </div>
            <span className="font-extrabold text-sm tracking-tight text-foreground">
              San<span className="text-primary">Go</span> <span className="text-xs text-muted-foreground font-normal">Dashboard</span>
            </span>
          </Link>
          <Link to="/" className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary" title="Về trang chủ">
            <Home className="h-4 w-4" />
          </Link>
        </div>

        {/* User Identity Info */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/60 border border-border/50">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-sm">
            {user?.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-foreground truncate">{user?.fullName}</span>
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
              <Shield className="h-2.5 w-2.5" />
              {user?.role}
            </span>
          </div>
        </div>

        {/* Owner Navigation Links */}
        {isOwner && (
          <div className="space-y-1">
            <p className="px-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Vận hành cụm sân
            </p>
            <nav className="space-y-0.5 pt-1">
              {ownerLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground font-bold shadow-xs shadow-emerald-500/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80',
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        {/* Admin Navigation Links */}
        {isAdmin && (
          <div className="space-y-1 pt-2">
            <p className="px-2.5 text-[10px] font-bold text-amber-500 uppercase tracking-wider">
              Quản trị hệ thống
            </p>
            <nav className="space-y-0.5 pt-1">
              {adminLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
                      isActive
                        ? 'bg-amber-500 text-black font-bold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80',
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Logout Button */}
      <div className="border-t border-border/70 pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          <span>Đăng xuất khỏi bảng quản lý</span>
        </Button>
      </div>
    </aside>
  );
}
