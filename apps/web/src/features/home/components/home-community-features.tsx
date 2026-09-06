import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HomeCommunityFeatures(): React.ReactElement {
  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="space-y-1 max-w-2xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Kết nối đồng đội &amp; thi đấu thể thao
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tìm đối thủ giao lưu theo trình độ hoặc tham gia các giải đấu phong trào có quản lý nhánh đấu tự động.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature 1: Matchmaking Hub */}
        <Card className="rounded-2xl border border-border bg-card p-6 sm:p-7 space-y-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono-num font-bold uppercase tracking-wider text-muted-foreground">
                  Giao lưu phong trào
                </span>
                <h3 className="text-lg font-bold text-foreground mt-0.5">
                  Mở kèo &amp; tìm đồng đội cùng trình độ
                </h3>
              </div>

              <span className="px-2.5 py-1 rounded-md bg-secondary text-[11px] font-semibold text-foreground border border-border">
                Ghép kèo
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Dành cho đội thể thao thiếu người, cần tìm đội giao lưu hoặc người chơi cá nhân tìm trận đấu quanh khu vực.
            </p>

            <div className="space-y-2.5 pt-1">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <div className="font-bold text-xs text-foreground">Phân hạng trình độ</div>
                <div className="text-muted-foreground text-[11px] leading-relaxed mt-0.5">
                  Thiết lập phân hạng (D1, D2, Open) giúp các đội tìm đối thủ phù hợp, giảm chênh lệch trình độ.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <div className="font-bold text-xs text-foreground">Chốt danh sách và giữ chỗ</div>
                <div className="text-muted-foreground text-[11px] leading-relaxed mt-0.5">
                  Hệ thống tự động khóa danh sách khi đủ số lượng và theo dõi phần cọc của từng thành viên.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <div className="font-bold text-xs text-foreground">Thông báo trạng thái theo thời gian thực</div>
                <div className="text-muted-foreground text-[11px] leading-relaxed mt-0.5">
                  Nhận thông báo khi có thành viên gửi yêu cầu tham gia hoặc khi đội trưởng duyệt slot.
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <Link to="/matches">
              <Button className="w-full sm:w-auto gap-1.5 font-bold text-xs shadow-xs active:scale-[0.98]">
                <span>Xem danh sách kèo thi đấu</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Feature 2: Tournaments Hub */}
        <Card className="rounded-2xl border border-border bg-card p-6 sm:p-7 space-y-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono-num font-bold uppercase tracking-wider text-muted-foreground">
                  Giải đấu phong trào
                </span>
                <h3 className="text-lg font-bold text-foreground mt-0.5">
                  Hệ thống giải đấu &amp; bảng điểm tự động
                </h3>
              </div>

              <span className="px-2.5 py-1 rounded-md bg-secondary text-[11px] font-semibold text-foreground border border-border">
                Giải đấu
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Hỗ trợ ban tổ chức và cụm sân quản lý giải đấu từ khâu đăng ký đội hình đến tổng kết trao giải.
            </p>

            <div className="space-y-2.5 pt-1">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <div className="font-bold text-xs text-foreground">Sơ đồ thi đấu tự động</div>
                <div className="text-muted-foreground text-[11px] leading-relaxed mt-0.5">
                  Hỗ trợ các thể thức thi đấu phổ biến: Vòng tròn tính điểm, Loại trực tiếp và Nhánh Thắng - Nhánh Thua.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <div className="font-bold text-xs text-foreground">Cập nhật kết quả trận đấu</div>
                <div className="text-muted-foreground text-[11px] leading-relaxed mt-0.5">
                  Cập nhật tỉ số từng hiệp, bảng xếp hạng và nhánh đấu tự động cập nhật kết quả.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <div className="font-bold text-xs text-foreground">Lưu trữ thành tích thi đấu</div>
                <div className="text-muted-foreground text-[11px] leading-relaxed mt-0.5">
                  Ghi nhận lịch sử giải đấu, danh hiệu vô địch và điểm xếp hạng của vận động viên.
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <Link to="/tournaments">
              <Button
                variant="outline"
                className="w-full sm:w-auto gap-1.5 font-bold text-xs active:scale-[0.98]"
              >
                <span>Xem danh sách giải đấu</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
