import React from 'react';
import { ClipboardList, Search, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent } from '../../../components/ui/card';
import { formatVND, cn } from '../../../lib/utils';
import * as adminApi from '../api/admin-api';
import { BookingStatus } from '@sango/shared';

const BOOKING_STATUS_BADGES: Record<BookingStatus, { label: string; variant: 'available' | 'peak' | 'holding' | 'destructive' | 'outline' }> = {
  CONFIRMED: { label: 'Đã xác nhận', variant: 'available' },
  CHECKED_IN: { label: 'Đang đá', variant: 'available' },
  COMPLETED: { label: 'Hoàn thành', variant: 'outline' },
  CANCELLED: { label: 'Đã hủy', variant: 'destructive' },
  NO_SHOW: { label: 'Vắng mặt', variant: 'destructive' },
};

export function AdminBookingsTab(): React.ReactElement {
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
              type="button"
              onClick={() => setDatePreset('today')}
              className={cn(
                'px-2 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0',
                date === new Date().toISOString().slice(0, 10) ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground hover:bg-secondary',
              )}
            >
              Hôm nay
            </button>
            <button
              type="button"
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
                  <th className="p-3.5">Cụm Sân &amp; Sân Con</th>
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
                          <div className="text-[10px] text-muted-foreground">{b.customerEmail ?? b.guestPhone ?? 'Chưa có liên hệ'}</div>
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
      <nav aria-label="Phân trang đơn đặt" className="flex items-center justify-end gap-3 text-xs">
        <Button variant="outline" size="sm" disabled={loading || page <= 1} onClick={() => setPage(page - 1)}>Trang trước</Button>
        <span>Trang {page} / {Math.max(1, Math.ceil(total / 20))}</span>
        <Button variant="outline" size="sm" disabled={loading || page * 20 >= total} onClick={() => setPage(page + 1)}>Trang sau</Button>
      </nav>
    </div>
  );
}
