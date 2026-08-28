import React from 'react';
import {
  Building2,
  Users,
  ShieldAlert,
  Calendar,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Trophy,
  ClipboardList,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { formatVND, cn } from '../../../lib/utils';
import { RevenueTrendAreaChart } from '../../dashboard/components/dashboard-charts';
import * as adminApi from '../api/admin-api';

export interface AdminStatsTabProps {
  stats: adminApi.AdminStatsResponse | null;
  loading: boolean;
  days: number;
  onDaysChange: (d: number) => void;
  onSelectTab: (tabId: string) => void;
}

export function AdminStatsTab({
  stats,
  loading,
  days,
  onDaysChange,
  onSelectTab,
}: AdminStatsTabProps): React.ReactElement {
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
                  type="button"
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
                <TrendingUp className="h-4 w-4 text-primary" /> Xu Hướng Dòng Tiền &amp; Lượt Đặt Toàn Sàn
              </CardTitle>
              <CardDescription className="text-xs">
                Dữ liệu chuỗi thời gian liên tục với đường cong mượt mà {days} ngày gần nhất.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl border border-border/60 shrink-0">
              {[14, 30, 90].map((d) => (
                <button
                  type="button"
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
              type="button"
              onClick={() => onSelectTab('venues')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 hover:border-primary/40 hover:bg-secondary/50 transition-all text-left text-xs group cursor-pointer"
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
              type="button"
              onClick={() => onSelectTab('users')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 hover:border-primary/40 hover:bg-secondary/50 transition-all text-left text-xs group cursor-pointer"
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
              type="button"
              onClick={() => onSelectTab('bookings')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 hover:border-primary/40 hover:bg-secondary/50 transition-all text-left text-xs group cursor-pointer"
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
