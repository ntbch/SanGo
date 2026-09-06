import React from 'react';
import { BadgePercent } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';

export function AdminPricingTab(): React.ReactElement {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            <BadgePercent className="h-6 w-6 text-primary" /> Bảng Giá Giờ Vàng &amp; Menu Dịch Vụ
          </h1>
          <p className="text-xs text-muted-foreground">
            Giám sát ma trận biểu phí giờ cao điểm và menu nước uống, dụng cụ của các cụm sân đối tác.
          </p>
        </div>
      </div>
      <Card className="border-border/80">
        <CardContent className="p-8 text-center text-muted-foreground text-xs sm:text-sm space-y-2">
          <p className="font-semibold text-foreground">Giám Sát Chính Sách Giá Sàn</p>
          <p>Sân đối tác niêm yết giá và menu công khai trên sàn.</p>
        </CardContent>
      </Card>
    </div>
  );
}
