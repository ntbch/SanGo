import React from 'react';
import {
  Building2,
  Users,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Plus,
  Trophy,
  TicketPercent,
  BadgePercent,
  Phone,
  Mail,
  AlertCircle,
  ClipboardList,
  Eye,
  Lock,
  Unlock,
  Sparkles,
  ArrowRight,
  Swords,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { formatVND, formatMinutesToTime, cn } from '../../../lib/utils';
import { useAuthStore } from '../../../lib/auth-store';
import { DashboardLayout, ADMIN_NAV_GROUPS } from '../../dashboard/layouts/dashboard-layout';
import { RevenueTrendAreaChart } from '../../dashboard/components/dashboard-charts';
import * as adminApi from '../api/admin-api';
import { SportType, VenueStatus, UserRole, UserStatus, BookingStatus } from '@sango/shared';

const SPORT_TYPE_LABELS: Record<SportType, string> = {
  FOOTBALL5: 'Bóng đá 5',
  FOOTBALL7: 'Bóng đá 7',
  PICKLEBALL: 'Pickleball',
  BADMINTON: 'Cầu lông',
  TENNIS: 'Tennis',
};

const VENUE_STATUS_BADGES: Record<VenueStatus, { label: string; variant: 'available' | 'peak' | 'destructive' | 'outline' }> = {
  APPROVED: { label: 'Đã duyệt', variant: 'available' },
  PENDING: { label: 'Chờ duyệt', variant: 'peak' },
  REJECTED: { label: 'Bị từ chối', variant: 'destructive' },
  SUSPENDED: { label: 'Tạm treo', variant: 'outline' },
};

const BOOKING_STATUS_BADGES: Record<BookingStatus, { label: string; variant: 'available' | 'peak' | 'holding' | 'destructive' | 'outline' }> = {
  CONFIRMED: { label: 'Đã xác nhận', variant: 'available' },
  CHECKED_IN: { label: 'Đang đá', variant: 'available' },
  COMPLETED: { label: 'Hoàn thành', variant: 'outline' },
  CANCELLED: { label: 'Đã hủy', variant: 'destructive' },
  NO_SHOW: { label: 'Vắng mặt', variant: 'destructive' },
};

/* ========================================================================= */
/*                      TAB 1: STATS & OVERVIEW                              */
/* ========================================================================= */

interface StatsTabProps {
  stats: adminApi.AdminStatsResponse | null;
  loading: boolean;
  days: number;
  onDaysChange: (d: number) => void;
  onSelectTab: (tabId: string) => void;
}

function AdminStatsTab({ stats, loading, days, onDaysChange, onSelectTab }: StatsTabProps): React.ReactElement {
  if (loading && !stats) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs font-semibold">Đang tổng hợp dữ liệu toàn sàn...</p>
      </div>
    );
  }

  const totals = stats?.totals || {
    users: 0,
    customers: 0,
    owners: 0,
    venues: { total: 0, PENDING: 0, APPROVED: 0, REJECTED: 0, SUSPENDED: 0 },
    bookingsTotal: 0,
    bookingsToday: 0,
    revenueTodayVnd: 0,
  };

  return (
    <div className="w-full space-y-6">
      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Users */}
        <Card className="border-border/80 relative overflow-hidden bg-card/60">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Người Dùng Toàn Sàn</span>
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {totals.users.toLocaleString('vi-VN')}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">{totals.customers}</span> khách ·{' '}
              <span className="font-semibold text-foreground">{totals.owners}</span> chủ sân
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Venues */}
        <Card className="border-border/80 relative overflow-hidden bg-card/60">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hạ Tầng Cụm Sân</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              {totals.venues.total.toLocaleString('vi-VN')}
              {totals.venues.PENDING > 0 && (
                <button
                  onClick={() => onSelectTab('venues')}
                  className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors flex items-center gap-1 cursor-pointer animate-pulse"
                >
                  <Clock className="h-3 w-3" /> {totals.venues.PENDING} chờ duyệt
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="text-emerald-500 font-semibold">{totals.venues.APPROVED}</span> hoạt động ·{' '}
              <span className="text-destructive font-semibold">{totals.venues.REJECTED + totals.venues.SUSPENDED}</span> tạm dừng
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Bookings */}
        <Card className="border-border/80 relative overflow-hidden bg-card/60">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lượt Đặt Toàn Sàn</span>
              <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {totals.bookingsTotal.toLocaleString('vi-VN')}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="text-emerald-500 font-bold">+{totals.bookingsToday}</span> đơn phát sinh hôm nay
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Today Revenue */}
        <Card className="border-border/80 relative overflow-hidden bg-card/60">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dòng Tiền Hôm Nay</span>
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              {formatVND(totals.revenueTodayVnd)}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Doanh thu thực tế thanh toán qua sàn
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Revenue Trend Area Chart & Top Venues Podium */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Area Chart with Timeframe Switcher */}
        <Card className="lg:col-span-8 border-border/80 shadow-xs">
          <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Xu Hướng Dòng Tiền & Lượt Đặt Toàn Sàn
              </CardTitle>
              <CardDescription className="text-xs">
                Dữ liệu chuỗi thời gian liên tục với đường cong mượt mà {days} ngày gần nhất.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl border border-border/60 shrink-0">
              {[14, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => onDaysChange(d)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                    days === d
                      ? 'bg-card text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {d} Ngày
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-80 pt-2">
            <RevenueTrendAreaChart
              series={stats?.series || []}
              isDark={document.documentElement.classList.contains('dark')}
            />
          </CardContent>
        </Card>

        {/* Top 5 Venues Ranking */}
        <Card className="lg:col-span-4 border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> Top Cụm Sân Sinh Lời Cao Nhất
            </CardTitle>
            <CardDescription className="text-xs">Xếp hạng theo số lượt booking và doanh thu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!stats?.topVenues || stats.topVenues.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">Chưa có dữ liệu giao dịch sân.</p>
            ) : (
              stats.topVenues.map((v, idx) => (
                <div
                  key={v.venueId}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40 text-xs hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={cn(
                        'h-6 w-6 rounded-lg font-extrabold text-xs flex items-center justify-center shrink-0',
                        idx === 0
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          : idx === 1
                          ? 'bg-slate-400/20 text-slate-600 dark:text-slate-300'
                          : idx === 2
                          ? 'bg-amber-700/20 text-amber-700 dark:text-amber-500'
                          : 'bg-primary/10 text-primary',
                      )}
                    >
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-bold truncate text-foreground">{v.name}</p>
                      <p className="text-[10px] text-muted-foreground">{v.bookings} lượt đặt sân</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-foreground">{formatVND(v.revenueVnd)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Recent Activity Stream & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Activity Stream */}
        <Card className="lg:col-span-8 border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Dòng Sự Kiện Trực Tiếp Toàn Sàn
            </CardTitle>
            <CardDescription className="text-xs">Hoạt động nộp hồ sơ sân và đặt sân mới nhất.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">Chưa có sự kiện nào gần đây.</p>
            ) : (
              stats.recentActivity.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/30 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        'h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
                        item.type === 'VENUE_SUBMITTED'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                      )}
                    >
                      {item.type === 'VENUE_SUBMITTED' ? <Building2 className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-foreground truncate">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.type === 'VENUE_SUBMITTED' ? 'Cụm sân gửi hồ sơ xét duyệt mới' : 'Khách đặt sân thành công'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0 ml-2">
                    {new Date(item.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · {new Date(item.at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Admin Quick Action Hub */}
        <Card className="lg:col-span-4 border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Lối Tắt Quản Trị Viên
            </CardTitle>
            <CardDescription className="text-xs">Truy cập nhanh các phân hệ điều hành</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              onClick={() => onSelectTab('venues')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 hover:border-primary/40 hover:bg-secondary/50 transition-all text-left text-xs group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="h-3.5 w-3.5" />
                </div>
                <div className="truncate">
                  <p className="font-bold text-foreground">Xét Duyệt Cụm Sân Chờ</p>
                  <p className="text-[10px] text-muted-foreground">{totals.venues.PENDING} hồ sơ đang chờ</p>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            <button
              onClick={() => onSelectTab('users')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 hover:border-primary/40 hover:bg-secondary/50 transition-all text-left text-xs group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Users className="h-3.5 w-3.5" />
                </div>
                <div className="truncate">
                  <p className="font-bold text-foreground">Quản Lý Danh Bạ Người Dùng</p>
                  <p className="text-[10px] text-muted-foreground">{totals.users} tài khoản toàn sàn</p>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            <button
              onClick={() => onSelectTab('bookings')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 hover:border-primary/40 hover:bg-secondary/50 transition-all text-left text-xs group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ClipboardList className="h-3.5 w-3.5" />
                </div>
                <div className="truncate">
                  <p className="font-bold text-foreground">Sổ Tra Cứu Đơn Toàn Sàn</p>
                  <p className="text-[10px] text-muted-foreground">Tìm theo mã vé hoặc khách hàng</p>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ========================================================================= */
/*                      TAB 2: VENUES MODERATION                             */
/* ========================================================================= */

function AdminVenuesTab(): React.ReactElement {
  const [venues, setVenues] = React.useState<adminApi.AdminVenueListItem[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<VenueStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [selectedVenueDetail, setSelectedVenueDetail] = React.useState<adminApi.AdminVenueDetail | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = React.useState(false);
  const [rejectModalOpen, setRejectModalOpen] = React.useState(false);
  const [rejectVenueId, setRejectVenueId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchVenues = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAdminVenues({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        q: searchQuery.trim() || undefined,
        page,
        limit: 15,
      });
      setVenues(res.items);
      setTotalPages(res.pages);
    } catch (err) {
      console.error('Failed to load admin venues:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, page]);

  React.useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const handleInspect = async (id: string) => {
    try {
      const detail = await adminApi.getAdminVenueDetail(id);
      setSelectedVenueDetail(detail);
      setInspectModalOpen(true);
    } catch (err) {
      console.error('Failed to get venue detail:', err);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await adminApi.approveVenue(id);
      setInspectModalOpen(false);
      await fetchVenues();
    } catch (err) {
      console.error('Approve venue failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (id: string) => {
    setRejectVenueId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectVenueId || rejectReason.trim().length < 4) return;
    setActionLoading(true);
    try {
      await adminApi.rejectVenue(rejectVenueId, rejectReason.trim());
      setRejectModalOpen(false);
      setInspectModalOpen(false);
      await fetchVenues();
    } catch (err) {
      console.error('Reject venue failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: VenueStatus) => {
    const nextStatus = currentStatus === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';
    setActionLoading(true);
    try {
      await adminApi.updateVenueStatus(id, nextStatus);
      await fetchVenues();
    } catch (err) {
      console.error('Update venue status failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" /> Hàng Chờ & Xét Duyệt Cụm Sân
          </h1>
          <p className="text-xs text-muted-foreground">
            Kiểm tra hồ sơ pháp lý, danh sách sân con và phê duyệt cụm sân lên sàn tìm kiếm.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchVenues}
          disabled={loading}
          className="gap-2 text-xs font-bold self-start sm:self-auto"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Làm mới
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 space-y-4">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const).map((s) => {
              const label =
                s === 'ALL'
                  ? 'Tất Cả'
                  : s === 'PENDING'
                  ? '⏳ Chờ Duyệt'
                  : s === 'APPROVED'
                  ? '✅ Đã Duyệt'
                  : s === 'REJECTED'
                  ? '❌ Bị Từ Chối'
                  : '⏸️ Tạm Treo';
              const isActive = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s as VenueStatus | 'ALL');
                    setPage(1);
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo tên cụm sân, địa chỉ..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-secondary/50 border border-border/80 text-xs font-medium text-foreground focus:outline-hidden focus:border-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Venues Table */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/50 border-b border-border/80 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 pl-4">Cụm Sân</th>
                  <th className="p-3.5">Chủ Sân</th>
                  <th className="p-3.5">Khu Vực</th>
                  <th className="p-3.5">Quy Mô</th>
                  <th className="p-3.5">Trạng Thái</th>
                  <th className="p-3.5 pr-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium text-foreground">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
                      Đang tải danh sách cụm sân...
                    </td>
                  </tr>
                ) : venues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Không tìm thấy cụm sân nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  venues.map((v) => {
                    const badge = VENUE_STATUS_BADGES[v.status] || { label: v.status, variant: 'outline' };
                    return (
                      <tr key={v.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="p-3.5 pl-4">
                          <div className="font-bold text-foreground text-sm">{v.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-xs">{v.address}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold">{v.owner.fullName}</div>
                          <div className="text-[10px] text-muted-foreground">{v.owner.email}</div>
                        </td>
                        <td className="p-3.5">
                          <div>{v.district}</div>
                          <div className="text-[10px] text-muted-foreground">{v.city}</div>
                        </td>
                        <td className="p-3.5">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {v._count?.courts || 0} sân con
                          </Badge>
                        </td>
                        <td className="p-3.5">
                          <Badge variant={badge.variant} className="text-[10px]">
                            {badge.label}
                          </Badge>
                        </td>
                        <td className="p-3.5 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleInspect(v.id)}
                              className="h-8 px-2.5 text-xs font-bold gap-1 text-primary hover:text-primary"
                              title="Soi hồ sơ chi tiết"
                            >
                              <Eye className="h-3.5 w-3.5" /> Xem
                            </Button>

                            {v.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleApprove(v.id)}
                                  disabled={actionLoading}
                                  className="h-8 px-2.5 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenReject(v.id)}
                                  disabled={actionLoading}
                                  className="h-8 px-2.5 text-xs font-bold gap-1 text-destructive border-destructive/40 hover:bg-destructive/10"
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Từ chối
                                </Button>
                              </>
                            )}

                            {v.status === 'APPROVED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(v.id, v.status)}
                                disabled={actionLoading}
                                className="h-8 px-2 text-xs font-bold gap-1 text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/10"
                                title="Treo sân"
                              >
                                Treo sân
                              </Button>
                            )}

                            {v.status === 'SUSPENDED' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleToggleStatus(v.id, v.status)}
                                disabled={actionLoading}
                                className="h-8 px-2 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                title="Kích hoạt lại"
                              >
                                Mở lại
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
              <span>Trang {page} / {totalPages}</span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-7 px-2.5 text-xs font-bold"
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-7 px-2.5 text-xs font-bold"
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inspect Venue Detail Modal */}
      <Dialog open={inspectModalOpen} onOpenChange={setInspectModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedVenueDetail && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant={VENUE_STATUS_BADGES[selectedVenueDetail.status]?.variant || 'outline'}>
                    {VENUE_STATUS_BADGES[selectedVenueDetail.status]?.label || selectedVenueDetail.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Mã: {selectedVenueDetail.id.slice(0, 8)}</span>
                </div>
                <DialogTitle className="text-xl font-bold">{selectedVenueDetail.name}</DialogTitle>
                <DialogDescription className="text-xs">{selectedVenueDetail.address}, {selectedVenueDetail.district}, {selectedVenueDetail.city}</DialogDescription>
              </DialogHeader>

              {/* Owner Info Box */}
              <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/80 space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase">Hồ Sơ Chủ Cụm Sân</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-bold text-foreground">{selectedVenueDetail.owner.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{selectedVenueDetail.owner.email}</span>
                  </div>
                  {selectedVenueDetail.owner.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedVenueDetail.owner.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Mở cửa: {formatMinutesToTime(selectedVenueDetail.openMinute)} - {formatMinutesToTime(selectedVenueDetail.closeMinute)} (Cọc {selectedVenueDetail.depositPercent}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Reject reason history */}
              {selectedVenueDetail.rejectReason && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Lý do từ chối trước đó:</p>
                    <p>{selectedVenueDetail.rejectReason}</p>
                  </div>
                </div>
              )}

              {/* Courts List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase">
                  Danh Sách Sân Con ({selectedVenueDetail.courts.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedVenueDetail.courts.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-card border border-border/80 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-foreground">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{SPORT_TYPE_LABELS[c.sportType]}</p>
                      </div>
                      <Badge variant={c.isMaintenance ? 'destructive' : 'available'} className="text-[9px]">
                        {c.isMaintenance ? 'Bảo trì' : 'Sẵn sàng'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                <Button variant="ghost" size="sm" onClick={() => setInspectModalOpen(false)}>
                  Đóng
                </Button>
                <div className="flex items-center gap-2">
                  {selectedVenueDetail.status === 'PENDING' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReject(selectedVenueDetail.id)}
                        disabled={actionLoading}
                        className="text-xs font-bold text-destructive border-destructive/40"
                      >
                        Từ Chối Hồ Sơ
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(selectedVenueDetail.id)}
                        disabled={actionLoading}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Phê Duyệt Sân
                      </Button>
                    </>
                  )}
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Venue Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" /> Từ Chối Hồ Sơ Cụm Sân
            </DialogTitle>
            <DialogDescription className="text-xs">
              Vui lòng nêu rõ lý do từ chối để chủ sân biết cần chỉnh sửa hoặc bổ sung giấy tờ gì.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-xs font-bold text-foreground">
              Lý do từ chối <span className="text-destructive">*</span> (tối thiểu 4 ký tự)
            </label>
            <textarea
              rows={3}
              placeholder="VD: Thiếu hình ảnh thực tế sân, số điện thoại chủ sân không liên lạc được..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-secondary/50 border border-border/80 text-xs text-foreground focus:outline-hidden focus:border-destructive"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRejectModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={rejectReason.trim().length < 4 || actionLoading}
              onClick={handleConfirmReject}
              className="font-bold text-xs"
            >
              {actionLoading ? 'Đang xử lý...' : 'Xác Nhận Từ Chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ========================================================================= */
/*                      TAB 3: USERS MODERATION                              */
/* ========================================================================= */

function AdminUsersTab(): React.ReactElement {
  const { user: currentAdmin } = useAuthStore();
  const [users, setUsers] = React.useState<adminApi.AdminUserListItem[]>([]);
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<UserStatus | 'ALL'>('ALL');
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAdminUsers({
        search: search.trim() || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        pageSize: 15,
      });
      setUsers(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleUserStatus = async (targetUser: adminApi.AdminUserListItem) => {
    if (targetUser.id === currentAdmin?.id) {
      alert('Không thể tự khóa tài khoản chính mình!');
      return;
    }
    if (targetUser.role === UserRole.ADMIN && targetUser.status === UserStatus.ACTIVE) {
      alert('Không thể khóa tài khoản của quản trị viên khác!');
      return;
    }

    const nextStatus = targetUser.status === UserStatus.ACTIVE ? UserStatus.LOCKED : UserStatus.ACTIVE;
    setActionLoading(true);
    try {
      await adminApi.updateUserStatus(targetUser.id, nextStatus);
      await fetchUsers();
    } catch (err) {
      console.error('Update user status failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Quản Trị Người Dùng & Phân Quyền
          </h1>
          <p className="text-xs text-muted-foreground">
            Danh bạ toàn bộ tài khoản khách hàng, chủ sân và quản trị viên trên toàn hệ thống ({total} tài khoản).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading} className="gap-2 text-xs font-bold self-start sm:self-auto">
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Làm mới
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, email, SĐT..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-xs font-medium text-foreground focus:outline-hidden focus:border-primary"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | 'ALL');
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-xs font-medium text-foreground focus:outline-hidden focus:border-primary"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value={UserRole.CUSTOMER}>Người chơi (CUSTOMER)</option>
              <option value={UserRole.OWNER}>Chủ sân (OWNER)</option>
              <option value={UserRole.ADMIN}>Quản trị viên (ADMIN)</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as UserStatus | 'ALL');
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-xs font-medium text-foreground focus:outline-hidden focus:border-primary"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value={UserStatus.ACTIVE}>Đang hoạt động (ACTIVE)</option>
              <option value={UserStatus.LOCKED}>Đã bị khóa (LOCKED)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/50 border-b border-border/80 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 pl-4">Người Dùng</th>
                  <th className="p-3.5">Liên Hệ</th>
                  <th className="p-3.5">Vai Trò</th>
                  <th className="p-3.5">Lịch Sử Đặt</th>
                  <th className="p-3.5">Trạng Thái</th>
                  <th className="p-3.5 pr-4 text-right">Khóa / Mở Khóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium text-foreground">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
                      Đang tải danh sách người dùng...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Không tìm thấy người dùng nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = u.id === currentAdmin?.id;
                    const isOtherAdmin = u.role === UserRole.ADMIN && !isSelf;
                    return (
                      <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="p-3.5 pl-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                              {u.fullName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-foreground flex items-center gap-1.5">
                                {u.fullName}
                                {isSelf && <span className="text-[9px] text-primary font-mono">(Bạn)</span>}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">Tham gia: {new Date(u.createdAt).toLocaleDateString('vi-VN')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="text-foreground">{u.email}</div>
                          <div className="text-[10px] text-muted-foreground">{u.phone || 'Chưa cập nhật SĐT'}</div>
                        </td>
                        <td className="p-3.5">
                          <Badge
                            variant={
                              u.role === UserRole.ADMIN
                                ? 'peak'
                                : u.role === UserRole.OWNER
                                ? 'available'
                                : 'outline'
                            }
                            className="text-[9px] font-bold"
                          >
                            {u.role === UserRole.ADMIN ? 'ADMIN' : u.role === UserRole.OWNER ? 'OWNER' : 'CUSTOMER'}
                          </Badge>
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono font-bold">{u.bookingCount}</span> đơn đặt
                        </td>
                        <td className="p-3.5">
                          <Badge variant={u.status === UserStatus.ACTIVE ? 'available' : 'destructive'} className="text-[9px]">
                            {u.status === UserStatus.ACTIVE ? 'Hoạt động' : 'Đã khóa'}
                          </Badge>
                        </td>
                        <td className="p-3.5 pr-4 text-right">
                          <Button
                            variant={u.status === UserStatus.ACTIVE ? 'outline' : 'default'}
                            size="sm"
                            disabled={isSelf || (isOtherAdmin && u.status === UserStatus.ACTIVE) || actionLoading}
                            onClick={() => handleToggleUserStatus(u)}
                            className={cn(
                              'h-7 px-2 text-xs font-bold gap-1',
                              u.status === UserStatus.ACTIVE
                                ? 'text-destructive border-destructive/40 hover:bg-destructive/10'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white',
                            )}
                            title={isSelf ? 'Không thể tự khóa chính mình' : isOtherAdmin ? 'Không thể khóa Admin khác' : ''}
                          >
                            {u.status === UserStatus.ACTIVE ? (
                              <>
                                <Lock className="h-3 w-3" /> Khóa
                              </>
                            ) : (
                              <>
                                <Unlock className="h-3 w-3" /> Mở khóa
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ========================================================================= */
/*                      TAB 4: CROSS-PLATFORM BOOKINGS AUDIT                 */
/* ========================================================================= */

function AdminBookingsTab(): React.ReactElement {
  const [bookings, setBookings] = React.useState<adminApi.AdminBookingListItem[]>([]);
  const [search, setSearch] = React.useState('');
  const [date, setDate] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<BookingStatus | 'ALL'>('ALL');
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const fetchBookings = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAdminBookings({
        search: search.trim() || undefined,
        date: date || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        pageSize: 20,
      });
      setBookings(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to fetch admin bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [search, date, statusFilter, page]);

  React.useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const setDatePreset = (preset: 'today' | 'yesterday' | 'all') => {
    if (preset === 'all') {
      setDate('');
    } else if (preset === 'today') {
      setDate(new Date().toISOString().slice(0, 10));
    } else if (preset === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      setDate(d.toISOString().slice(0, 10));
    }
    setPage(1);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" /> Sổ Tra Cứu Đơn Toàn Sàn
          </h1>
          <p className="text-xs text-muted-foreground">
            Tra cứu và giám sát tất cả các giao dịch đặt sân trên toàn bộ các cụm sân ({total} đơn).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchBookings} disabled={loading} className="gap-2 text-xs font-bold self-start sm:self-auto">
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Làm mới
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search code or name */}
          <div className="sm:col-span-5 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm mã vé CH-YYYYMMDD-NNNN hoặc tên khách..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-xs font-medium text-foreground focus:outline-hidden focus:border-primary"
            />
          </div>

          {/* Date Picker & Presets */}
          <div className="sm:col-span-4 flex items-center gap-1.5">
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-2 rounded-xl bg-secondary/50 border border-border/80 text-xs font-mono text-foreground focus:outline-hidden focus:border-primary flex-1"
            />
            <button
              onClick={() => setDatePreset('today')}
              className={cn(
                'px-2 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0',
                date === new Date().toISOString().slice(0, 10) ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground hover:bg-secondary',
              )}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setDatePreset('all')}
              className={cn(
                'px-2 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0',
                date === '' ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground hover:bg-secondary',
              )}
            >
              Tất cả
            </button>
          </div>

          {/* Status filter */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as BookingStatus | 'ALL');
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-xs font-medium text-foreground focus:outline-hidden focus:border-primary"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value={BookingStatus.CONFIRMED}>Đã xác nhận</option>
              <option value={BookingStatus.CHECKED_IN}>Đang đá</option>
              <option value={BookingStatus.COMPLETED}>Hoàn thành</option>
              <option value={BookingStatus.CANCELLED}>Đã hủy</option>
              <option value={BookingStatus.NO_SHOW}>Vắng mặt</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/50 border-b border-border/80 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 pl-4">Mã Vé</th>
                  <th className="p-3.5">Khách Hàng</th>
                  <th className="p-3.5">Cụm Sân & Sân Con</th>
                  <th className="p-3.5">Khung Giờ Thi Đấu</th>
                  <th className="p-3.5">Tổng Tiền</th>
                  <th className="p-3.5 pr-4 text-right">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium text-foreground">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
                      Đang tra cứu danh sách đơn...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Không tìm thấy đơn đặt nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => {
                    const badge = BOOKING_STATUS_BADGES[b.status] || { label: b.status, variant: 'outline' };
                    return (
                      <tr key={b.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="p-3.5 pl-4 font-mono font-bold text-foreground">
                          {b.code}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-foreground">{b.customerName}</div>
                          <div className="text-[10px] text-muted-foreground">{b.customerEmail}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-foreground">{b.venueName}</div>
                          <div className="text-[10px] text-muted-foreground">{b.courtName}</div>
                        </td>
                        <td className="p-3.5 font-mono">
                          <div>
                            {new Date(b.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} -{' '}
                            {new Date(b.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(b.startTime).toLocaleDateString('vi-VN')}
                          </div>
                        </td>
                        <td className="p-3.5 font-extrabold text-primary">
                          {formatVND(b.totalPriceVnd)}
                        </td>
                        <td className="p-3.5 pr-4 text-right">
                          <Badge variant={badge.variant} className="text-[10px]">
                            {badge.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ========================================================================= */
/*                      TAB 5: TOURNAMENTS MANAGEMENT                        */
/* ========================================================================= */

function AdminTournamentsTab(): React.ReactElement {
  const [tournaments, setTournaments] = React.useState<adminApi.AdminTournament[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [sportType, setSportType] = React.useState<SportType>(SportType.FOOTBALL5);
  const [maxTeams, setMaxTeams] = React.useState(8);
  const [prizePoolVnd, setPrizePoolVnd] = React.useState(5000000);
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchTournaments = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAdminTournaments();
      setTournaments(data);
    } catch (err) {
      console.error('Failed to load tournaments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setActionLoading(true);
    try {
      await adminApi.createAdminTournament({
        name: name.trim(),
        sportType,
        maxTeams,
        prizePoolVnd,
      });
      setCreateModalOpen(false);
      setName('');
      await fetchTournaments();
    } catch (err) {
      console.error('Failed to create tournament:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async (id: string) => {
    setActionLoading(true);
    try {
      await adminApi.startAdminTournament(id);
      await fetchTournaments();
    } catch (err) {
      console.error('Start tournament failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" /> Điều Hành Giải Đấu Thể Thao
          </h1>
          <p className="text-xs text-muted-foreground">
            Tổ chức các giải đấu loại trực tiếp (Single-elimination), tự động chia bảng và cập nhật tỷ số.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTournaments} disabled={loading} className="gap-2 text-xs font-bold">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Làm mới
          </Button>
          <Button variant="default" size="sm" onClick={() => setCreateModalOpen(true)} className="gap-2 text-xs font-bold shadow-xs">
            <Plus className="h-3.5 w-3.5" /> Tạo Giải Đấu Mới
          </Button>
        </div>
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
            Đang tải danh sách giải đấu...
          </div>
        ) : tournaments.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
            Chưa có giải đấu nào. Bấm nút <strong>Tạo Giải Đấu Mới</strong> để khởi tạo giải đấu đầu tiên.
          </div>
        ) : (
          tournaments.map((t) => (
            <Card key={t.id} className="border-border/80 hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
                <div>
                  <Badge variant="outline" className="text-[10px] mb-1">
                    {SPORT_TYPE_LABELS[t.sportType] || t.sportType}
                  </Badge>
                  <CardTitle className="text-base font-bold line-clamp-1">{t.name}</CardTitle>
                </div>
                <Badge
                  variant={
                    t.status === 'COMPLETED'
                      ? 'outline'
                      : t.status === 'ONGOING'
                      ? 'available'
                      : 'peak'
                  }
                  className="text-[9px] shrink-0"
                >
                  {t.status === 'COMPLETED'
                    ? 'Đã kết thúc'
                    : t.status === 'ONGOING'
                    ? 'Đang diễn ra'
                    : 'Đang mở đăng ký'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Quy mô:</span>
                  <span className="font-bold text-foreground">{t.maxTeams} Đội</span>
                </div>
                {t.prizePoolVnd && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Tổng giải thưởng:</span>
                    <span className="font-bold text-emerald-500">{formatVND(t.prizePoolVnd)}</span>
                  </div>
                )}

                {t.status === 'REGISTRATION' && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleStart(t.id)}
                    className="w-full text-xs font-bold gap-1 text-primary border-primary/40 hover:bg-primary/10 mt-2"
                  >
                    <Swords className="h-3.5 w-3.5" /> Khóa Đăng Ký & Chia Bảng
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Tournament Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" /> Tạo Giải Đấu Thể Thao Mới
              </DialogTitle>
              <DialogDescription className="text-xs">
                Thiết lập giải đấu loại trực tiếp (Single-elimination knockout).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Tên giải đấu *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: SanGo Champions Cup 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary/50 border border-border/80 text-foreground focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">Môn thể thao</label>
                  <select
                    value={sportType}
                    onChange={(e) => setSportType(e.target.value as SportType)}
                    className="w-full p-2.5 rounded-xl bg-secondary/50 border border-border/80 text-foreground focus:outline-hidden focus:border-primary"
                  >
                    {Object.entries(SPORT_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Số đội tối đa</label>
                  <select
                    value={maxTeams}
                    onChange={(e) => setMaxTeams(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-secondary/50 border border-border/80 text-foreground focus:outline-hidden focus:border-primary"
                  >
                    <option value={4}>4 Đội (Bán kết)</option>
                    <option value={8}>8 Đội (Tứ kết)</option>
                    <option value={16}>16 Đội (Vòng 16)</option>
                    <option value={32}>32 Đội (Vòng 32)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Tổng tiền thưởng (VND)</label>
                <input
                  type="number"
                  step={500000}
                  value={prizePoolVnd}
                  onChange={(e) => setPrizePoolVnd(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-secondary/50 border border-border/80 text-foreground focus:outline-hidden focus:border-primary font-mono"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCreateModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="default" size="sm" disabled={actionLoading} className="font-bold text-xs">
                {actionLoading ? 'Đang tạo...' : 'Tạo Giải Đấu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ========================================================================= */
/*                      TAB 6: ALL COURTS DIRECTORY                          */
/* ========================================================================= */

function AdminCourtsTab(): React.ReactElement {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Danh Bạ Sân Con & Bảo Trì Toàn Sàn
          </h1>
          <p className="text-xs text-muted-foreground">
            Quản trị và can thiệp bật/tắt bảo trì khẩn cấp toàn bộ các sân con trên hệ thống.
          </p>
        </div>
      </div>
      <Card className="border-border/80">
        <CardContent className="p-8 text-center text-muted-foreground text-xs sm:text-sm space-y-2">
          <p className="font-semibold text-foreground">Hệ Thống Sân Con Đang Hoạt Động Bình Thường</p>
          <p>Quản trị viên có thể vào trực tiếp từng Cụm Sân trong tab <strong>Hàng Chờ & Duyệt Sân</strong> để xem chi tiết và can thiệp bảo trì từng sân con.</p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ========================================================================= */
/*                      TAB 7: VOUCHERS MANAGEMENT                           */
/* ========================================================================= */

function AdminVouchersTab(): React.ReactElement {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            <TicketPercent className="h-6 w-6 text-primary" /> Kho Voucher & Mã Khuyến Mãi Sàn
          </h1>
          <p className="text-xs text-muted-foreground">
            Quản trị các chiến dịch ưu đãi giờ thấp điểm và voucher giảm giá kích cầu toàn hệ thống.
          </p>
        </div>
      </div>
      <Card className="border-border/80">
        <CardContent className="p-8 text-center text-muted-foreground text-xs sm:text-sm space-y-2">
          <p className="font-semibold text-foreground">Trung Tâm Quản Lý Mã Giảm Giá Chiến Dịch</p>
          <p>Các mã voucher kích cầu toàn sàn đang được áp dụng tự động cho các khung giờ thấp điểm từ 08:00 đến 15:00 hàng ngày.</p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ========================================================================= */
/*                      TAB 8: PRICING & SERVICES                            */
/* ========================================================================= */

function AdminPricingTab(): React.ReactElement {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            <BadgePercent className="h-6 w-6 text-primary" /> Bảng Giá Giờ Vàng & Menu Dịch Vụ
          </h1>
          <p className="text-xs text-muted-foreground">
            Giám sát ma trận biểu phí giờ cao điểm và menu nước uống, dụng cụ của các cụm sân đối tác.
          </p>
        </div>
      </div>
      <Card className="border-border/80">
        <CardContent className="p-8 text-center text-muted-foreground text-xs sm:text-sm space-y-2">
          <p className="font-semibold text-foreground">Giám Sát Chính Sách Giá Sàn</p>
          <p>Tất cả cụm sân đối tác đang tuân thủ đúng quy định niêm yết bảng giá giờ vàng và menu dịch vụ công khai trên sàn SanGo.</p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ========================================================================= */
/*                      MAIN ADMIN DASHBOARD PAGE                            */
/* ========================================================================= */

export function AdminDashboardPage(): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState('stats');
  const [stats, setStats] = React.useState<adminApi.AdminStatsResponse | null>(null);
  const [days, setDays] = React.useState(14);
  const [statsLoading, setStatsLoading] = React.useState(true);

  const fetchStats = React.useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await adminApi.getAdminStats(days);
      setStats(res);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [days]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <DashboardLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      navGroups={ADMIN_NAV_GROUPS}
      dashboardTitle="SanGo"
      dashboardSubtitle="Tổng Quản Trị Hệ Thống"
      dashboardBadge="Admin"
      hideVenueSelector={true}
    >
      {activeTab === 'stats' && (
        <AdminStatsTab
          stats={stats}
          loading={statsLoading}
          days={days}
          onDaysChange={setDays}
          onSelectTab={setActiveTab}
        />
      )}
      {activeTab === 'venues' && <AdminVenuesTab />}
      {activeTab === 'users' && <AdminUsersTab />}
      {activeTab === 'bookings' && <AdminBookingsTab />}
      {activeTab === 'tournaments' && <AdminTournamentsTab />}
      {activeTab === 'courts' && <AdminCourtsTab />}
      {activeTab === 'vouchers' && <AdminVouchersTab />}
      {activeTab === 'pricing' && <AdminPricingTab />}
    </DashboardLayout>
  );
}

/* Exports for legacy route compatibility */
export {
  AdminStatsTab as AdminStatsPage,
  AdminVenuesTab as AdminVenuesPage,
  AdminUsersTab as AdminUsersPage,
  AdminBookingsTab as AdminBookingsPage,
};
