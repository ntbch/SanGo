import React from 'react';
import { Card } from '../../../components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HomeHowItWorks(): React.ReactElement {
  const steps = [
    {
      number: '01',
      title: 'Tìm sân và xem lịch trống',
      desc: 'Tra cứu hơn 250 cụm sân thể thao gần bạn, lọc theo môn thi đấu, tiện ích và khung giờ trống thời gian thực.',
      tag: 'Thời gian thực',
    },
    {
      number: '02',
      title: 'Khóa chỗ 10 phút và thanh toán',
      desc: 'Slot thi đấu được khóa an toàn 10 phút để bạn xác nhận với đội. Hỗ trợ chia tiền quỹ tự động qua VietQR.',
      tag: 'Bảo vệ slot 100%',
    },
    {
      number: '03',
      title: 'Quét mã QR nhận sân',
      desc: 'Mã QR vé được gửi ngay sau khi hoàn tất đặt cọc. Quét mã tại quầy lễ tân để nhận sân thi đấu.',
      tag: 'Check-in tức thì',
    },
  ];

  return (
    <section className="space-y-6">
      {/* Header without badge clutter */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Quy trình đặt sân trong 3 bước
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Quy trình trực tuyến đơn giản giúp bạn tìm sân, chốt giờ và ra sân nhanh chóng.
          </p>
        </div>

        <Link to="/venues" className="shrink-0">
          <Button variant="outline" className="text-xs font-semibold gap-1.5">
            <span>Xem danh sách sân</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {steps.map((step, idx) => (
          <Card
            key={idx}
            className="p-6 rounded-2xl border border-border bg-card flex flex-col justify-between space-y-5 shadow-xs"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono-num text-2xl font-black text-foreground/40">
                  {step.number}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground text-[10px] font-mono-num font-bold uppercase tracking-wider border border-border">
                  {step.tag}
                </span>
              </div>

              <h3 className="text-base font-bold text-foreground">
                {step.title}
              </h3>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </div>

            <div className="pt-3 border-t border-border/60 text-[11px] text-muted-foreground font-medium">
              Minh bạch và chính xác theo thời gian thực
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
