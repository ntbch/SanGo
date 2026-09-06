import React from 'react';
import { Card } from '../../../components/ui/card';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../lib/utils';

export function HomeGuestFaq(): React.ReactElement {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const faqs = [
    {
      q: 'Khách chưa có tài khoản có thể xem thông tin sân không?',
      a: 'Được. Bạn có thể tra cứu hơn 250 cụm sân, xem bảng giá và lịch trống mà không cần đăng nhập. Khi cần giữ chỗ, quá trình đăng nhập chỉ mất khoảng 30 giây.',
    },
    {
      q: 'Cơ chế "Khóa slot 10 phút" hoạt động như thế nào?',
      a: 'Sau khi chọn khung giờ, slot được khóa 10 phút riêng cho bạn để không ai có thể đặt đè, giúp bạn có đủ thời gian xác nhận đội hình và thanh toán cọc.',
    },
    {
      q: 'Tính năng chia tiền quỹ hỗ trợ các đội như thế nào?',
      a: 'Đội trưởng tạo link gom quỹ, hệ thống tự động chia đều số tiền cho từng thành viên và sinh mã VietQR riêng biệt kèm theo dõi trạng thái đóng tiền theo thời gian thực.',
    },
    {
      q: 'Tôi nhận sân thi đấu bằng cách nào khi đến cụm sân?',
      a: 'Mã vé QR được lưu trong mục "Vé của tôi" ngay sau khi đặt cọc thành công. Khi đến sân, bạn chỉ cần xuất trình mã QR cho nhân viên lễ tân quét xác nhận.',
    },
  ];

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="space-y-1 max-w-2xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Câu hỏi thường gặp
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Những thông tin cần biết trước khi đặt sân hoặc tham gia ghép kèo tại SanGo.
        </p>
      </div>

      {/* FAQ Accordion List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <Card
              key={idx}
              className={cn(
                'p-5 rounded-xl border transition-colors duration-150 bg-card cursor-pointer',
                isOpen ? 'border-foreground/30 shadow-xs' : 'border-border hover:border-foreground/20',
              )}
              onClick={() => setOpenIndex(isOpen ? null : idx)}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-bold text-foreground leading-snug">
                  {faq.q}
                </h3>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 mt-0.5',
                    isOpen && 'rotate-180 text-foreground',
                  )}
                />
              </div>

              {isOpen && (
                <p className="text-xs text-muted-foreground leading-relaxed mt-3 pt-3 border-t border-border">
                  {faq.a}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
