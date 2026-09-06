import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ArrowRight, Check } from 'lucide-react';
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
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-12 lg:p-16 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.15] text-balance">
              Giải pháp quản lý và đặt sân trực tuyến cho chủ sân
            </h1>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              SanGo hỗ trợ đồng bộ lịch trống theo thời gian thực, chống trùng ca, tự động thu tiền cọc qua mã VietQR và kết nối cụm sân với cộng đồng người chơi tại Hà Nội và TP. Hồ Chí Minh.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a href="#partner-form">
                <Button size="lg" className="gap-2 font-bold shadow-xs active:scale-[0.98]">
                  <span>Đăng ký đối tác chủ sân</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link to="/login">
                <Button variant="outline" size="lg" className="text-xs font-semibold active:scale-[0.98]">
                  Đăng nhập chủ sân
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Card */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
            <div className="p-5 rounded-xl bg-secondary/60 border border-border space-y-1">
              <div className="text-2xl sm:text-3xl font-mono-num font-black text-foreground">+35%</div>
              <div className="text-xs font-bold text-foreground">Tối ưu giờ trống</div>
              <p className="text-[11px] text-muted-foreground leading-tight">Tăng tỉ lệ lấp đầy ca ngày và đêm</p>
            </div>

            <div className="p-5 rounded-xl bg-secondary/60 border border-border space-y-1">
              <div className="text-2xl sm:text-3xl font-mono-num font-black text-foreground">0%</div>
              <div className="text-xs font-bold text-foreground">Trùng lịch sân</div>
              <p className="text-[11px] text-muted-foreground leading-tight">Khóa slot 10 phút tự động</p>
            </div>

            <div className="p-5 rounded-xl bg-secondary/60 border border-border space-y-1">
              <div className="text-2xl sm:text-3xl font-mono-num font-black text-foreground">1 Giây</div>
              <div className="text-xs font-bold text-foreground">Check-in tại quầy</div>
              <p className="text-[11px] text-muted-foreground leading-tight">Quét mã QR nhận sân</p>
            </div>

            <div className="p-5 rounded-xl bg-secondary/60 border border-border space-y-1">
              <div className="text-2xl sm:text-3xl font-mono-num font-black text-foreground">250+</div>
              <div className="text-xs font-bold text-foreground">Cụm sân đối tác</div>
              <p className="text-[11px] text-muted-foreground leading-tight">Đang hoạt động trên hệ thống</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Grid: Tính năng dành cho chủ sân */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Tính năng quản lý cụm sân
          </h2>
          <p className="text-sm text-muted-foreground">
            Thiết kế phù hợp cho sân bóng đá, pickleball, cầu lông và tennis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Card className="p-6 rounded-2xl border border-border bg-card space-y-3">
            <h3 className="text-base font-bold text-foreground">Bảng lịch ma trận trực quan</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hiển thị trạng thái các sân con theo khung giờ: Trống, Đang giữ chỗ, Đã cọc hoặc Khóa nội bộ.
            </p>
          </Card>

          <Card className="p-6 rounded-2xl border border-border bg-card space-y-3">
            <h3 className="text-base font-bold text-foreground">Thu tiền cọc qua VietQR</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Khách thanh toán cọc trực tiếp qua mã VietQR về thẳng tài khoản ngân hàng của chủ sân.
            </p>
          </Card>

          <Card className="p-6 rounded-2xl border border-border bg-card space-y-3">
            <h3 className="text-base font-bold text-foreground">Quét mã QR check-in</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Quét mã vé QR của khách tại quầy lễ tân để đối soát thông tin ca đặt, không cần sổ sách thủ công.
            </p>
          </Card>

          <Card className="p-6 rounded-2xl border border-border bg-card space-y-3">
            <h3 className="text-base font-bold text-foreground">Báo cáo và dịch vụ bán kèm</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Theo dõi doanh thu thuê sân, nước uống và dịch vụ. Thống kê số liệu theo ngày, tuần và tháng.
            </p>
          </Card>

          <Card className="p-6 rounded-2xl border border-border bg-card space-y-3">
            <h3 className="text-base font-bold text-foreground">Hiển thị trên bản đồ sân</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Xuất hiện trên bản đồ thể thao và tiếp cận người chơi đang tìm sân trong bán kính xung quanh cụm sân.
            </p>
          </Card>

          <Card className="p-6 rounded-2xl border border-border bg-card space-y-3">
            <h3 className="text-base font-bold text-foreground">Phân quyền tài khoản</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Phân quyền rõ ràng giữa chủ sân, quản lý và nhân viên lễ tân, đảm bảo dữ liệu kinh doanh an toàn.
            </p>
          </Card>
        </div>
      </section>

      {/* 3. Quy Trình Triển Khai */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Quy trình triển khai
          </h2>
          <p className="text-sm text-muted-foreground">
            Quá trình thiết lập đơn giản, không làm gián đoạn việc đón khách hàng ngày.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: '01', title: 'Gửi thông tin sân', desc: 'Cung cấp tên cụm sân, số lượng sân con và địa chỉ.' },
            { step: '02', title: 'Khởi tạo tài khoản', desc: 'Đội ngũ SanGo hỗ trợ thiết lập bảng lịch và bảng giá.' },
            { step: '03', title: 'Hướng dẫn sử dụng', desc: 'Bàn giao và hướng dẫn quản lý, lễ tân sử dụng hệ thống.' },
            { step: '04', title: 'Nhận khách trực tuyến', desc: 'Bắt đầu nhận ca đặt và thu cọc tự động qua hệ thống.' },
          ].map((item, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
              <span className="font-mono-num text-xl font-bold text-foreground/40">{item.step}</span>
              <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Form Đăng Ký Hợp Tác */}
      <section id="partner-form" className="max-w-3xl mx-auto rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-xs space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-xl sm:text-2xl font-extrabold text-foreground">
            Đăng ký hợp tác cụm sân
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Điền thông tin bên dưới, nhân viên SanGo sẽ liên hệ tư vấn và thiết lập hệ thống trong vòng 2 giờ làm việc.
          </p>
        </div>

        {submitted ? (
          <div className="p-8 rounded-2xl bg-secondary/80 border border-border text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto">
              <Check className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-foreground">Đăng ký thành công</h4>
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
                  Họ và tên người liên hệ *
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
                  Số điện thoại *
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
                  placeholder="VD: Cụm Sân Thể Thao Ngọc Khánh"
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
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
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
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-muted-foreground hover:text-foreground border-border'
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
              <textarea
                rows={3}
                placeholder="Số lượng sân, địa chỉ cụ thể..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full font-bold shadow-xs active:scale-[0.98] cursor-pointer"
            >
              Gửi thông tin đăng ký
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
