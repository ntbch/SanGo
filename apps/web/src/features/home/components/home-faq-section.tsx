import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';

const FAQS = [
  {
    question: 'Cơ chế giữ chỗ 10 phút hoạt động như thế nào?',
    answer:
      'Khi bạn chọn slot giờ trên ma trận đặt sân, hệ thống sẽ tạm khóa slot này trong 10 phút. Trong thời gian này, không một người chơi nào khác có thể chọn trùng slot của bạn. Bạn chỉ cần hoàn tất thanh toán cọc trong 10:00 phút để xác nhận đơn.',
  },
  {
    question: 'Tôi có thể hủy đặt sân và nhận lại tiền cọc không?',
    answer:
      'Có. Bạn có thể hủy sân và được hoàn 100% tiền cọc về ví SanGo nếu thực hiện hủy trước giờ thi đấu ít nhất 12-24 tiếng (tùy thuộc vào chính sách cụ thể của từng cụm sân được ghi rõ trên vé).',
  },
  {
    question: 'Ví thể thao SanGo nạp tiền bằng hình thức nào?',
    answer:
      'Ví SanGo hỗ trợ nạp tiền qua cổng thanh toán VNPay (QR Pay, thẻ ATM nội địa, thẻ Visa/Mastercard) với tỷ lệ 1:1, tiền vào tài khoản tức thì và không mất phí duy trì.',
  },
  {
    question: 'Quy trình check-in bằng mã QR tại cụm sân ra sao?',
    answer:
      'Sau khi thanh toán thành công, đơn đặt sân sẽ tự động sinh một mã QR bảo mật trong mục "Đơn của tôi". Khi đến sân, bạn chỉ cần đưa mã QR cho nhân viên tại quầy quét là có thể vào sân thi đấu ngay lập tức.',
  },
];

export function HomeFaqSection(): React.ReactElement {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
          <HelpCircle className="h-4 w-4" />
          <span>Hỏi Đáp Nhanh</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
          Câu Hỏi Thường Gặp Của Người Chơi
        </h2>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <Card
              key={idx}
              className="border border-border/80 bg-card overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-secondary/40 transition-colors"
              >
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0',
                    isOpen && 'rotate-180 text-primary',
                  )}
                />
              </button>

              {isOpen && (
                <CardContent className="px-4 pb-4 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/50 animate-in fade-in-50 duration-150">
                  <p className="pt-3">{faq.answer}</p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
