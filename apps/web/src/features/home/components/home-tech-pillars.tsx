import React from 'react';
import { Card } from '../../../components/ui/card';

export function HomeTechPillars(): React.ReactElement {
  const pillars = [
    {
      number: '01',
      tag: '100% Chống trùng',
      title: 'Khóa slot 10 phút',
      desc: 'Cơ chế Distributed Lock tự động bảo lưu khung giờ riêng biệt cho người đặt trong 10 phút, loại bỏ tình trạng hai người cùng đặt một sân.',
      note: 'Tự động giải phóng khi hết thời gian giữ chỗ',
    },
    {
      number: '02',
      tag: 'Tự động hóa',
      title: 'Chia tiền quỹ trận đấu',
      desc: 'Tự động tính toán phần đóng góp theo số lượng thành viên, tạo mã VietQR riêng cho từng người để thu tiền nhanh chóng.',
      note: 'Hỗ trợ VietQR và thanh toán tức thì',
    },
    {
      number: '03',
      tag: 'Nhận sân nhanh',
      title: 'Vé điện tử mã QR',
      desc: 'Mã QR vé được tạo tự động ngay sau khi xác nhận đặt chỗ. Lễ tân quét mã để đối soát ca đấu và bàn giao sân trong 1 giây.',
      note: 'Đối soát chính xác tại quầy lễ tân',
    },
    {
      number: '04',
      tag: 'Minh bạch',
      title: 'Điểm tín nhiệm và đánh giá',
      desc: 'Ghi nhận lịch sử thi đấu và độ đúng giờ của người chơi, giúp các đội an tâm ghép kèo và giảm thiểu việc hủy trận phút chót.',
      note: 'Xây dựng môi trường thể thao văn minh',
    },
  ];

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Công nghệ vận hành thể thao SanGo
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Các tính năng cốt lõi giúp xử lý đồng bộ lịch trống, thanh toán cọc và check-in tại sân.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono-num text-muted-foreground px-3 py-1.5 rounded-lg bg-card border border-border">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Vận hành tự động 24/7</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pillars.map((p, idx) => (
          <Card
            key={idx}
            className="p-6 rounded-2xl border border-border bg-card flex flex-col justify-between space-y-5 shadow-xs"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono-num text-2xl font-black text-foreground/40">
                  {p.number}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground text-[10px] font-mono-num font-bold border border-border">
                  {p.tag}
                </span>
              </div>

              <h3 className="text-base font-bold text-foreground">
                {p.title}
              </h3>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {p.desc}
              </p>
            </div>

            <div className="pt-3 border-t border-border/60 text-[11px] text-muted-foreground">
              {p.note}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
