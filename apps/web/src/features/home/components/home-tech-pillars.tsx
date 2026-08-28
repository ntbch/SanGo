import React from 'react';
import { Card } from '../../../components/ui/card';
import {
  QrCode,
  ShieldCheck,
  Zap,
  Lock,
  CheckCircle2,
  Banknote,
} from 'lucide-react';

export function HomeTechPillars(): React.ReactElement {
  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest">
            <Zap className="h-3.5 w-3.5" />
            <span>Nền tảng công nghệ thể thao</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Trụ Cột Công Nghệ Vận Hành SanGo
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Hệ sinh thái công nghệ khép kín giải quyết toàn diện các vấn đề về trùng lịch, thanh toán, quản lý quỹ và check-in thực địa.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono-num text-muted-foreground px-3 py-1.5 rounded-xl bg-card border border-border/80">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Vận hành tự động 24/7</span>
        </div>
      </div>

      {/* Bento Grid with Pure Informational Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Distributed Slot Locking */}
        <Card className="p-6 rounded-3xl border border-border/80 bg-card hover:border-primary/50 transition-all duration-300 flex flex-col justify-between space-y-5 shadow-xs group">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 transition-transform group-hover:scale-105">
                <Lock className="h-5 w-5" />
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono-num font-bold">
                100% Chống trùng
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono-num font-bold uppercase tracking-wider text-muted-foreground">
                Cơ chế 01
              </span>
              <h3 className="text-base font-bold text-foreground mt-0.5 group-hover:text-primary transition-colors">
                Khóa Slot 10 Phút Độc Quyền
              </h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Cơ chế Distributed Lock tự động bảo lưu khung giờ riêng biệt cho người đặt trong 10 phút, loại bỏ hoàn toàn tình trạng 2 người cùng thanh toán một sân.
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Giải phóng slot tự động nếu hết hạn</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Đồng bộ tức thì lên bảng lịch toàn mạng</span>
            </div>
          </div>
        </Card>

        {/* Pillar 2: Smart Treasury Split */}
        <Card className="p-6 rounded-3xl border border-border/80 bg-card hover:border-primary/50 transition-all duration-300 flex flex-col justify-between space-y-5 shadow-xs group">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 transition-transform group-hover:scale-105">
                <Banknote className="h-5 w-5" />
              </div>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-mono-num font-bold">
                Tự động hóa
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono-num font-bold uppercase tracking-wider text-muted-foreground">
                Cơ chế 02
              </span>
              <h3 className="text-base font-bold text-foreground mt-0.5 group-hover:text-sky-500 transition-colors">
                Chia Quỹ &amp; Tách Bill Thông Minh
              </h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Thuật toán tự động chia đều tiền thuê sân và dịch vụ theo số người tham gia. Tạo link thu quỹ kèm mã VietQR động riêng cho từng thành viên trong đội.
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-sky-500 shrink-0" />
              <span>Hỗ trợ VietQR &amp; Số dư ví SanGo</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-sky-500 shrink-0" />
              <span>Theo dõi tiến độ đóng tiền Real-time</span>
            </div>
          </div>
        </Card>

        {/* Pillar 3: Fast QR Pass */}
        <Card className="p-6 rounded-3xl border border-border/80 bg-card hover:border-primary/50 transition-all duration-300 flex flex-col justify-between space-y-5 shadow-xs group">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 transition-transform group-hover:scale-105">
                <QrCode className="h-5 w-5" />
              </div>
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-mono-num font-bold">
                1 Giây tại quầy
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono-num font-bold uppercase tracking-wider text-muted-foreground">
                Cơ chế 03
              </span>
              <h3 className="text-base font-bold text-foreground mt-0.5 group-hover:text-cyan-500 transition-colors">
                Vé Điện Tử &amp; Check-in QR
              </h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Mã vé QR được sinh tự động ngay sau khi xác nhận đặt chỗ. Lễ tân chỉ cần quét mã để đối soát thông tin ca đá và bàn giao sân trong tích tắc.
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
              <span>Không cần gọi điện thoại hay xác minh sổ</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
              <span>Chống giả mạo và bảo mật thông tin</span>
            </div>
          </div>
        </Card>

        {/* Pillar 4: Fairplay Reputation Network */}
        <Card className="p-6 rounded-3xl border border-border/80 bg-card hover:border-primary/50 transition-all duration-300 flex flex-col justify-between space-y-5 shadow-xs group">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-transform group-hover:scale-105">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono-num font-bold">
                Cộng đồng chuẩn
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono-num font-bold uppercase tracking-wider text-muted-foreground">
                Cơ chế 04
              </span>
              <h3 className="text-base font-bold text-foreground mt-0.5 group-hover:text-amber-500 transition-colors">
                Hệ Thống Tín Nhiệm &amp; Fairplay
              </h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Đánh giá điểm uy tín và văn hóa thi đấu của từng người chơi và đội bóng, giúp các bên an tâm giao lưu và triệt tiêu vấn đề hủy trận phút chót.
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Ghi nhận lịch sử thi đấu &amp; Điểm đúng giờ</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Ưu tiên ghép kèo cho thành viên uy tín cao</span>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
