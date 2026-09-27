import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyBookingsApi, cancelBookingApi } from '../api/booking-api';
import { TicketCard } from '../components/ticket-card';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { Ticket, Calendar } from 'lucide-react';
import { cn } from '../../../lib/utils';

export function MyBookingsPage(): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');

  const activeFilter = activeTab === 'UPCOMING' ? 'upcoming' : activeTab === 'COMPLETED' ? 'history' : 'cancelled';
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-bookings', activeFilter],
    queryFn: () => getMyBookingsApi({ filter: activeFilter }),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelBookingApi(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      refetch();
    },
  });

  const handleCancelBooking = async (bookingId: string, reason = 'Khách yêu cầu hủy đơn') => {
    if (window.confirm('Hủy đơn này? Cọc sẽ hoàn theo chính sách sân.')) {
      await cancelMutation.mutateAsync({ id: bookingId, reason });
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-10 space-y-6 max-w-4xl mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-foreground">
            Vé Đặt Sân Của Tôi
          </h1>
          <p className="text-xs text-muted-foreground">
            Quản lý mã QR check-in tại quầy và lịch thi đấu của bạn.
          </p>
        </div>
        <Link to="/venues">
          <Button size="sm" className="font-bold gap-1.5 shadow-xs self-start sm:self-auto">
            <Calendar className="h-4 w-4" />
            <span>Đặt Sân Mới</span>
          </Button>
        </Link>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        {(
          [
            { id: 'UPCOMING', label: 'Sắp tới' },
            { id: 'COMPLETED', label: 'Lịch sử' },
            { id: 'CANCELLED', label: 'Đã hủy & Không đến' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-3xl" />
          <Skeleton className="h-44 w-full rounded-3xl" />
        </div>
      ) : isError ? (
        <div className="py-16 text-center space-y-3">
          <p className="text-xs font-semibold text-destructive">Không thể tải danh sách vé.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      ) : !data?.items || data.items.length === 0 ? (
        <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-secondary text-muted-foreground">
            <Ticket className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Không có vé đặt sân nào</h3>
          <p className="text-xs text-muted-foreground">
            Bạn chưa có lượt đặt sân nào ở trạng thái này.
          </p>
          <Link to="/venues">
            <Button size="sm" className="font-bold">
              Tìm Sân &amp; Đặt Ngay
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data.items.map((booking) => (
            <TicketCard
              key={booking.id}
              ticket={booking}
              onCancel={activeTab === 'UPCOMING' ? handleCancelBooking : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
