import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { MapPin, CalendarDays, CircleDollarSign, Coffee, BarChart3, PlusCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export function OwnerVenuesPage(): React.ReactElement {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <span>Cụm Sân Của Tôi</span>
        </h1>
        <Button size="sm" className="gap-1.5 font-bold text-xs">
          <PlusCircle className="h-4 w-4" />
          <span>Đăng ký cụm sân</span>
        </Button>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-xs sm:text-sm">
          Đang tải danh sách cụm sân của bạn...
        </CardContent>
      </Card>
    </div>
  );
}

export function OwnerBookingsPage(): React.ReactElement {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <span>Lịch Vận Hành & Check-in</span>
        </h1>
        <Button size="sm" variant="outline" className="gap-1.5 font-semibold text-xs">
          <span>Tạo đơn tại quầy</span>
        </Button>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-xs sm:text-sm">
          Đang tải ma trận lịch vận hành...
        </CardContent>
      </Card>
    </div>
  );
}

export function OwnerPricingPage(): React.ReactElement {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2">
        <CircleDollarSign className="h-5 w-5 text-primary" />
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Cấu Hình Bảng Giá</h1>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-xs sm:text-sm">
          Đang tải ma trận bảng giá của từng sân con...
        </CardContent>
      </Card>
    </div>
  );
}

export function OwnerServicesPage(): React.ReactElement {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Coffee className="h-5 w-5 text-primary" />
          <span>Dịch Vụ Tiện Ích</span>
        </h1>
        <Button size="sm" className="gap-1.5 font-bold text-xs">
          <PlusCircle className="h-4 w-4" />
          <span>Thêm dịch vụ</span>
        </Button>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-xs sm:text-sm">
          Đang tải danh mục dịch vụ bổ sung...
        </CardContent>
      </Card>
    </div>
  );
}

export function OwnerAnalyticsPage(): React.ReactElement {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Báo Cáo Doanh Thu</h1>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-xs sm:text-sm">
          Đang tổng hợp dữ liệu doanh thu và tỷ lệ lấp đầy sân...
        </CardContent>
      </Card>
    </div>
  );
}
