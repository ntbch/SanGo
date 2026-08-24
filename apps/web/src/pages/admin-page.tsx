import { ShieldCheck } from 'lucide-react';
import type { ReactElement } from 'react';

import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const UPCOMING = [
  'Duyệt / từ chối sân mới (Venue status: PENDING → APPROVED | REJECTED)',
  'Quản lý người dùng: khoá / mở khoá tài khoản',
];

/** Placeholder trang quản trị — nội dung thật đi kèm backend admin module. */
export function AdminPage(): ReactElement {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Quản trị hệ thống</h1>
        <p className="text-sm text-muted-foreground">Dành riêng cho vai trò Admin.</p>
      </header>
      <Card>
        <CardHeader>
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <CardTitle className="mt-2">Sắp ra mắt</CardTitle>
          <CardDescription>Route này đã được bảo vệ bởi role guard ADMIN.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {UPCOMING.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Badge variant="warning" className="mt-4">
            Đi kèm backend · admin module
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
