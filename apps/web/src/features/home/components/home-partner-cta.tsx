import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HomePartnerCta(): React.ReactElement {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-10 lg:p-12 shadow-xs">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="space-y-3.5 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
            Số hóa quản lý sân &amp; tối đa doanh thu với SanGo OS
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Đồng bộ bảng lịch ma trận theo thời gian thực, tự động thu tiền cọc qua mã VietQR, quét vé QR check-in tại quầy và tiếp cận người chơi thể thao thường xuyên.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">
              Quản lý lịch trực tuyến, tránh trùng ca
            </div>
            <div className="font-medium text-foreground">
              Nhận cọc trực tiếp về tài khoản ngân hàng
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
          <Link to="/partner">
            <Button size="lg" className="w-full sm:w-auto gap-2 font-bold shadow-xs active:scale-[0.98]">
              <span>Đăng ký đối tác chủ sân</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/about">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-xs font-semibold active:scale-[0.98]">
              Giới thiệu SanGo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
