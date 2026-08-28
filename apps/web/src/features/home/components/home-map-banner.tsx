import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { MapPin, Navigation, Crosshair, ArrowRight } from 'lucide-react';

export function HomeMapBanner(): React.ReactElement {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xs">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            <Navigation className="h-3.5 w-3.5" />
            <span>Bản đồ thể thao thời gian thực</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Tìm Sân Gần Nhất Bằng Bản Đồ Tương Tác
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Xem vị trí thực tế của toàn bộ cụm sân thể thao tại Hà Nội & TP.HCM. Tự động đo khoảng cách GPS từ vị trí của bạn và so sánh mức giá theo từng khu vực.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Crosshair className="h-3.5 w-3.5 text-primary" />
              <span>Định vị bán kính 3km - 20km</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <MapPin className="h-3.5 w-3.5 text-amber-400" />
              <span>Hiển thị giá sàn trên từng điểm ghim</span>
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <Link to="/map">
            <Button size="lg" className="gap-2 font-bold shadow-lg shadow-emerald-500/25">
              <span>Mở bản đồ không gian</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
