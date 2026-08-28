import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface NotificationEmptyStateProps {
  isFiltered: boolean;
  onResetFilters: () => void;
}

export function NotificationEmptyState({
  isFiltered,
  onResetFilters,
}: NotificationEmptyStateProps): React.ReactElement {
  return (
    <div className="p-16 text-center space-y-3">
      <div className="h-12 w-12 rounded-3xl bg-secondary/80 flex items-center justify-center mx-auto text-muted-foreground">
        <Bell className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-bold text-foreground">Không tìm thấy thông báo nào</h3>
      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
        Không có thông báo phù hợp với bộ lọc hiện tại. Thử đặt lại bộ lọc để xem toàn bộ thông báo.
      </p>
      {isFiltered && (
        <Button size="sm" variant="outline" onClick={onResetFilters} className="text-xs font-bold cursor-pointer">
          Đặt Lại Bộ Lọc
        </Button>
      )}
    </div>
  );
}
