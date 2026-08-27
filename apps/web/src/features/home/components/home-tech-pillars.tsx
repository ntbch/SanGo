import React from 'react';
import { Card } from '../../../components/ui/card';
import { Clock, Users, QrCode, ShieldCheck } from 'lucide-react';

const PILLARS = [
  {
    icon: Clock,
    title: 'Khóa Slot 10 Phút',
    desc: 'Cơ chế giữ chỗ phân tán chống double-booking tuyệt đối, cho phép người chơi an tâm thanh toán.',
    badge: 'Chống trùng lịch',
  },
  {
    icon: Users,
    title: 'Chia Tiền Đội Nhóm',
    desc: 'Tạo quỹ đội, chia tiền sân tự động theo từng thành viên tham gia, minh bạch mọi khoản chi.',
    badge: 'Quản lý quỹ',
  },
  {
    icon: QrCode,
    title: 'Check-in Mã QR',
    desc: 'Nhận vé điện tử kèm mã QR bảo mật ngay sau khi đặt cọc, quét mã tại quầy để vào sân tức thì.',
    badge: 'Vào sân 1 giây',
  },
  {
    icon: ShieldCheck,
    title: 'Hệ Thống Uy Tín',
    desc: 'Chấm điểm tín nhiệm người chơi (Reputation Score), hạn chế tình trạng hủy kèo và bùng sân.',
    badge: 'Cộng đồng văn minh',
  },
];

export function HomeTechPillars(): React.ReactElement {
  return (
    <section className="space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
          Công Nghệ Vận Hành Thể Thao SanGo
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Chuẩn hóa toàn bộ trải nghiệm từ tìm kiếm, đặt sân, chia tiền đến check-in.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PILLARS.map((p, idx) => (
          <Card key={idx} className="border border-border/80 bg-card p-5 space-y-3 hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <p.icon className="h-5 w-5" />
              </div>
              <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-bold text-muted-foreground">
                {p.badge}
              </span>
            </div>

            <h3 className="text-sm font-bold text-foreground">{p.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
