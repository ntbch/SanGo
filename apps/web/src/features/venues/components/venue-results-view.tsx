import React from 'react';
import { VenueCard } from './venue-card';
import { EmptyState, ErrorState, VenueCardSkeleton } from '../../../components/feedback';
import { Button } from '../../../components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VenueItem, VenueFilters } from '../api/venues-api';

export interface VenueResultsViewProps {
  items?: VenueItem[];
  isLoading: boolean;
  isError: boolean;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onFilterChange: (newFilters: VenueFilters) => void;
  onRefetch: () => void;
}

export function VenueResultsView({
  items = [],
  isLoading,
  isError,
  page,
  totalPages,
  onPageChange,
  onFilterChange,
  onRefetch,
}: VenueResultsViewProps): React.ReactElement {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <VenueCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Không thể kết nối đến máy chủ cụm sân"
        message="Đã có sự cố khi tải danh sách sân thể thao. Vui lòng kiểm tra lại kết nối mạng."
        onRetry={onRefetch}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Không tìm thấy sân phù hợp"
        description="Thử tìm kiếm với từ khóa khác hoặc nới lỏng các điều kiện lọc."
        actionLabel="Đặt lại bộ lọc"
        onAction={() => onFilterChange({ city: 'Hà Nội' })}
      />
    );
  }

  return (
    <>
      {/* High-density horizontal row cards in vertical stack */}
      <div className="flex flex-col gap-4">
        {items.map((venue) => (
          <VenueCard key={venue.id} venue={venue} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pt-6 border-t border-border/60 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="gap-1 text-xs cursor-pointer active:scale-[0.98]"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Trang trước</span>
          </Button>

          <span className="text-xs font-semibold text-muted-foreground font-mono-num">
            Trang {page} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="gap-1 text-xs cursor-pointer active:scale-[0.98]"
          >
            <span>Trang sau</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
}
