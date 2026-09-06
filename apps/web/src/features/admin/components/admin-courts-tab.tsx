import React from 'react';
import { Building2 } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';

export function AdminCourtsTab(): React.ReactElement {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Danh Bạ Sân Con &amp; Bảo Trì Toàn Sàn
          </h1>
          <p className="text-xs text-muted-foreground">
            Quản trị và can thiệp bật/tắt bảo trì khẩn cấp toàn bộ các sân con trên hệ thống.
          </p>
        </div>
      </div>
      <Card className="border-border/80">
        <CardContent className="p-8 text-center text-muted-foreground text-xs sm:text-sm space-y-2">
          <p className="font-semibold text-foreground">Sân con đang hoạt động bình thường</p>
          <p>Quản trị viên vào trực tiếp từng sân trong tab <strong>Hàng Chờ &amp; Duyệt Sân</strong> để xem và bảo trì từng sân con.</p>
        </CardContent>
      </Card>
    </div>
  );
}
