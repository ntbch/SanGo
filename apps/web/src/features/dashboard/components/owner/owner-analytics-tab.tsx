import React from 'react';
import {
  type OwnerAnalyticsResponse,
} from '../../api/owner-api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { formatVND } from '../../../../lib/utils';
import {
  RevenueTrendAreaChart,
  CourtPerformanceDoughnut,
} from '../dashboard-charts';
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Building2,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';


interface OwnerAnalyticsTabProps {
  analytics: OwnerAnalyticsResponse | null;
  loadingAnalytics: boolean;
  analyticsDays: number;
  setAnalyticsDays: (days: number) => void;
}

export function OwnerAnalyticsTab({
  analytics,
  loadingAnalytics,
  analyticsDays,
  setAnalyticsDays,
}: OwnerAnalyticsTabProps): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Báo Cáo Hiệu Suất &amp; Doanh Thu
          </h2>
          <p className="text-xs text-muted-foreground">
            Tổng hợp doanh thu thực tế, lượt đặt và tỷ lệ lấp đầy sân theo chuỗi thời gian.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[7, 14, 30].map((days) => (
            <Button
              key={days}
              size="sm"
              variant={analyticsDays === days ? 'default' : 'outline'}
              onClick={() => setAnalyticsDays(days)}
              className="text-xs font-bold rounded-xl"
            >
              {days} ngày qua
            </Button>
          ))}
        </div>
      </div>

      {loadingAnalytics ? (
        <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span>Đang tính toán số liệu báo cáo...</span>
        </div>
      ) : !analytics ? (
        <div className="py-16 text-center text-xs text-muted-foreground">
          Không có dữ liệu báo cáo.
        </div>
      ) : (
        <>
          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/80 shadow-xs">
              <CardContent className="p-5 space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Doanh Thu Xác Nhận</span>
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-extrabold text-foreground tracking-tight">
                  {formatVND(analytics.revenueConfirmed)}
                </div>
                <p className="text-[11px] text-muted-foreground">Từ các đơn Confirmed &amp; Checked-in</p>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-xs">
              <CardContent className="p-5 space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Tổng Lượt Đặt Sân</span>
                  <Calendar className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl font-extrabold text-foreground tracking-tight">
                  {analytics.totalBookings} đơn
                </div>
                <p className="text-[11px] text-muted-foreground">Trong {analytics.periodDays} ngày qua</p>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-xs">
              <CardContent className="p-5 space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Tỷ Lệ Lấp Đầy Sân</span>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-extrabold text-foreground tracking-tight">
                  Chưa có dữ liệu
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Chưa có thống kê công suất theo giờ mở cửa
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-xs">
              <CardContent className="p-5 space-y-1.5">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Tỷ Lệ Hủy / No-Show</span>
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                </div>
                <div className="text-2xl font-extrabold text-foreground tracking-tight">
                  {(analytics.cancelRate * 100).toFixed(1)}%
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {analytics.cancelledCount} đơn hủy, {analytics.noShowCount} no-show
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Row 1: Area Chart (Revenue & Bookings) + Doughnut (Court Revenue Breakdown) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-8 border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Xu Hướng Doanh Thu &amp; Lượt Đặt ({analytics.periodDays} Ngày Qua)
                </CardTitle>
                <CardDescription className="text-xs">
                  Dữ liệu chuỗi thời gian liên tục với đường cong mượt mà và số lượt đặt thực tế.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80 pt-2">
                <RevenueTrendAreaChart
                  series={analytics.series}
                  isDark={document.documentElement.classList.contains('dark')}
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-4 border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> Cơ Cấu Doanh Thu Sân Con
                </CardTitle>
                <CardDescription className="text-xs">
                  Tỷ trọng đóng góp dòng tiền của từng sân con trong cụm sân.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80 pt-2 flex items-center justify-center">
                <CourtPerformanceDoughnut
                  topCourts={analytics.topCourts}
                  isDark={document.documentElement.classList.contains('dark')}
                />
              </CardContent>
            </Card>
          </div>

          {/* Top Courts Performance List */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="lg:col-span-5 border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Bảng Xếp Hạng Sân Con Sinh Lời
                </CardTitle>
                <CardDescription className="text-xs">Sân có doanh thu cao nhất.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.topCourts.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">Chưa có dữ liệu sân con.</p>
                ) : (
                  analytics.topCourts.map((c, idx) => (
                    <div key={c.courtId} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary font-extrabold text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="truncate">
                          <p className="font-bold truncate text-foreground">{c.courtName}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-foreground">{formatVND(c.revenueVnd)}</p>
                        <p className="text-[10px] text-muted-foreground">{c.bookings} đơn đặt</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
