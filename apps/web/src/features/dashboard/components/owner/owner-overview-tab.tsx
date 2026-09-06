import React from 'react';
import {
  type OwnerVenue,
  type Court,
  type OwnerAnalyticsResponse,
  type OwnerBookingItem,
  type SportType,
} from '../../api/owner-api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { formatVND, formatMinutesToTime } from '../../../../lib/utils';
import { useAuthStore } from '../../../../lib/auth-store';
import {
  RevenueTrendAreaChart,
} from '../dashboard-charts';
import {
  LayoutDashboard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  Building2,
  Layers,
  Search,
  TicketPercent,
  CupSoda,
  RefreshCw,
  BadgePercent,
  ArrowRight,
  Sparkles,
  Activity,
  Check,
} from 'lucide-react';

const SPORT_TYPE_LABELS: Record<SportType, string> = {
  FOOTBALL5: 'Bóng đá 5',
  FOOTBALL7: 'Bóng đá 7',
  PICKLEBALL: 'Pickleball',
  BADMINTON: 'Cầu lông',
  TENNIS: 'Tennis',
};

interface OwnerOverviewTabProps {
  selectedVenue: OwnerVenue | null;
  analytics: OwnerAnalyticsResponse | null;
  bookings: OwnerBookingItem[];
  courts: Court[];
  loadingBookings: boolean;
  checkInCode: string;
  setCheckInCode: (code: string) => void;
  checkInLoading: boolean;
  checkInError: string | null;
  checkInResult: { message: string; booking: OwnerBookingItem } | null;
  onCheckInSubmit: (e: React.FormEvent) => void;
  onQuickCheckIn: (code: string) => void;
  onNavigateTab: (tab: string) => void;
}

export function OwnerOverviewTab({
  selectedVenue,
  analytics,
  bookings,
  courts,
  loadingBookings,
  checkInCode,
  setCheckInCode,
  checkInLoading,
  checkInError,
  checkInResult,
  onCheckInSubmit,
  onQuickCheckIn,
  onNavigateTab,
}: OwnerOverviewTabProps): React.ReactElement {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Welcome & Context Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 flex items-center gap-1">
              <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
              <span>Trung Tâm Điều Hành</span>
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            Xin chào, {user?.fullName || 'Chủ Sân'}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-primary shrink-0" />
            <span>Đang điều hành: <strong className="text-foreground">{selectedVenue ? selectedVenue.name : 'Chưa chọn cụm sân'}</strong></span>
            {selectedVenue && (
              <span className="text-muted-foreground">({selectedVenue.district}, {selectedVenue.city})</span>
            )}
          </p>
        </div>

        {selectedVenue && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Badge
              variant={
                selectedVenue.status === 'APPROVED'
                  ? 'available'
                  : selectedVenue.status === 'PENDING'
                  ? 'peak'
                  : 'destructive'
              }
              className="font-bold py-1 px-2.5 text-xs"
            >
              {selectedVenue.status === 'APPROVED' ? 'Đã Kiểm Duyệt' : selectedVenue.status === 'PENDING' ? 'Chờ Duyệt' : 'Tạm Khóa'}
            </Badge>
            <Badge variant="outline" className="text-xs py-1 px-2.5">
              <Clock className="h-3 w-3 mr-1 text-primary" />
              {formatMinutesToTime(selectedVenue.openMinute)} - {formatMinutesToTime(selectedVenue.closeMinute)}
            </Badge>
            <Badge variant="outline" className="text-xs py-1 px-2.5">
              Cọc {selectedVenue.depositPercent}%
            </Badge>
          </div>
        )}
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          onClick={() => onNavigateTab('analytics')}
          className="border-border/80 hover:border-primary/50 transition-all cursor-pointer group bg-card"
        >
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Doanh Thu (30 Ngày)</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-foreground">
                {formatVND(analytics?.revenueConfirmed || 0)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span>{analytics?.totalBookings || 0} lượt đặt thành công</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => onNavigateTab('checkin')}
          className="border-border/80 hover:border-primary/50 transition-all cursor-pointer group bg-card"
        >
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lịch Đá Hôm Nay</span>
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-foreground">
                {bookings.length} ca đặt
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-500" />
                <span>{bookings.filter((b) => b.status === 'CHECKED_IN').length} đã check-in · {bookings.filter((b) => b.status === 'CONFIRMED').length} chờ đến</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => onNavigateTab('analytics')}
          className="border-border/80 hover:border-primary/50 transition-all cursor-pointer group bg-card"
        >
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tỷ Lệ Lấp Đầy</span>
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-foreground">
                {analytics?.occupancyRate || 0}%
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Activity className="h-3 w-3 text-amber-500" />
                <span>Tỷ lệ hủy/no-show: {analytics?.cancelRate || 0}%</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => onNavigateTab('venues')}
          className="border-border/80 hover:border-primary/50 transition-all cursor-pointer group bg-card"
        >
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quy Mô Sân Bãi</span>
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-foreground">
                {courts.length} sân con
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                <span>{courts.filter((c) => c.status === 'ACTIVE').length} hoạt động</span>
                {courts.filter((c) => c.status === 'MAINTENANCE').length > 0 && (
                  <span className="text-rose-500 font-semibold">· {courts.filter((c) => c.status === 'MAINTENANCE').length} bảo trì</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bento Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols */}
        <div className="lg:col-span-8 space-y-6">
          {/* Fast 1-Click Check-in on Overview */}
          <Card className="border-primary/20 bg-card shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                  <QrCode className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Check-in Nhanh Tại Bàn Làm Việc</CardTitle>
                  <CardDescription className="text-xs">Quét hoặc nhập mã vé để check-in khách.</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateTab('checkin')}
                className="text-xs font-bold gap-1 text-primary hover:text-primary"
              >
                Vào Quầy Check-in <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={onCheckInSubmit} className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1">
                  <Input
                    placeholder="Nhập mã đơn vé (ví dụ: CH-20260828-0001)..."
                    value={checkInCode}
                    onChange={(e) => setCheckInCode(e.target.value)}
                    prefixIcon={<Search className="h-4 w-4" />}
                    className="h-10 font-mono uppercase font-bold text-xs"
                  />
                </div>
                <Button type="submit" loading={checkInLoading} className="h-10 px-5 font-bold shadow-xs text-xs">
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Xác Nhận
                </Button>
              </form>

              {checkInError && (
                <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{checkInError}</span>
                </div>
              )}

              {checkInResult && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs animate-in fade-in-0 duration-200">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{checkInResult.message} ({checkInResult.booking.customer.fullName} - {checkInResult.booking.court.name})</span>
                  </div>
                  <Badge variant="available" className="font-mono text-[10px]">
                    {checkInResult.booking.code}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Bookings Live Feed */}
          <Card className="border-border/80">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Lịch Ca Thi Đấu Hôm Nay ({bookings.length} ca)
                </CardTitle>
                <CardDescription className="text-xs">
                  Danh sách khách đặt sân trong ngày. Nhấn check-in khi khách vào sân.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateTab('checkin')}
                className="text-xs font-bold gap-1 rounded-xl"
              >
                Xem tất cả lịch <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>

            <CardContent>
              {loadingBookings ? (
                <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                  <span>Đang nạp ca đá hôm nay...</span>
                </div>
              ) : bookings.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                  <Calendar className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p className="font-semibold text-foreground">Hôm nay chưa có ca đặt nào.</p>
                  <p className="text-[11px] text-muted-foreground">Đơn từ app hoặc quầy sẽ hiện tại đây.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {bookings.slice(0, 5).map((b) => (
                    <div key={b.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary">{b.code}</span>
                          <Badge
                            variant={
                              b.status === 'CONFIRMED'
                                ? 'available'
                                : b.status === 'CHECKED_IN'
                                ? 'primary'
                                : b.status === 'COMPLETED'
                                ? 'default'
                                : b.status === 'NO_SHOW'
                                ? 'destructive'
                                : 'booked'
                            }
                            className="text-[10px] py-0 px-1.5"
                          >
                            {b.status}
                          </Badge>
                        </div>
                        <p className="font-bold text-foreground truncate">{b.customer.fullName} · {b.court.name}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <span>{formatMinutesToTime(b.startMinute)} - {formatMinutesToTime(b.endMinute)}</span>
                          <span>· Cọc: {formatVND(b.depositAmount)}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {b.status === 'CONFIRMED' && (
                          <Button
                            size="sm"
                            onClick={() => onQuickCheckIn(b.code)}
                            className="h-8 text-xs font-bold gap-1 rounded-xl shadow-xs"
                          >
                            <Check className="h-3.5 w-3.5" /> Check-in
                          </Button>
                        )}
                        {b.status === 'CHECKED_IN' && (
                          <Badge variant="primary" className="text-xs font-semibold py-1 px-2">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Đã Vào Sân
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 14-Day Revenue Area Chart */}
          {analytics && analytics.series.length > 0 && (
            <Card className="border-border/80">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> Xu Hướng Doanh Thu Gần Đây
                  </CardTitle>
                  <CardDescription className="text-xs">Dòng tiền và lượt đặt theo thời gian thực.</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigateTab('analytics')}
                  className="text-xs font-bold gap-1 text-primary hover:text-primary"
                >
                  Báo Cáo Đầy Đủ <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="h-64 pt-2">
                <RevenueTrendAreaChart
                  series={analytics.series.slice(-14)}
                  isDark={document.documentElement.classList.contains('dark')}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right 4 Cols */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions Shortcuts Hub */}
          <Card className="border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Lối Tắt Vận Hành Sân
              </CardTitle>
              <CardDescription className="text-xs">Truy cập nhanh các nghiệp vụ quản trị</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => onNavigateTab('venues')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 hover:border-primary/40 hover:bg-secondary/50 transition-all text-left text-xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-foreground">Quản Lý Sân Con &amp; Bảo Trì</p>
                    <p className="text-[10px] text-muted-foreground">Thêm sân, bật/tắt bảo trì</p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              <button
                onClick={() => onNavigateTab('pricing')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 hover:border-primary/40 hover:bg-secondary/50 transition-all text-left text-xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                    <BadgePercent className="h-3.5 w-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-foreground">Cấu Hình Bảng Giá Giờ Vàng</p>
                    <p className="text-[10px] text-muted-foreground">Giờ cao điểm &amp; Cuối tuần</p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              <button
                onClick={() => onNavigateTab('services')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 hover:border-primary/40 hover:bg-secondary/50 transition-all text-left text-xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                    <CupSoda className="h-3.5 w-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-foreground">Menu Dịch Vụ &amp; Đồ Uống</p>
                    <p className="text-[10px] text-muted-foreground">Nước giải khát, thuê áo bib</p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              <button
                onClick={() => onNavigateTab('vouchers')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 hover:border-primary/40 hover:bg-secondary/50 transition-all text-left text-xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                    <TicketPercent className="h-3.5 w-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-foreground">Mã Voucher Kích Cầu</p>
                    <p className="text-[10px] text-muted-foreground">Ưu đãi giảm giá giờ vắng</p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            </CardContent>
          </Card>

          {/* Top Performing Courts */}
          <Card className="border-border/80">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Top Sân Con Sinh Lời
                </CardTitle>
                <CardDescription className="text-xs">Hiệu suất từng sân con</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateTab('analytics')}
                className="text-xs font-bold text-primary p-0 h-auto"
              >
                Xem thêm
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {!analytics || analytics.topCourts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Chưa có số liệu sân con.</p>
              ) : (
                analytics.topCourts.slice(0, 3).map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-card border border-border/60">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-5 w-5 rounded-md bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="font-bold truncate text-foreground">{c.courtName}</p>
                        <p className="text-[10px] text-muted-foreground">{SPORT_TYPE_LABELS[c.sportType]}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-foreground">{formatVND(c.revenueVnd)}</p>
                      <p className="text-[10px] text-muted-foreground">{c.bookings} lượt</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
