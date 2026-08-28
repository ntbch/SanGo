import React from 'react';
import { Card } from '../../../components/ui/card';
import { HelpCircle, ChevronDown, ShieldCheck, Zap, Users, QrCode } from 'lucide-react';
import { cn } from '../../../lib/utils';

export function HomeGuestFaq(): React.ReactElement {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const faqs = [
    {
      q: 'Khách chưa có tài khoản (Guest) có thể tìm kiếm và xem lịch sân được không?',
      a: 'Hoàn toàn được. Bạn có thể tra cứu toàn bộ danh sách 250+ cụm sân, xem hình ảnh thực tế, bảng giá, tiện ích, vị trí trên bản đồ và các khung giờ trống mà không cần đăng nhập. Khi tiến hành giữ chỗ và thanh toán, bạn chỉ cần 30 giây để đăng nhập nhanh qua Google hoặc số điện thoại.',
      icon: Users,
    },
    {
      q: 'Cơ chế "Khóa slot 10 phút" hoạt động như thế nào?',
      a: 'Khi bạn chọn một khung giờ sân, SanGo sẽ kích hoạt cơ chế độc quyền bảo lưu slot đó trong 10 phút. Trong khoảng thời gian này, không một ai khác có thể đặt đè lên slot của bạn, giúp bạn có đủ thời gian để xác nhận với đồng đội và chuyển khoản cọc an toàn.',
      icon: ShieldCheck,
    },
    {
      q: 'Tính năng "Chia tiền quỹ trận đấu" hỗ trợ các đội như thế nào?',
      a: 'Sau khi đặt sân thành công, đội trưởng có thể tạo link gom quỹ trận đấu. Hệ thống tự động tính toán số tiền mỗi thành viên cần đóng dựa trên tổng tiền sân + tiền nước/bóng, tạo mã VietQR động theo từng người và cập nhật trạng thái đóng quỹ trực tiếp theo thời gian thực.',
      icon: Zap,
    },
    {
      q: 'Tôi nhận sân thi đấu bằng cách nào khi đến cụm sân?',
      a: 'Sau khi thanh toán cọc thành công, một vé điện tử chứa mã QR sẽ được gửi về tài khoản và mục "Vé của tôi". Khi đến sân, bạn chỉ cần đưa mã QR này cho lễ tân tại quầy để quét xác thực trong 1 giây mà không cần gọi điện hay đọc tên.',
      icon: QrCode,
    },
  ];

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="space-y-1.5 max-w-2xl">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Giải đáp thắc mắc</span>
        </div>
        <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Câu Hỏi Thường Gặp Của Người Chơi
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Tất cả những điều bạn cần biết trước khi đặt sân hoặc tham gia ghép kèo tại SanGo.
        </p>
      </div>

      {/* FAQ Accordion List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          const Icon = faq.icon;
          return (
            <Card
              key={idx}
              className={cn(
                'p-5 rounded-2xl border transition-all duration-200 bg-card cursor-pointer',
                isOpen ? 'border-primary/50 shadow-sm' : 'border-border/80 hover:border-border',
              )}
              onClick={() => setOpenIndex(isOpen ? null : idx)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground leading-snug">
                    {faq.q}
                  </h3>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 mt-1',
                    isOpen && 'rotate-180 text-primary',
                  )}
                />
              </div>

              {isOpen && (
                <p className="text-xs text-muted-foreground leading-relaxed mt-3 pt-3 border-t border-border/50 pl-11">
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
