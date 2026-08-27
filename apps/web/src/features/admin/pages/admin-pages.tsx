import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { BarChart3, ClipboardCheck, Users, Grid } from 'lucide-react';

export function AdminStatsPage(): React.ReactElement {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-amber-500" />
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Tổng Quan Hệ Thống</h1>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-xs sm:text-sm">
          Đang tổng hợp dữ liệu toàn sàn...
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminVenuesPage(): React.ReactElement {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-amber-500" />
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Hàng Chờ Duyệt Sân</h1>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-xs sm:text-sm">
          Đang tải danh sách cụm sân chờ xét duyệt...
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminUsersPage(): React.ReactElement {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-amber-500" />
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Quản Lý Người Dùng</h1>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-xs sm:text-sm">
          Đang tải danh sách tài khoản người dùng...
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminBookingsPage(): React.ReactElement {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2">
        <Grid className="h-5 w-5 text-amber-500" />
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Tra Cứu Đơn Toàn Sàn</h1>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-xs sm:text-sm">
          Đang kết nối hệ thống tra cứu đơn toàn hệ thống...
        </CardContent>
      </Card>
    </div>
  );
}
