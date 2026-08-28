import React from 'react';
import { VenueCard } from './venue-card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Button } from '../../../components/ui/button';
import { Compass, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { VenueItem, VenueFilters } from '../api/venues-api';

interface VenueResultsViewProps {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/80 bg-card p-0 overflow-hidden space-y-3"
          >
            <Skeleton className="aspect-[16/9] w-full rounded-none" />
            <div className="p-4 space-y-2.5">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex gap-1 pt-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="pt-3 border-t border-border/50 flex justify-between items-center">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-20 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-sm font-semibold text-destructive">
          Không thể kết nối đến máy chủ cụm sân
        </p>
        <Button variant="outline" size="sm" onClick={onRefetch} className="cursor-pointer">
          Thử lại
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          <Compass className="h-6 w-6" />
        </div>
        <h2 className="text-base font-bold text-foreground">Không tìm thấy sân phù hợp</h2>
        <p className="text-xs text-muted-foreground">
          Thử tìm kiếm với từ khóa khác hoặc nới lỏng các điều kiện lọc.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFilterChange({ city: 'Hà Nội' })}
          className="gap-1.5 font-semibold text-xs cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Đặt lại bộ lọc</span>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
            className="gap-1 text-xs cursor-pointer"
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
            className="gap-1 text-xs cursor-pointer"
          >
            <span>Trang sau</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
}
