import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HomeMapBanner(): React.ReactElement {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-xs">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Tìm sân gần nhất bằng bản đồ tương tác
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Xem vị trí thực tế của toàn bộ cụm sân thể thao tại Hà Nội và TP. Hồ Chí Minh. Hỗ trợ định vị GPS và xem mức giá trực tiếp trên bản đồ.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              Định vị bán kính <span className="font-mono-num">3–20km</span>
            </span>
            <span className="font-medium text-foreground">
              Hiển thị giá sàn trên từng điểm ghim
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <Link to="/map">
            <Button size="lg" className="gap-2 font-bold shadow-xs">
              <span>Mở bản đồ sân</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
