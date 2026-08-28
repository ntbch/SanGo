import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Building2,
  CalendarDays,
  ShieldCheck,
  TrendingUp,
  QrCode,
  Users,
  PhoneCall,
  Clock,
  Sparkles,
  ArrowRight,
  Zap,
  BadgePercent,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function PartnerPage(): React.ReactElement {
  const [submitted, setSubmitted] = React.useState(false);
  const [formData, setFormData] = React.useState({
    fullName: '',
    phone: '',
    venueName: '',
    city: 'Hà Nội',
    district: '',
    sportTypes: [] as string[],
    courtCount: '4',
    note: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const toggleSport = (sport: string) => {
    setFormData((prev) => ({
      ...prev,
      sportTypes: prev.sportTypes.includes(sport)
        ? prev.sportTypes.filter((s) => s !== sport)
        : [...prev.sportTypes, sport],
    }));
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 sm:py-12 space-y-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-12 lg:p-16 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/80 px-4 py-1.5 text-xs font-semibold text-foreground">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span>Dành riêng cho Chủ sân &amp; Ban quản trị</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.15] text-balance">
              Số Hóa Quản Lý Sân &amp; <span className="text-primary">Tối Đa Doanh Thu</span>
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
              SanGo OS cung cấp giải pháp đồng bộ lịch ma trận thời gian thực, triệt tiêu 100% nguy cơ trùng ca, tự động thu cọc qua VietQR và tiếp cận hơn 50.000 người chơi thể thao phong trào tại Hà Nội &amp; TP.HCM.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a href="#partner-form">
                <Button size="lg" className="gap-2 font-bold shadow-xs active:scale-[0.98]">
                  <span>Đăng ký đối tác chủ sân</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link to="/login">
                <Button variant="outline" size="lg" className="text-xs font-bold active:scale-[0.98]">
                  Đăng nhập Chủ sân
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Card */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
            <div className="p-5 rounded-2xl bg-secondary/40 border border-border/80 space-y-1.5">
              <div className="text-2xl sm:text-3xl font-mono-num font-black text-primary">+35%</div>
              <div className="text-xs font-bold text-foreground">Lấp đầy ca trống</div>
              <p className="text-[11px] text-muted-foreground leading-tight">Tối ưu doanh thu khung giờ trưa &amp; đêm</p>
            </div>

            <div className="p-5 rounded-2xl bg-secondary/40 border border-border/80 space-y-1.5">
              <div className="text-2xl sm:text-3xl font-mono-num font-black text-emerald-600 dark:text-emerald-400">0%</div>
              <div className="text-xs font-bold text-foreground">Trùng lịch ca sân</div>
              <p className="text-[11px] text-muted-foreground leading-tight">Khóa slot tự động 10 phút</p>
            </div>

            <div className="p-5 rounded-2xl bg-secondary/40 border border-border/80 space-y-1.5">
              <div className="text-2xl sm:text-3xl font-mono-num font-black text-sky-600 dark:text-sky-400">1 Giây</div>
              <div className="text-xs font-bold text-foreground">Check-in tại quầy</div>
              <p className="text-[11px] text-muted-foreground leading-tight">Quét mã QR xuất vé thông minh</p>
            </div>

            <div className="p-5 rounded-2xl bg-secondary/40 border border-border/80 space-y-1.5">
              <div className="text-2xl sm:text-3xl font-mono-num font-black text-amber-600 dark:text-amber-400">250+</div>
              <div className="text-xs font-bold text-foreground">Cụm sân đối tác</div>
              <p className="text-[11px] text-muted-foreground leading-tight">Đang vận hành trên hệ thống</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Bento Grid: 6 Lợi Ích Cốt Lõi Cho Chủ Sân */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest">
            <Zap className="h-3.5 w-3.5" />
            <span>Tính Năng SanGo OS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Bộ Công Cụ Quản Trị Sân Toàn Diện
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Thiết kế chuyên biệt cho mô hình vận hành sân cỏ nhân tạo, pickleball, cầu lông và tennis tại Việt Nam.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1 */}
          <Card className="p-6 rounded-3xl border border-border/80 bg-card hover:border-primary/50 transition-all duration-200 space-y-4">
            <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <CalendarDays className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Ma Trận Lịch Real-time</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hiển thị trực quan toàn bộ sân con theo trục thời gian. Đổi màu linh hoạt theo trạng thái: Trống, Đang giữ chỗ, Đã cọc, Khóa nội bộ.
            </p>
          </Card>

          {/* Card 2 */}
          <Card className="p-6 rounded-3xl border border-border/80 bg-card hover:border-emerald-500/40 transition-all duration-200 space-y-4">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <BadgePercent className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Thu Cọc VietQR Tự Động</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Khách thanh toán cọc trực tiếp qua mã VietQR động về thẳng tài khoản ngân hàng của chủ sân. Hệ thống tự động gạch nợ trong 2 giây.
            </p>
          </Card>

          {/* Card 3 */}
          <Card className="p-6 rounded-3xl border border-border/80 bg-card hover:border-sky-500/40 transition-all duration-200 space-y-4">
            <div className="h-11 w-11 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <QrCode className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Lễ Tân Check-in 1 Giây</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Quét vé QR của khách bằng điện thoại hoặc máy quét quầy. Loại bỏ hoàn toàn thao tác gọi điện đối soát hay ghi chép sổ sách thủ công.
            </p>
          </Card>

          {/* Card 4 */}
          <Card className="p-6 rounded-3xl border border-border/80 bg-card hover:border-amber-500/40 transition-all duration-200 space-y-4">
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Báo Cáo &amp; Dịch Vụ Bán Kèm</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Quản lý doanh thu thuê sân, nước uống, áo bib và bóng thi đấu. Tự động kết xuất báo cáo doanh số chi tiết theo ngày, tuần, tháng.
            </p>
          </Card>

          {/* Card 5 */}
          <Card className="p-6 rounded-3xl border border-border/80 bg-card hover:border-purple-500/40 transition-all duration-200 space-y-4">
            <div className="h-11 w-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Tiếp Cận Khách Hàng Quanh Khu Vực</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Xuất hiện trên bản đồ thể thao GPS SanGo và được ưu tiên gợi ý cho các đội bóng mở kèo tìm sân trong bán kính 5km lân cận.
            </p>
          </Card>

          {/* Card 6 */}
          <Card className="p-6 rounded-3xl border border-border/80 bg-card hover:border-primary/50 transition-all duration-200 space-y-4">
            <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Bảo Mật &amp; Cam Kết Vận Hành</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Phân quyền chặt chẽ giữa Chủ sân, Quản lý ca và Lễ tân. Dữ liệu kinh doanh được mã hóa an toàn, sao lưu tự động hàng ngày.
            </p>
          </Card>
        </div>
      </section>

      {/* 3. Quy Trình 4 Bước Triển Khai */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest">
            <Clock className="h-3.5 w-3.5" />
            <span>Quy Trình Nhanh Chóng</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Bắt Đầu Trong 24 Giờ
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Không gián đoạn hoạt động kinh doanh hiện tại của cụm sân.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: '01', title: 'Gửi Thông Tin Sân', desc: 'Điền form thông tin cụm sân, số lượng sân con và địa chỉ vị trí.' },
            { step: '02', title: 'Khởi Tạo Hệ Thống', desc: 'Đội ngũ SanGo thiết lập ma trận lịch và cấu hình tài khoản trong 24h.' },
            { step: '03', title: 'Bàn Giao & Hướng Dẫn', desc: 'Hướng dẫn trực tuyến hoặc trực tiếp cho ban quản lý và nhân viên lễ tân.' },
            { step: '04', title: 'Đón Khách Tự Động', desc: 'Cụm sân hiển thị trực tuyến, bắt đầu nhận tiền cọc tự động qua VietQR.' },
          ].map((item, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-card border border-border/80 space-y-2 relative shadow-xs">
              <span className="font-mono-num text-2xl font-black text-muted-foreground/30">{item.step}</span>
              <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Form Đăng Ký Hợp Tác */}
      <section id="partner-form" className="max-w-3xl mx-auto rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Đăng Ký Tư Vấn Miễn Phí</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-foreground">
            Trở Thành Đối Tác Cụm Sân SanGo
          </h3>
          <p className="text-xs text-muted-foreground">
            Để lại thông tin bên dưới, chuyên viên hỗ trợ của SanGo sẽ liên hệ tư vấn và thiết lập hệ thống cho bạn trong vòng 2 giờ làm việc.
          </p>
        </div>

        {submitted ? (
          <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
              <Check className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">Đăng Ký Thành Công!</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Cảm ơn bạn đã quan tâm. Đội ngũ SanGo sẽ liên hệ trực tiếp qua số điện thoại <strong>{formData.phone}</strong> trong thời gian sớm nhất.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSubmitted(false)}
              className="text-xs font-semibold mt-2"
            >
              Gửi thêm thông tin cụm sân khác
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Họ và tên chủ sân / Quản lý *
                </label>
                <Input
                  required
                  placeholder="VD: Nguyễn Văn Nam"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="h-10 text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Số điện thoại liên hệ *
                </label>
                <Input
                  required
                  type="tel"
                  placeholder="VD: 0912 345 678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-10 text-xs bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Tên cụm sân thể thao *
                </label>
                <Input
                  required
                  placeholder="VD: Sân Bóng Đá &amp; Pickleball Ngọc Khánh"
                  value={formData.venueName}
                  onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                  className="h-10 text-xs bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Thành phố *
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                </select>
              </div>
            </div>

            {/* Chọn môn thể thao */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Môn thể thao hoạt động tại cụm sân
              </label>
              <div className="flex flex-wrap gap-2">
                {['Bóng đá 5 & 7', 'Pickleball', 'Cầu lông', 'Tennis'].map((sport) => {
                  const isChecked = formData.sportTypes.includes(sport);
                  return (
                    <button
                      key={sport}
                      type="button"
                      onClick={() => toggleSport(sport)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground hover:text-foreground border-input'
                      }`}
                    >
                      {sport}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Ghi chú thêm (Tùy chọn)
              </label>
              <Input
                placeholder="VD: Cụm có 4 sân 7 người, cần triển khai gấp trong tuần..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="h-10 text-xs bg-background"
              />
            </div>

            <Button type="submit" size="lg" className="w-full font-bold gap-2 shadow-xs active:scale-[0.98]">
              <PhoneCall className="h-4 w-4" />
              <span>Gửi thông tin đăng ký hợp tác</span>
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
