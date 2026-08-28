import React from 'react';
import { Card } from '../../../components/ui/card';
import {
  Clock,
  Users,
  QrCode,
  ShieldCheck,
  Zap,
  Lock,
  CheckCircle2,
} from 'lucide-react';

export function HomeTechPillars(): React.ReactElement {
  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest">
            <Zap className="h-3.5 w-3.5" />
            <span>Quy Trình Vận Hành Thể Thao SanGo</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Công Nghệ Vận Hành Thể Thao SanGo
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Hệ thống tự động hóa từ khâu chọn khung giờ, thanh toán cọc an toàn, chia tiền quỹ đến check-in vé QR tại cụm sân.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono-num text-muted-foreground px-3 py-1.5 rounded-xl bg-card border border-border/80">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Hệ thống trực tuyến 24/7</span>
        </div>
      </div>

      {/* Athletic Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {/* Bento Tile 1: Slot Lock (2 Columns on Desktop) */}
        <Card className="md:col-span-2 p-6 sm:p-7 rounded-3xl border border-border/80 bg-card hover:border-primary/50 transition-all duration-200 flex flex-col justify-between space-y-6 shadow-xs group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-mono-num font-bold uppercase tracking-wider">
                    Giữ Chỗ Tự Động
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                    Khóa Khung Giờ 10 Phút — Tránh Trùng Lịch Tuyệt Đối
                  </h3>
                </div>
              </div>

              <span className="hidden sm:inline-flex px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono-num font-bold border border-emerald-500/20">
                Chính xác theo thời gian thực
              </span>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Ngay khi chọn slot, hệ thống sẽ tạm giữ chỗ riêng cho bạn trong 10 phút. Không thành viên nào khác có thể đặt đè trong lúc bạn xác nhận và thanh toán cọc.
            </p>
          </div>

          {/* Interactive Status Widget */}
          <div className="rounded-2xl border border-border/80 bg-background/90 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-bold text-foreground">Sân 7A — Khung 19:30 - 21:00</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-mono-num font-bold text-xs shadow-xs">
                <Clock className="h-3.5 w-3.5" />
                <span>Giữ chỗ an toàn 10:00</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary w-full rounded-full" />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Slot được bảo lưu riêng biệt cho tài khoản
              </span>
              <span className="font-mono-num">Chuẩn SanGo Core</span>
            </div>
          </div>
        </Card>

        {/* Bento Tile 2: Team Bill Split (1 Column) */}
        <Card className="p-6 rounded-3xl border border-border/80 bg-card hover:border-primary/50 transition-all duration-200 flex flex-col justify-between space-y-5 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Users className="h-5 w-5" />
              </div>
              <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-mono-num font-bold text-muted-foreground">
                Tự động tính toán
              </span>
            </div>

            <h3 className="text-base font-bold text-foreground">
              Chia Tiền Quỹ &amp; Tách Bill Trận Đấu
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tạo đợt thu quỹ theo đầu người tham gia. Thành viên chuyển khoản trực tiếp qua mã VietQR hoặc số dư ví nhanh chóng.
            </p>
          </div>

          {/* Mini Split Calculator */}
          <div className="rounded-2xl border border-border/70 bg-secondary/40 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tiền sân + dịch vụ:</span>
              <span className="font-mono-num font-bold text-foreground">600.000 đ</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/60">
              <span className="font-bold text-primary">10 thành viên:</span>
              <span className="font-mono-num font-extrabold text-primary text-sm">60.000 đ / người</span>
            </div>
          </div>
        </Card>

        {/* Bento Tile 3: Speed QR Check-in (1 Column) */}
        <Card className="p-6 rounded-3xl border border-border/80 bg-card hover:border-primary/50 transition-all duration-200 flex flex-col justify-between space-y-5 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                <QrCode className="h-5 w-5" />
              </div>
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-mono-num font-bold">
                Check-in nhanh
              </span>
            </div>

            <h3 className="text-base font-bold text-foreground">
              Vé Điện Tử &amp; Check-in QR
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mã vé QR được tạo tự động sau khi thanh toán thành công. Quét mã tại quầy lễ tân cụm sân để nhận sân ngay lập tức.
            </p>
          </div>

          {/* Mini Ticket Representation */}
          <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Mã vé điện tử</span>
              <p className="font-mono-num font-bold text-xs text-foreground">#SG-PASS-2026</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-card border border-border/80 flex items-center justify-center text-primary">
              <QrCode className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Bento Tile 4: Fairplay Reputation Score (2 Columns on Desktop) */}
        <Card className="md:col-span-2 p-6 sm:p-7 rounded-3xl border border-border/80 bg-card hover:border-amber-500/40 transition-all duration-200 flex flex-col justify-between space-y-5 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono-num font-bold uppercase tracking-wider">
                    Điểm Tín Nhiệm
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                    Hệ Thống Tín Nhiệm &amp; Xếp Hạng Fairplay
                  </h3>
                </div>
              </div>

              <span className="hidden sm:inline-flex px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-mono-num font-bold border border-amber-500/20">
                Xây dựng cộng đồng văn minh
              </span>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Mỗi người chơi và đội bóng tích luỹ điểm tín nhiệm dựa trên mức độ đúng giờ và lịch sử thi đấu, giúp tìm bạn ghép kèo uy tín và hạn chế việc hủy trận đột ngột.
            </p>
          </div>

          {/* Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-secondary/30 border border-border/70 flex items-center gap-3">
              <div className="text-xl font-mono-num font-black text-primary">100%</div>
              <div className="text-[11px] text-muted-foreground leading-tight">Chống trùng ca trực tuyến</div>
            </div>
            <div className="p-3 rounded-2xl bg-secondary/30 border border-border/70 flex items-center gap-3">
              <div className="text-xl font-mono-num font-black text-amber-600 dark:text-amber-400">10 Phút</div>
              <div className="text-[11px] text-muted-foreground leading-tight">Thời gian giữ chỗ bảo lưu</div>
            </div>
            <div className="p-3 rounded-2xl bg-secondary/30 border border-border/70 flex items-center gap-3">
              <div className="text-xl font-mono-num font-black text-emerald-600 dark:text-emerald-400">1 Giây</div>
              <div className="text-[11px] text-muted-foreground leading-tight">Quét mã QR nhận sân</div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
