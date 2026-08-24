import { BookingStatus } from '@courthub/shared';
import type { ReactElement } from 'react';

import { Badge, type BadgeProps } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { useAuthStore } from '../lib/auth/auth-store';

const STATUS_META: Record<BookingStatus, { label: string; variant: BadgeProps['variant'] }> = {
  [BookingStatus.CONFIRMED]: { label: 'Đã xác nhận', variant: 'default' },
  [BookingStatus.CHECKED_IN]: { label: 'Đang chơi', variant: 'success' },
  [BookingStatus.COMPLETED]: { label: 'Hoàn thành', variant: 'outline' },
  [BookingStatus.CANCELLED]: { label: 'Đã huỷ', variant: 'destructive' },
  [BookingStatus.NO_SHOW]: { label: 'No-show', variant: 'warning' },
};

interface DemoBooking {
  code: string;
  court: string;
  customer: string;
  when: string;
  status: BookingStatus;
}

// Dữ liệu mẫu để minh hoạ bố cục — nối API thật ở task T9–T11.
const DEMO_BOOKINGS: DemoBooking[] = [
  {
    code: 'CH-20260824-0001',
    court: 'Sân 5 người · A1',
    customer: 'Lê Hoàng',
    when: 'Hôm nay 18:00–19:00',
    status: BookingStatus.CONFIRMED,
  },
  {
    code: 'CH-20260824-0002',
    court: 'Pickleball · P2',
    customer: 'Trang Nguyễn',
    when: 'Hôm nay 19:30–21:00',
    status: BookingStatus.CHECKED_IN,
  },
  {
    code: 'CH-20260823-0014',
    court: 'Cầu lông · B3',
    customer: 'Duy Phạm',
    when: 'Hôm qua 06:00–07:30',
    status: BookingStatus.COMPLETED,
  },
  {
    code: 'CH-20260822-0007',
    court: 'Sân 7 người · C1',
    customer: 'Khoa Trần',
    when: 'T.6 20:00–22:00',
    status: BookingStatus.CANCELLED,
  },
];

const STATS = [
  { label: 'Đơn hôm nay', value: '12' },
  { label: 'Doanh thu tuần', value: '45,2tr ₫' },
  { label: 'Tỷ lệ check-in', value: '92%' },
  { label: 'Đánh giá trung bình', value: '4,6 ★' },
];

export function DashboardPage(): ReactElement {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">Xin chào {user?.fullName ?? 'bạn'}!</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Số liệu mẫu — sẽ nối API ở giai đoạn sau
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Đơn đặt gần đây</CardTitle>
          <CardDescription>
            Bảng minh hoạ component Table/Badge của bộ UI dùng chung.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead>Sân</TableHead>
                <TableHead>Khách</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_BOOKINGS.map((booking) => (
                <TableRow key={booking.code}>
                  <TableCell className="font-mono text-xs">{booking.code}</TableCell>
                  <TableCell>{booking.court}</TableCell>
                  <TableCell>{booking.customer}</TableCell>
                  <TableCell className="whitespace-nowrap">{booking.when}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_META[booking.status].variant}>
                      {STATUS_META[booking.status].label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
