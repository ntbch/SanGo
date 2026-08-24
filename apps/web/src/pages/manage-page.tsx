import { MapPinned } from 'lucide-react';
import type { ReactElement } from 'react';

import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const UPCOMING = [
  'Quản lý cụm sân (Venue): ảnh, địa chỉ + bản đồ, giờ mở cửa',
  'Quản lý sân con (Court) theo loại sân và trạng thái bảo trì',
  'Bảng giá theo slot + quy tắc ghi đè ngày thường / cuối tuần',
];

/** Placeholder trang chủ sân — nội dung thật ở task T9. */
export function ManagePage(): ReactElement {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý sân</h1>
        <p className="text-sm text-muted-foreground">Dành riêng cho vai trò Chủ sân.</p>
      </header>
      <Card>
        <CardHeader>
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MapPinned className="size-5" aria-hidden />
          </span>
          <CardTitle className="mt-2">Sắp ra mắt ở giai đoạn tiếp theo</CardTitle>
          <CardDescription>
            Route này đã được bảo vệ bởi role guard OWNER — chỉ chủ sân nhìn thấy menu này.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {UPCOMING.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Badge variant="success" className="mt-4">
            Task T9 · Dashboard chủ sân
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
