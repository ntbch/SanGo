import React from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Swords,
  Trophy,
  User,
  Users,
  Wallet,
  X,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';
import { UserRole } from '../../lib/constants';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { NotificationDropdown } from '../../features/notifications/components/notification-dropdown';

export function Navbar(): React.ReactElement {
  const { user, logout, logoutError } = useAuthStore();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = React.useState<'dark' | 'light'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

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

  // Đóng dropdown khi chuyển route
  React.useEffect(() => {
    setUserMenuOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  // Đóng dropdown khi click ra ngoài
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = async () => {
    if (await logout()) {
      setUserMenuOpen(false);
      navigate('/');
    }
  };

  const navLinks = [
    { to: '/venues', label: 'Tìm sân', icon: Compass },
    { to: '/matches', label: 'Ghép trận', icon: Swords },
    { to: '/tournaments', label: 'Giải đấu', icon: Trophy },
    { to: '/ranking', label: 'Xếp hạng', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-card transition-all">
      {logoutError && <p role="alert" className="p-3 text-xs text-destructive">{logoutError}</p>}
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 flex h-16 items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <img
            src="/favicon.svg"
            alt="SanGo Logo"
            className="h-9 w-9 object-contain transition-transform group-hover:scale-105"
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-foreground leading-none">
              San<span className="text-primary">Go</span>
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
              Sports Hub
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold transition-colors',
                  isActive
                    ? 'text-primary bg-primary/10 font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70',
                )
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Actions & User Area */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
          {/* Theme Switcher Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
            title="Đổi giao diện Sáng/Tối"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user ? (
            <div className="flex items-center gap-2 relative">
              {/* Notification Bell Popup */}
              <NotificationDropdown />

              {/* User Avatar Button & Dropdown Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1 p-1 rounded-full border border-border/80 bg-secondary/50 hover:bg-secondary hover:border-primary/60 transition-all cursor-pointer group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-xs shadow-xs">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 mr-1', userMenuOpen && 'rotate-180 text-foreground')} />
                </button>

                {/* Dropdown Menu Popup */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border/80 bg-card shadow-2xl p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                    {/* User Header Summary */}
                    <div className="p-2.5 pb-3 border-b border-border/60 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary font-black text-sm">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-foreground truncate">{user.fullName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-extrabold uppercase border border-primary/20">
                          {user.role === UserRole.OWNER ? 'Chủ Cụm Sân' : user.role === UserRole.ADMIN ? 'Quản Trị Viên' : 'Người Chơi'}
                        </span>
                      </div>
                    </div>

                    {/* Menu Navigation Links */}
                    <div className="py-1.5 space-y-0.5">
                      <Link
                        to="/bookings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                      >
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>Đơn đặt sân của tôi</span>
                      </Link>

                      <Link
                        to="/wallet"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                      >
                        <Wallet className="h-4 w-4 text-emerald-500" />
                        <span>Ví tiền SanGo</span>
                      </Link>

                      <Link
                        to="/teams"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                      >
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>Đội nhóm & Câu lạc bộ</span>
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                      >
                        <User className="h-4 w-4 text-primary" />
                        <span>Hồ sơ cá nhân</span>
                      </Link>

                      {(user.role === UserRole.OWNER || user.role === UserRole.ADMIN) && (
                        <Link
                          to="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-500 hover:bg-amber-500/10 transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          <span>Bảng điều khiển quản lý</span>
                        </Link>
                      )}
                    </div>

                    {/* Logout Button */}
                    <div className="pt-1.5 border-t border-border/60">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-xs lg:text-sm font-semibold">
                  Đăng nhập
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="default" size="sm" className="text-xs lg:text-sm font-bold shadow-xs">
                  Đăng ký
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center gap-1.5">
          {/* Theme Switcher Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
            title="Đổi giao diện Sáng/Tối"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user && (
            <NotificationDropdown />
          )}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-border bg-card p-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold',
                    isActive ? 'text-primary bg-primary/10 font-bold' : 'text-muted-foreground hover:bg-secondary',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-border/80 pt-3">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-secondary/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-sm">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold truncate">{user.fullName}</span>
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <Link
                    to="/bookings"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-secondary"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Đơn của tôi</span>
                  </Link>
                  <Link
                    to="/wallet"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-secondary"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Ví tiền</span>
                  </Link>
                  <Link
                    to="/teams"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-secondary"
                  >
                    <Users className="h-4 w-4" />
                    <span>Đội nhóm</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-secondary"
                  >
                    <User className="h-4 w-4" />
                    <span>Hồ sơ</span>
                  </Link>
                </div>

                {(user.role === UserRole.OWNER || user.role === UserRole.ADMIN) && (
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block pt-1">
                    <Button variant="outline" size="sm" className="w-full gap-2 text-primary border-primary/40 font-bold">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Bảng điều khiển</span>
                    </Button>
                  </Link>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full justify-center font-semibold">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}>
                  <Button variant="default" className="w-full justify-center font-bold">
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
