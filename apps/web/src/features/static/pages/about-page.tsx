import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import {
  ShieldCheck,
  Zap,
  Users,
  Compass,
  HeartHandshake,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Flame,
  Award,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function AboutPage(): React.ReactElement {
  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 sm:py-12 space-y-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-12 lg:p-16 shadow-xs text-center space-y-5 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/80 px-4 py-1.5 text-xs font-semibold text-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Về Chúng Tôi • Nền Tảng Thể Thao SanGo</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.15] text-balance">
          Kiến Tạo Trải Nghiệm Thể Thao <br className="hidden sm:inline" />
          <span className="text-primary">Số Hóa &amp; Văn Minh</span>
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          SanGo ra đời với sứ mệnh xóa bỏ mọi rào cản tìm sân, ghép kèo thi đấu và tự động hóa vận hành cho các cụm sân thể thao phong trào tại Việt Nam.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to="/venues">
            <Button size="lg" className="gap-2 font-bold shadow-xs active:scale-[0.98]">
              <Compass className="h-4 w-4" />
              <span>Khám phá cụm sân ngay</span>
            </Button>
          </Link>
          <Link to="/partner">
            <Button variant="outline" size="lg" className="text-xs font-bold active:scale-[0.98]">
              Dành cho Chủ sân
            </Button>
          </Link>
        </div>
      </section>

      {/* 2. Sứ Mệnh & Tầm Nhìn */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 sm:p-8 rounded-3xl border border-border/80 bg-card space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
            <Flame className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Sứ Mệnh Của Chúng Tôi</h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Biến việc ra sân thể thao trở nên dễ dàng và thuận tiện như đặt một chuyến xe công nghệ. Người chơi không còn phải gọi điện dò hỏi từng sân giờ cao điểm, không lo bị trùng lịch, và không ai phải bỏ lỡ niềm đam mê vì thiếu người ghép đội.
          </p>
        </Card>

        <Card className="p-6 sm:p-8 rounded-3xl border border-border/80 bg-card space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Award className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Tầm Nhìn Đến Năm 2030</h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Trở thành hệ sinh thái số hóa thể thao phong trào hàng đầu Đông Nam Á — kết nối liền mạch giữa Người chơi cá nhân, Câu lạc bộ, Cụm sân thể thao và Các giải đấu quy mô từ nghiệp dư đến bán chuyên.
          </p>
        </Card>
      </section>

      {/* 3. Bốn Giá Trị Cốt Lõi */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Giá Trị Cốt Lõi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Những Tiêu Chuẩn SanGo Cam Kết
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Tốc Độ &amp; Tức Thì</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tra cứu slot trống real-time trong 0.1 giây, đặt sân và nhận vé QR check-in tự động không cần chờ đợi.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Minh Bạch &amp; Tin Cậy</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Giá thuê sân và dịch vụ niêm yết rõ ràng. 100% cơ chế khóa slot 10 phút chống tình trạng đè lịch, mất cọc.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Gắn Kết Cộng Đồng</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mở kèo tìm đối, tìm người đá ghép tự động theo trình độ, khu vực và tính năng chia tiền quỹ đội minh bạch.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-3 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Đồng Hành Phát Triển</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cùng chủ sân nâng cao năng suất khai thác, quản trị dòng tiền tự động và phát triển thể thao địa phương.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Câu Chuyện Của SanGo */}
      <section className="rounded-3xl border border-border bg-secondary/30 p-6 sm:p-10 lg:p-12 space-y-4">
        <div className="max-w-3xl space-y-3">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Câu chuyện thương hiệu</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Bắt Đầu Từ Niềm Đam Mê Trên Sân Cỏ
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Chúng tôi là những người chơi thể thao phong trào hàng tuần tại Hà Nội và TP.HCM. Đã không ít lần chúng tôi phải gọi hàng chục cuộc điện thoại vào chiều thứ Sáu để tìm một sân bóng trống, hoặc đến nơi thì bị chủ sân báo nhầm ca, hay việc chia tiền sân cho 14 người sau trận đấu trở nên phiền phức.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            SanGo được xây dựng với mong muốn giải quyết triệt để những trải nghiệm chưa trọn vẹn đó bằng công nghệ hiện đại, mang lại sự tiện nghi xứng đáng cho cộng đồng yêu thể thao.
          </p>
        </div>
      </section>

      {/* 5. Thông Tin Liên Hệ Trực Tiếp */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Phone className="h-4 w-4" />
            <span>Hotline Hỗ Trợ 24/7</span>
          </div>
          <div className="font-mono-num font-extrabold text-base text-foreground">1900 6868 (Ext: 1)</div>
          <p className="text-[11px] text-muted-foreground">Hỗ trợ đặt sân, khiếu nại cọc và kỹ thuật</p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Mail className="h-4 w-4" />
            <span>Email Liên Hệ</span>
          </div>
          <div className="font-mono-num font-extrabold text-base text-foreground">support@sango.vn</div>
          <p className="text-[11px] text-muted-foreground">Hợp tác kinh doanh &amp; truyền thông giải đấu</p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <MapPin className="h-4 w-4" />
            <span>Văn Phòng SanGo</span>
          </div>
          <div className="font-bold text-sm text-foreground">Hà Nội &amp; TP. Hồ Chí Minh</div>
          <p className="text-[11px] text-muted-foreground">Tòa nhà Công nghệ, Cầu Giấy, Hà Nội</p>
        </div>
      </section>
    </div>
  );
}
