import React from 'react';
import { TicketPercent } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';

export function AdminVouchersTab(): React.ReactElement {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            <TicketPercent className="h-6 w-6 text-primary" /> Kho Voucher &amp; Mã Khuyến Mãi Sàn
          </h1>
          <p className="text-xs text-muted-foreground">
            Quản trị các chiến dịch ưu đãi giờ thấp điểm và voucher giảm giá kích cầu toàn hệ thống.
          </p>
        </div>
      </div>
      <Card className="border-border/80">
        <CardContent className="p-8 text-center text-muted-foreground text-xs sm:text-sm space-y-2">
          <p className="font-semibold text-foreground">Trung Tâm Quản Lý Mã Giảm Giá Chiến Dịch</p>
          <p>Các mã voucher kích cầu toàn sàn đang được áp dụng tự động cho các khung giờ thấp điểm từ 08:00 đến 15:00 hàng ngày.</p>
        </CardContent>
      </Card>
    </div>
  );
}
