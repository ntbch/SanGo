import React from 'react';
import { Card } from '../../../components/ui/card';
import { Search, Lock, QrCode, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';

export function HomeHowItWorks(): React.ReactElement {
  const steps = [
    {
      number: '01',
      icon: Search,
      title: 'Tìm Sân & Xem Lịch Trực Tuyến',
      desc: 'Khám phá 250+ cụm sân Bóng đá, Pickleball, Cầu lông, Tennis gần bạn. Lọc theo mặt sân, tiện ích, vị trí và xem chính xác khung giờ vàng còn trống.',
      tag: 'Thời gian thực',
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/20',
    },
    {
      number: '02',
      icon: Lock,
      title: 'Khóa Chỗ 10 Phút & Chia Tiền Quỹ',
      desc: 'Hệ thống tự động bảo lưu độc quyền slot bạn chọn trong 10 phút. Tự động chia đều tiền cọc cho các thành viên trong đội và thanh toán tiện lợi qua VietQR.',
      tag: 'Bảo vệ slot 100%',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      number: '03',
      icon: QrCode,
      title: 'Vé QR Check-in 1 Giây Ra Sân',
      desc: 'Nhận vé điện tử thông minh ngay sau khi hoàn tất. Quét mã QR tại quầy lễ tân cụm sân để nhận bóng và vào sân thi đấu mà không cần chờ đợi.',
      tag: 'Check-in tốc độ',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
  ];

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Trải nghiệm người dùng thông minh</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Quy Trình Đặt Sân &amp; Tham Gia Trong 3 Bước
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Dù bạn là người chơi cá nhân hay đội trưởng gom kèo, SanGo tối ưu hóa mọi thao tác từ lúc tìm kiếm đến khi bóng lăn.
          </p>
        </div>

        <Link to="/venues" className="shrink-0">
          <Button variant="outline" className="text-xs font-bold gap-1.5">
            <span>Khám phá sân ngay</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {steps.map((step, idx) => (
          <Card
            key={idx}
            className="p-6 rounded-3xl border border-border/80 bg-card hover:border-primary/50 transition-all duration-300 flex flex-col justify-between space-y-6 relative overflow-hidden group shadow-xs"
          >
            {/* Top Row: Number & Icon */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono-num text-3xl font-black text-muted-foreground/30 group-hover:text-primary/40 transition-colors">
                  {step.number}
                </span>
                <div className={`h-12 w-12 rounded-2xl ${step.bg} ${step.color} border ${step.border} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <step.icon className="h-6 w-6" />
                </div>
              </div>

              <div>
                <span className={`px-2 py-0.5 rounded-md ${step.bg} ${step.color} text-[10px] font-mono-num font-bold uppercase tracking-wider`}>
                  {step.tag}
                </span>
                <h3 className="text-base font-bold text-foreground mt-2 group-hover:text-primary transition-colors">
                  {step.title}
                </h3>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </div>

            {/* Bottom Highlight */}
            <div className="pt-3 border-t border-border/50 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Tiện lợi, minh bạch và chính xác 100%</span>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
