import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Building2, ArrowRight, CheckCircle2 } from 'lucide-react';

export function HomePartnerCta(): React.ReactElement {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 sm:p-10 lg:p-12 shadow-xs">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            <Building2 className="h-3.5 w-3.5" />
            <span>Dành Riêng Cho Ban Quản Lý Cụm Sân</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            Số Hóa Quản Lý Sân &amp; Tối Đa Doanh Thu Với SanGo OS
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Đồng bộ bảng lịch ma trận theo thời gian thực, tự động thu cọc qua mã VietQR, xuất vé QR check-in tại quầy và tiếp cận hơn 50.000 người chơi thể thao thường xuyên.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">Không còn ghi sổ thủ công, triệt tiêu trùng lịch</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="font-semibold text-foreground">Nhận thanh toán cọc trực tiếp về tài khoản chủ sân</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
          <Link to="/partner">
            <Button size="lg" className="w-full sm:w-auto gap-2 font-bold shadow-lg shadow-emerald-500/20 active:scale-[0.98]">
              <span>Đăng ký đối tác chủ sân</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/about">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-xs font-bold active:scale-[0.98]">
              Tìm hiểu giải pháp
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
