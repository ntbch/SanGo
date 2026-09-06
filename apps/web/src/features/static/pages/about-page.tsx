import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Phone, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AboutPage(): React.ReactElement {
  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 sm:py-12 space-y-16">
      {/* 1. Hero Section */}
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-12 lg:p-16 shadow-xs text-center space-y-5 max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.15] text-balance">
          Trải nghiệm đặt sân và kết nối thể thao trực tuyến
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          SanGo hỗ trợ người chơi tìm sân nhanh, giữ chỗ trực tuyến và tự động hóa vận hành cho các cụm sân thể thao phong trào tại Việt Nam.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to="/venues">
            <Button size="lg" className="font-bold shadow-xs active:scale-[0.98]">
              Khám phá cụm sân ngay
            </Button>
          </Link>
          <Link to="/partner">
            <Button variant="outline" size="lg" className="text-xs font-semibold active:scale-[0.98]">
              Dành cho chủ sân
            </Button>
          </Link>
        </div>
      </section>

      {/* 2. Sứ Mệnh & Mục Tiêu */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 sm:p-8 rounded-2xl border border-border bg-card space-y-3">
          <h2 className="text-xl font-bold text-foreground">Sứ mệnh</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Giúp việc đặt sân thể thao trở nên thuận tiện và minh bạch. Người chơi không còn phải gọi điện dò hỏi từng sân vào giờ cao điểm, không lo bị trùng lịch và dễ dàng tìm được đồng đội cùng trình độ.
          </p>
        </Card>

        <Card className="p-6 sm:p-8 rounded-2xl border border-border bg-card space-y-3">
          <h2 className="text-xl font-bold text-foreground">Mục tiêu phát triển</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Xây dựng mạng lưới kết nối đồng bộ giữa người chơi cá nhân, câu lạc bộ, cụm sân thể thao và các giải đấu phong trào tại các thành phố lớn trên cả nước.
          </p>
        </Card>
      </section>

      {/* 3. Tiêu Chuẩn Cam Kết */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Tiêu chuẩn dịch vụ
          </h2>
          <p className="text-sm text-muted-foreground">
            Những nguyên tắc vận hành cốt lõi của nền tảng SanGo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
            <h3 className="text-sm font-bold text-foreground">Tra cứu thời gian thực</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cập nhật khung giờ trống tức thì, đặt sân và nhận mã vé QR check-in tự động.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
            <h3 className="text-sm font-bold text-foreground">Minh bạch và an toàn</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bảng giá niêm yết rõ ràng. Cơ chế khóa slot 10 phút chống tình trạng đặt đè hoặc trùng lịch.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
            <h3 className="text-sm font-bold text-foreground">Gắn kết cộng đồng</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mở kèo tìm đối thủ phù hợp trình độ và chia tiền quỹ trận đấu tự động qua mã VietQR.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
            <h3 className="text-sm font-bold text-foreground">Hỗ trợ chủ sân</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Giúp ban quản lý tối ưu hóa công suất khai thác sân, quản lý lịch và tự động hóa thu tiền cọc.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Câu Chuyện Của SanGo */}
      <section className="rounded-2xl border border-border bg-secondary/50 p-6 sm:p-10 lg:p-12 space-y-3">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
          Bắt đầu từ nhu cầu thực tế
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Xuất phát từ những trải nghiệm thực tế khi đi tìm sân và tổ chức các trận bóng phong trào hàng tuần, chúng tôi nhận thấy nhiều bất tiện trong việc gọi điện kiểm tra lịch, nguy cơ trùng ca và sự phức tạp khi thu tiền chia sẻ chi phí thuê sân.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          SanGo được phát triển nhằm giải quyết các vấn đề trên, mang lại sự tiện lợi, minh bạch và chuyên nghiệp cho cộng đồng người chơi thể thao.
        </p>
      </section>

      {/* 5. Thông Tin Liên Hệ */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-card border border-border space-y-2">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <Phone className="h-4 w-4 text-primary" />
            <span>Hotline hỗ trợ</span>
          </div>
          <div className="font-mono-num font-extrabold text-base text-foreground">1900 6868</div>
          <p className="text-xs text-muted-foreground">Hỗ trợ đặt sân, thanh toán và kỹ thuật</p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border space-y-2">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <Mail className="h-4 w-4 text-primary" />
            <span>Email liên hệ</span>
          </div>
          <div className="font-mono-num font-extrabold text-base text-foreground">support@sango.vn</div>
          <p className="text-xs text-muted-foreground">Hợp tác kinh doanh và giải đấu</p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border space-y-2">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Khu vực hoạt động</span>
          </div>
          <div className="font-bold text-sm text-foreground">Hà Nội &amp; TP. Hồ Chí Minh</div>
          <p className="text-xs text-muted-foreground">Phủ sóng hơn 250 cụm sân thể thao</p>
        </div>
      </section>
    </div>
  );
}
