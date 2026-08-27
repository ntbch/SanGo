import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Swords, Trophy, Users, ShieldCheck, ArrowRight, Award, Zap } from 'lucide-react';

export function HomeCommunityFeatures(): React.ReactElement {
  return (
    <section className="space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-1.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
          <Zap className="h-3.5 w-3.5" />
          <span>Cộng Đồng Thể Thao SanGo</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
          Kết Nối Đồng Đội & Thi Đấu Thể Thao
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Tham gia cộng đồng người chơi phong trào, mở kèo ghép trận và tranh tài tại các giải đấu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Feature 1: Matchmaking Intro */}
        <Card className="border border-border/80 bg-gradient-to-br from-card via-card/90 to-primary/5 p-6 sm:p-8 space-y-5 hover:border-primary/50 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <Swords className="h-6 w-6" />
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-secondary text-[11px] font-bold text-foreground">
                Ghép trận tự do
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">
                Mở Kèo & Tìm Đồng Đội Cùng Trình Độ
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tạo kèo đấu nhanh chóng cho các môn Bóng đá, Pickleball, Cầu lông, Tennis. Tự động chia tiền sân theo đầu người và lọc đối thủ theo cấp độ kỹ năng phù hợp.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary shrink-0" />
                <span>Ghép đội hình 2v2, 5v5, 7v7 tự động</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Chấm điểm uy tín sau trận, hạn chế bùng kèo</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border/60">
            <Link to="/matches">
              <Button className="w-full sm:w-auto gap-2 font-bold text-xs shadow-xs">
                <span>Khám phá khu vực ghép trận</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Feature 2: Tournaments Intro */}
        <Card className="border border-border/80 bg-gradient-to-br from-card via-card/90 to-amber-500/5 p-6 sm:p-8 space-y-5 hover:border-amber-500/40 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Trophy className="h-6 w-6" />
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-[11px] font-bold text-amber-500 border border-amber-500/20">
                Giải đấu phong trào
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">
                Hệ Thống Giải Đấu & Bảng Điểm Tự Động
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tham gia tranh tài tại các giải đấu do cụm sân và cộng đồng tổ chức. Tự động bốc thăm chia nhánh loại trực tiếp, cập nhật bảng xếp hạng và tỷ số trực tiếp theo thời gian thực.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Cơ cấu giải thưởng và huy chương điện tử</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary shrink-0" />
                <span>Theo dõi sơ đồ nhánh đấu (Bracket) trực quan</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border/60">
            <Link to="/tournaments">
              <Button variant="outline" className="w-full sm:w-auto gap-2 font-bold text-xs border-amber-500/40 text-amber-500 hover:bg-amber-500/10">
                <span>Xem danh sách giải đấu</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
