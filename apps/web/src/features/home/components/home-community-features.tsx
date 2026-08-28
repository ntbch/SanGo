import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import {
  Swords,
  Trophy,
  ArrowRight,
  Award,
  Zap,
  Clock,
  Flame,
} from 'lucide-react';

export function HomeCommunityFeatures(): React.ReactElement {
  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest">
            <Zap className="h-3.5 w-3.5" />
            <span>Sân chơi phong trào</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Kết Nối Đồng Đội &amp; Thi Đấu Thể Thao
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Thiếu chân đá? Muốn tìm đối tác giao hữu cân tài cân sức hay tranh tài tại các giải phong trào? SanGo kết nối bạn với hàng ngàn người chơi thể thao mỗi ngày.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature 1: Matchmaking Hub */}
        <Card className="rounded-3xl border border-border/80 bg-card p-6 sm:p-7 space-y-6 hover:border-primary/50 transition-all duration-200 flex flex-col justify-between shadow-xs">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <Swords className="h-5 w-5" />
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-mono-num font-bold uppercase tracking-wider">
                    Sàn Ghép Trận
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                    Mở Kèo &amp; Tìm Đồng Đội Cùng Trình Độ
                  </h3>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-secondary text-[11px] font-mono-num font-bold text-foreground">
                Live 45+ Kèo
              </span>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Mở kèo nhanh cho Bóng đá 5-7, Pickleball đôi, Cầu lông, Tennis. Thiết lập giới hạn trình độ (D1/D2/Open), tự động chia tiền cọc và khóa danh sách khi đủ slot.
            </p>

            {/* Live Match Preview Mock Card */}
            <div className="rounded-2xl border border-border/80 bg-background/90 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Flame className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                  <span>Kèo Bóng Đá 7v7 — Tuyển thêm 3 slot</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono-num font-bold text-[10px]">
                  Rank D2 (Khá)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50 text-muted-foreground">
                <div className="flex items-center gap-1 font-mono-num">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>19:30 Tối Nay • Sân Ngọc Khánh</span>
                </div>
                <div className="flex items-center gap-1 font-mono-num font-bold text-primary">
                  <span>50.000 đ / slot</span>
                </div>
              </div>

              {/* Slots Fill Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono-num">
                  <span className="text-muted-foreground">Thành viên đã tham gia:</span>
                  <span className="font-bold text-foreground">11 / 14 Cầu thủ</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[78%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/60">
            <Link to="/matches">
              <Button className="w-full sm:w-auto gap-2 font-bold text-xs shadow-xs active:scale-[0.98]">
                <Swords className="h-4 w-4" />
                <span>Xem tất cả kèo đang mở</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Feature 2: Tournaments Hub */}
        <Card className="rounded-3xl border border-border/80 bg-card p-6 sm:p-7 space-y-6 hover:border-amber-500/40 transition-all duration-200 flex flex-col justify-between shadow-xs">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-mono-num font-bold uppercase tracking-wider">
                    Giải Đấu Phong Trào
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                    Hệ Thống Giải Đấu &amp; Bảng Điểm Tự Động
                  </h3>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-mono-num font-bold border border-amber-500/20">
                12 Giải mở đăng ký
              </span>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Tự động hóa toàn bộ khâu tổ chức giải: bốc thăm ngẫu nhiên, tạo sơ đồ thi đấu loại trực tiếp hoặc vòng bảng, trọng tài cập nhật tỉ số trực tiếp từng set đấu.
            </p>

            {/* Tournament Bracket Preview Mock Card */}
            <div className="rounded-2xl border border-border/80 bg-background/90 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                  <Award className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span>SanGo Pickleball Championship 2026</span>
                </div>
                <span className="font-mono-num font-extrabold text-amber-600 dark:text-amber-400 text-[11px]">
                  Tổng thưởng 20.000.000 đ
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                <div className="p-2 rounded-xl bg-secondary/50 border border-border/60">
                  <div className="text-[10px] text-muted-foreground">Quy mô giải:</div>
                  <div className="font-mono-num font-bold text-foreground">16 Cặp VĐV Đôi Nam</div>
                </div>
                <div className="p-2 rounded-xl bg-secondary/50 border border-border/60">
                  <div className="text-[10px] text-muted-foreground">Thể thức:</div>
                  <div className="font-mono-num font-bold text-foreground">Loại trực tiếp (Best of 3)</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/60">
            <Link to="/tournaments">
              <Button
                variant="outline"
                className="w-full sm:w-auto gap-2 font-bold text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 active:scale-[0.98]"
              >
                <Trophy className="h-4 w-4" />
                <span>Khám phá các giải đấu</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
