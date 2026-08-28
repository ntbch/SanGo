import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import {
  Swords,
  Trophy,
  ArrowRight,
  Zap,
  CheckCircle2,
  Sliders,
  BellRing,
  GitBranch,
  Radio,
  Medal,
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
            Nền tảng kết nối cộng đồng thể thao phong trào hàng đầu: từ việc ghép kèo giao hữu cân tài cân sức đến tổ chức các giải đấu chuyên nghiệp tự động.
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
                    Sàn Ghép Kèo Thông Minh
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                    Mở Kèo &amp; Tìm Đối Thủ Cân Sức
                  </h3>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-secondary text-[11px] font-semibold text-foreground border border-border">
                Tính năng cộng đồng
              </span>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Giải pháp toàn diện khi đội bóng thiếu chân, cần tìm đối tác giao hữu hoặc người chơi cá nhân muốn tham gia các trận đấu thể thao quanh khu vực.
            </p>

            {/* Core Feature Pillars (No fake data records) */}
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-secondary/40 border border-border/60">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Sliders className="h-3.5 w-3.5" />
                </div>
                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-foreground">Phân hạng trình độ công bằng</div>
                  <div className="text-muted-foreground text-[11px] leading-relaxed">
                    Thiết lập phân hạng (D1, D2, Open) giúp các đội tìm được đối thủ tương xứng, hạn chế chênh lệch trình độ.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-secondary/40 border border-border/60">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-foreground">Tự động chốt danh sách &amp; Quản lý cọc</div>
                  <div className="text-muted-foreground text-[11px] leading-relaxed">
                    Hệ thống tự động khóa danh sách khi đủ người tham gia và bảo đảm tiền cọc trách nhiệm cho từng vị trí.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-secondary/40 border border-border/60">
                <div className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <BellRing className="h-3.5 w-3.5" />
                </div>
                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-foreground">Thông báo trạng thái thời gian thực</div>
                  <div className="text-muted-foreground text-[11px] leading-relaxed">
                    Nhận thông báo ngay lập tức khi có thành viên gửi yêu cầu tham gia hoặc khi đội trưởng phê duyệt slot.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/60">
            <Link to="/matches">
              <Button className="w-full sm:w-auto gap-2 font-bold text-xs shadow-xs active:scale-[0.98]">
                <Swords className="h-4 w-4" />
                <span>Xem danh sách sàn ghép kèo</span>
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
                    Hệ Thống Giải Đấu Phong Trào
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                    Tổ Chức Giải &amp; Cập Nhật Tỉ Số Tự Động
                  </h3>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-secondary text-[11px] font-semibold text-foreground border border-border">
                Chuẩn thi đấu
              </span>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Giải pháp số hóa toàn diện giúp ban tổ chức, cụm sân và các hội nhóm thể thao quản trị giải đấu từ khâu đăng ký đến trận chung kết.
            </p>

            {/* Core Feature Pillars (No fake data records) */}
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-secondary/40 border border-border/60">
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <GitBranch className="h-3.5 w-3.5" />
                </div>
                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-foreground">Sơ đồ thi đấu Bracket tự động</div>
                  <div className="text-muted-foreground text-[11px] leading-relaxed">
                    Hỗ trợ đa dạng thể thức: Vòng tròn tính điểm, Loại trực tiếp (Knockout) và Nhánh Thắng - Nhánh Thua.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-secondary/40 border border-border/60">
                <div className="h-7 w-7 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Radio className="h-3.5 w-3.5" />
                </div>
                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-foreground">Cập nhật tỉ số trực tiếp từng hiệp</div>
                  <div className="text-muted-foreground text-[11px] leading-relaxed">
                    Trọng tài và BTC cập nhật điểm số theo thời gian thực, bảng xếp hạng và nhánh đấu tự động nhảy kết quả.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-secondary/40 border border-border/60">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Medal className="h-3.5 w-3.5" />
                </div>
                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-foreground">Lưu trữ thành tích &amp; Điểm Elo</div>
                  <div className="text-muted-foreground text-[11px] leading-relaxed">
                    Ghi nhận bảng thành tích VĐV, danh hiệu vô địch và cập nhật thứ hạng trên bảng xếp hạng thể thao toàn hệ thống.
                  </div>
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
                <span>Khám phá các giải đấu thể thao</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
