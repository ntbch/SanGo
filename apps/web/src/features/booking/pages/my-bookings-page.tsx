import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyBookingsApi, cancelBookingApi } from '../api/booking-api';
import { TicketCard } from '../components/ticket-card';
import { Button } from '../../../components/ui/button';
import {
  EmptyState,
  ErrorState,
  TicketPassSkeleton,
} from '../../../components/feedback';
import { Calendar } from 'lucide-react';
import { cn } from '../../../lib/utils';

export function MyBookingsPage(): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-bookings', activeTab],
    queryFn: () =>
      getMyBookingsApi({
        status:
          activeTab === 'UPCOMING'
            ? 'CONFIRMED'
            : activeTab === 'COMPLETED'
            ? 'COMPLETED'
            : 'CANCELLED',
      }),
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
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý mã QR check-in tại quầy và lịch thi đấu của bạn.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/venues')}
          className="font-bold gap-1.5 shadow-xs self-start sm:self-auto active:scale-[0.98] transition-transform"
        >
          <Calendar className="h-4 w-4" />
          <span>Đặt Sân Mới</span>
        </Button>
      </div>

      {/* Tabs Filter: Clean flat buttons using semantic tokens */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        {(
          [
            { id: 'UPCOMING', label: 'Sắp tới & Chờ check-in' },
            { id: 'COMPLETED', label: 'Đã hoàn thành' },
            { id: 'CANCELLED', label: 'Đã hủy' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-colors active:scale-[0.98] cursor-pointer',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List / Skeletons / States */}
      {isLoading ? (
        <div className="space-y-4">
          <TicketPassSkeleton />
          <TicketPassSkeleton />
          <TicketPassSkeleton />
        </div>
      ) : isError ? (
        <ErrorState
          title="Không thể tải danh sách vé"
          message="Đã có lỗi xảy ra khi tải lịch đặt sân của bạn. Vui lòng thử lại."
          onRetry={() => refetch()}
        />
      ) : !data?.items || data.items.length === 0 ? (
        <EmptyState
          title="Chưa có lượt đặt sân nào"
          description="Bạn chưa có lịch thi đấu nào trong mục này. Hãy tìm kiếm sân thể thao gần bạn và giữ chỗ ngay."
          actionLabel="Tìm Sân & Đặt Ngay"
          onAction={() => navigate('/venues')}
        />
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
