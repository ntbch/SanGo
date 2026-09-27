import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../lib/auth-store';
import {
  LayoutDashboard,
  CalendarDays,
  QrCode,
  BarChart3,
  Building2,
  BadgePercent,
  CupSoda,
  TicketPercent,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  ArrowRightLeft,
  ClipboardList,
  Trophy,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../lib/utils';
import type { OwnerVenue } from '../api/owner-api';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}

export interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export interface DashboardLayoutProps {
  venues?: OwnerVenue[];
  selectedVenue?: OwnerVenue | null;
  onSelectVenue?: (venue: OwnerVenue) => void;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  navGroups?: NavGroup[];
  dashboardTitle?: string;
  dashboardSubtitle?: string;
  dashboardBadge?: string;
  hideVenueSelector?: boolean;
  children: React.ReactNode;
}

export const OWNER_NAV_GROUPS: NavGroup[] = [
  {
    groupTitle: 'Vận Hành & Điều Hành',
    items: [
      { id: 'overview', label: 'Bàn Làm Việc Tổng Quan', icon: LayoutDashboard, desc: 'Hiệu suất & Ca đá hôm nay' },
      { id: 'schedule', label: 'Ma Trận Lịch Sân & Quầy', icon: CalendarDays, desc: 'Timeline giờ & Đặt quầy' },
      { id: 'checkin', label: 'Quầy Check-in 1-Click', icon: QrCode, desc: 'Quét vé & Quản lý ca đá' },
    ],
  },
  {
    groupTitle: 'Kinh Doanh & Tài Chính',
    items: [
      { id: 'analytics', label: 'Báo Cáo & Analytics', icon: BarChart3, desc: 'Doanh thu & Tỷ lệ lấp đầy' },
      { id: 'pricing', label: 'Bảng Giá Giờ Vàng', icon: BadgePercent, desc: 'Khung giờ cao điểm' },
      { id: 'vouchers', label: 'Mã Voucher Giảm Giá', icon: TicketPercent, desc: 'Ưu đãi giờ thấp điểm' },
    ],
  },
  {
    groupTitle: 'Cơ Sở Vật Chất & Dịch Vụ',
    items: [
      { id: 'venues', label: 'Cụm Sân & Sân Con', icon: Building2, desc: 'Cấu hình sân & Bảo trì' },
      { id: 'services', label: 'Menu Dịch Vụ Sân', icon: CupSoda, desc: 'Nước uống & Thuê đồ' },
    ],
  },
];

export const OWNER_TABS: NavItem[] = OWNER_NAV_GROUPS.flatMap((g) => g.items);

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    groupTitle: 'Vận Hành & Điều Hành Sàn',
    items: [
      { id: 'stats', label: 'Bàn Làm Việc Tổng Quan', icon: LayoutDashboard, desc: 'KPI & Doanh thu sàn' },
      { id: 'bookings', label: 'Sổ Tra Cứu Đơn Toàn Sàn', icon: ClipboardList, desc: 'Tìm mã vé & khách hàng' },
      { id: 'tournaments', label: 'Điều Hành Giải Đấu', icon: Trophy, desc: 'Tạo giải & Cập nhật tỷ số' },
    ],
  },
  {
    groupTitle: 'Kiểm Duyệt & Cơ Sở Vật Chất',
    items: [
      { id: 'venues', label: 'Hàng Chờ & Duyệt Sân', icon: ShieldAlert, desc: 'Xét duyệt hồ sơ cụm sân' },
      { id: 'courts', label: 'Danh Bạ Sân Con & Bảo Trì', icon: Building2, desc: 'Bảo trì khẩn cấp sân bãi' },
    ],
  },
  {
    groupTitle: 'Tài Khoản & Phân Quyền',
    items: [
      { id: 'users', label: 'Quản Trị Người Dùng', icon: Users, desc: 'Khóa & Mở tài khoản' },
    ],
  },
  {
    groupTitle: 'Kinh Doanh & Chính Sách Giá',
    items: [
      { id: 'vouchers', label: 'Kho Voucher & Ưu Đãi', icon: TicketPercent, desc: 'Chiến dịch khuyến mãi sàn' },
      { id: 'pricing', label: 'Bảng Giá & Menu Dịch Vụ', icon: BadgePercent, desc: 'Ma trận giá giờ vàng' },
    ],
  },
];

export const ADMIN_TABS: NavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

export function DashboardLayout({
  venues = [],
  selectedVenue = null,
  onSelectVenue = () => {},
  activeTab,
  onSelectTab,
  navGroups,
  dashboardTitle = 'SanGo',
  dashboardSubtitle = 'Trung Tâm Quản Lý Sân Bãi',
  dashboardBadge = 'Owner',
  hideVenueSelector = false,
  children,
}: DashboardLayoutProps): React.ReactElement {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [venueDropdownOpen, setVenueDropdownOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<'dark' | 'light'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const activeNavGroups = navGroups || (user?.role === 'ADMIN' && window.location.pathname.includes('/admin') ? ADMIN_NAV_GROUPS : OWNER_NAV_GROUPS);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sango-theme', 'dark');
      localStorage.setItem('sango_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sango-theme', 'light');
      localStorage.setItem('sango_theme', 'light');
    }
  };

  const handleLogout = async () => {
    if (await logout()) navigate('/');
  };

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/90 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation (Always pinned & fixed on Desktop) */}
      <aside
        className={cn(
          'fixed md:relative top-0 left-0 h-screen z-50 w-64 lg:w-72 shrink-0 bg-card border-r border-border/80 flex flex-col justify-between transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Brand & Context Header (Always fixed at top of sidebar) */}
        <div className="p-3.5 border-b border-border/60 shrink-0">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xs shadow-primary/30 shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-sm tracking-tight text-foreground flex items-center gap-1.5 truncate">
                  {dashboardTitle} <span className="text-primary font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">{dashboardBadge}</span>
                </span>
                <p className="text-[10px] text-muted-foreground font-medium leading-tight truncate mt-0.5">{dashboardSubtitle}</p>
              </div>
            </Link>

            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Role badge if Admin acting as Owner */}
          {user?.role === 'ADMIN' && dashboardBadge === 'Owner' && (
            <div className="mt-2.5 p-1.5 px-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Admin View</span>
              </div>
              <Link
                to="/dashboard/admin"
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                Vào Admin Hub <ArrowRightLeft className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar Categorized Menu List (Scrollable middle container) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-2.5 space-y-3">
          {activeNavGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-0.5">
              <div className="px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider text-muted-foreground/70">
                {group.groupTitle}
              </div>
              {group.items.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    data-testid={`${dashboardBadge.toLowerCase()}-tab-${tab.id}`}
                    onClick={() => {
                      onSelectTab(tab.id);
                      setMobileOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 text-left group relative cursor-pointer',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-xs shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold leading-tight text-xs">{tab.label}</p>
                      <p className={cn('text-[9.5px] truncate leading-tight mt-0.5', isActive ? 'text-primary-foreground/80' : 'text-muted-foreground/70')}>
                        {tab.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer User Info (Always fixed at bottom of sidebar) */}
        <div className="p-2.5 border-t border-border/60 bg-card/40 shrink-0">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-secondary/50 border border-border/40">
            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] uppercase shrink-0">
              {user?.fullName?.slice(0, 2) || (user?.role === 'ADMIN' ? 'AD' : 'OS')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-foreground leading-tight">{user?.fullName || (user?.role === 'ADMIN' ? 'Quản Trị Viên' : 'Chủ sân')}</p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
              title="Đăng xuất"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Independent scroll container) */}
      <div className="flex-1 h-screen flex flex-col min-w-0 max-w-full overflow-hidden">
        {/* Topbar Header (Fixed at top of main area) */}
        <header className="shrink-0 h-14 sm:h-16 bg-background border-b border-border/80 px-4 sm:px-6 flex items-center justify-between gap-4 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              className="md:hidden h-9 w-9 rounded-xl text-foreground"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Venue Selector Dropdown or Admin Hub Title */}
            {hideVenueSelector ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/80 text-xs font-bold shadow-2xs">
                <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-foreground">Tổng Quản Trị Hệ Thống SanGo</span>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setVenueDropdownOpen(!venueDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/80 text-xs font-bold shadow-2xs hover:bg-secondary transition-colors max-w-[240px] sm:max-w-xs truncate"
                >
                  <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">
                    {selectedVenue ? selectedVenue.name : 'Chưa có cụm sân nào'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
                </button>

                {venueDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setVenueDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-1.5 w-72 rounded-2xl bg-card border border-border/80 shadow-xl p-2 z-50 space-y-1">
                      <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase">
                        Chọn cụm sân quản lý ({venues.length})
                      </div>
                      {venues.length === 0 ? (
                        <p className="px-2 py-3 text-xs text-muted-foreground text-center">
                          Bạn chưa đăng ký cụm sân nào.
                        </p>
                      ) : (
                        venues.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => {
                              onSelectVenue(v);
                              setVenueDropdownOpen(false);
                            }}
                            className={cn(
                              'w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-left transition-colors',
                              selectedVenue?.id === v.id
                                ? 'bg-primary/10 text-primary font-bold'
                                : 'hover:bg-secondary text-foreground',
                            )}
                          >
                            <span className="truncate">{v.name}</span>
                            <Badge
                              variant={
                                v.status === 'APPROVED'
                                  ? 'available'
                                  : v.status === 'PENDING'
                                  ? 'peak'
                                  : 'destructive'
                              }
                              className="text-[9px] px-1.5 py-0"
                            >
                              {v.status === 'APPROVED'
                                ? 'Hoạt động'
                                : v.status === 'PENDING'
                                ? 'Chờ duyệt'
                                : 'Tạm dừng'}
                            </Badge>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl border-border/80"
              title="Đổi giao diện Sáng/Tối"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </Button>

            <Link to="/venues">
              <Button size="sm" variant="secondary" className="rounded-xl font-bold text-xs hidden sm:inline-flex">
                Xem trang sàn
              </Button>
            </Link>
          </div>
        </header>

        {/* Dynamic Content Scroll Area */}
        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 md:p-8 w-full space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
