import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';

export function ProfileBookingsTab(): React.ReactElement {
  return (
    <Card className="p-6 border border-border/80 bg-card shadow-md space-y-5 animate-in fade-in-50 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div>
          <h3 className="text-base font-black text-foreground">Vé Đặt Sân Của Tôi</h3>
          <p className="text-xs text-muted-foreground">Quản lý giữ chỗ &amp; vé vào sân.</p>
        </div>
        <Link to="/bookings">
          <Button size="sm" className="text-xs font-bold gap-1.5 cursor-pointer">
            <span>Xem Tất Cả Vé</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <div className="py-8 text-center space-y-3">
        <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Calendar className="h-6 w-6" />
        </div>
        <p className="text-xs font-bold text-foreground">Truy cập trung tâm vé đặt sân</p>
        <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
          Quản lý mã QR check-in, hủy sân hoàn cọc và theo dõi lịch thi đấu sắp tới.
        </p>
        <Link to="/bookings" className="inline-block pt-2">
          <Button variant="outline" size="sm" className="text-xs font-bold cursor-pointer">
            Mở Trang Quản Lý Vé
          </Button>
        </Link>
      </div>
    </Card>
  );
}
