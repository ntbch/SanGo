import { BarChart3 } from 'lucide-react';
import { type ReactElement } from 'react';

import { Card, CardContent } from '../../../components/ui/card';

/** Thống kê doanh thu/lượt đặt — placeholder Giai đoạn 2 (đặc tả §3.10). */
export function StatisticsPage(): ReactElement {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Thống kê</h1>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <BarChart3 className="size-10 text-muted-foreground/40" aria-hidden />
          <p className="font-medium">Biểu đồ doanh thu & lượt đặt sẽ ra mắt ở Giai đoạn 2</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Bao gồm doanh thu theo ngày/tuần/tháng, xếp hạng sân con chạy nhất và tỷ lệ hủy/no-show.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
