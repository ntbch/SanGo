import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Building2, TrendingUp, CalendarCheck, ArrowRight } from 'lucide-react';

export function HomePartnerCta(): React.ReactElement {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-primary/10 p-6 sm:p-10 shadow-xs">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            <Building2 className="h-3.5 w-3.5" />
            <span>Dành riêng cho Chủ Cụm Sân Thể Thao</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Số Hóa Quản Lý Sân & Tối Đa Doanh Thu Với SanGo OS
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Tự động đồng bộ lịch sân, quản lý đơn đặt cọc, tiếp cận hơn 50.000+ người chơi tại khu vực của bạn và loại bỏ 100% tình trạng trùng lịch.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">Tăng 35% tỷ lệ lấp đầy sân</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-emerald-500" />
              <span className="font-semibold text-foreground">Nhận cọc online tự động</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <Link to="/partner">
            <Button size="lg" className="w-full sm:w-auto gap-2 font-bold shadow-lg shadow-emerald-500/25">
              <span>Đăng ký hợp tác chủ sân</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/about">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-xs font-semibold">
              Tìm hiểu thêm
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
