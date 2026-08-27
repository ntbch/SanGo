import { type FormEvent, type ReactElement, useState } from 'react';
import {
  BarChart3,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Coins,
  QrCode,
  Sparkles,
  TrendingUp,
  Users2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../components/ui/use-toast';
import { usePageMeta } from '../lib/seo';
import { APP_NAME } from '@sango/shared';

export function PartnerPage(): ReactElement {
  usePageMeta('Đối tác & Chủ sân — Hợp tác mở sân thể thao', 'Giải pháp số hóa sân thể thao toàn diện: quản lý lịch đặt, chống trùng giờ, tăng doanh thu tự động.');
  const { toast } = useToast();

  const [form, setForm] = useState({
    venueName: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    courtsCount: '3',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);

  // Trạng thái công cụ tính toán doanh thu (Interactive Revenue Calculator)
  const [calcCourts, setCalcCourts] = useState<number>(4);
  const [calcPrice, setCalcPrice] = useState<number>(200000);
  const [calcSlotsPerDay, setCalcSlotsPerDay] = useState<number>(8);

  const monthlyBoost = Math.round(calcCourts * calcPrice * calcSlotsPerDay * 30 * 0.35);
  const bookingsBoost = Math.round(calcCourts * calcSlotsPerDay * 30 * 0.35);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.venueName || !form.phone || !form.ownerName) {
      toast({
        variant: 'destructive',
        title: 'Thiếu thông tin',
        description: 'Vui lòng điền đầy đủ tên chủ sân, số điện thoại và tên cụm sân.',
      });
      return;
    }
    setSubmitted(true);
    toast({
      title: 'Đăng ký thành công!',
      description: 'Đội ngũ SanGo sẽ liên hệ tư vấn trong vòng 24 giờ làm việc.',
    });
  };

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-navy px-6 py-16 text-center text-white md:px-12 md:py-20 shadow-lg">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(60rem 30rem at 80% -10%, rgba(46,204,113,0.3), transparent 60%),' +
              'radial-gradient(50rem 26rem at 20% 100%, rgba(56,189,248,0.2), transparent 55%), #131b2e',
          }}
        />
        <div className="mx-auto max-w-3xl space-y-4">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-turf-bright">
            <Sparkles className="size-3.5" aria-hidden /> Dành cho chủ sân & doanh nghiệp
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-white">
            Số Hóa Sân Thể Thao — Tối Đa Hóa Doanh Thu
          </h1>
          <p className="text-base text-white/80 md:text-lg leading-relaxed">
            Tham gia mạng lưới {APP_NAME} để tiếp cận hàng chục ngàn người chơi, tự động hóa quản lý lịch đặt,
            chống trùng giờ và nhận tiền cọc minh bạch.
          </p>
          <div className="pt-2">
            <Button asChild size="lg" className="font-bold text-navy-deep bg-turf hover:bg-turf-bright">
              <a href="#register-form">Đăng ký mở sân ngay</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Lợi ích số hóa */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Tại Sao Nên Hợp Tác Với SanGo?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Công nghệ tối ưu được thiết kế riêng cho mô hình quản lý sân bãi thể thao tại Việt Nam.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border/60 bg-card">
            <CardContent className="p-6 space-y-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-6" />
              </div>
              <h3 className="font-bold text-lg">Tăng 35%+ Tỷ Lệ Lấp Đầy</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tự động quảng bá khung giờ thấp điểm qua hệ thống Voucher & gợi ý AI thông minh tới người chơi lân cận.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardContent className="p-6 space-y-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarCheck className="size-6" />
              </div>
              <h3 className="font-bold text-lg">Triệt Tiêu Trùng Lịch (No-Overlap)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cơ chế khóa giữ chỗ 10 phút cấp database đảm bảo không bao giờ xảy ra tình trạng 2 khách cùng đặt một giờ.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardContent className="p-6 space-y-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <Coins className="size-6" />
              </div>
              <h3 className="font-bold text-lg">Thanh Toán & Tiền Cọc Tức Thì</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tiền cọc 30%-100% được giữ và đối soát tự động, giảm thiểu rủi ro khách bùng giờ phút chót.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardContent className="p-6 space-y-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <QrCode className="size-6" />
              </div>
              <h3 className="font-bold text-lg">Check-in QR 1 Giây</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Quét mã QR của khách khi nhận sân bằng điện thoại của nhân viên mà không cần sổ sách rườm rà.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardContent className="p-6 space-y-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                <BarChart3 className="size-6" />
              </div>
              <h3 className="font-bold text-lg">Báo Cáo Doanh Thu Chuyên Sâu</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Dashboard biểu đồ trực quan thống kê doanh thu theo ngày/tháng, doanh số dịch vụ nước uống và giờ cao điểm.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardContent className="p-6 space-y-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                <Users2 className="size-6" />
              </div>
              <h3 className="font-bold text-lg">Bán Thêm Dịch Vụ Đi Kèm</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Menu nước giải khát, thuê giày, bóng và trọng tài tích hợp ngay trong quy trình đặt và check-in.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Công cụ tính toán doanh thu gia tăng (Interactive Revenue Calculator) */}
      <section className="rounded-2xl border border-border/70 bg-card p-6 md:p-8 shadow-[0_4px_20px_rgba(15,23,42,0.05)] space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <Badge className="bg-primary/15 text-primary border-primary/20">Ước Tính Hiệu Quả</Badge>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Công Cụ Tính Doanh Thu Tăng Thêm Cùng SanGo
          </h2>
          <p className="text-sm text-muted-foreground">
            Dựa trên số liệu thực tế từ các cụm sân đối tác đã tối ưu hóa tỷ lệ lấp đầy thêm trung bình 35%.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 items-center">
          {/* Cột điều chỉnh thông số */}
          <div className="lg:col-span-7 space-y-5 rounded-xl border border-border/60 bg-muted/20 p-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-foreground">Số lượng sân con của cụm:</span>
                <span className="font-score font-bold text-primary">{calcCourts} sân</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={calcCourts}
                onChange={(e) => setCalcCourts(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>1 sân</span>
                <span>6 sân</span>
                <span>12 sân</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-foreground">Giá thuê trung bình / slot (60-90p):</span>
                <span className="font-score font-bold text-primary">{calcPrice.toLocaleString('vi-VN')}₫</span>
              </div>
              <input
                type="range"
                min="100000"
                max="600000"
                step="20000"
                value={calcPrice}
                onChange={(e) => setCalcPrice(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>100.000₫</span>
                <span>350.000₫</span>
                <span>600.000₫</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-foreground">Số khung giờ hoạt động / ngày:</span>
                <span className="font-score font-bold text-primary">{calcSlotsPerDay} slot/ngày</span>
              </div>
              <input
                type="range"
                min="4"
                max="14"
                step="1"
                value={calcSlotsPerDay}
                onChange={(e) => setCalcSlotsPerDay(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>4 slot (Sáng/Tối)</span>
                <span>8 slot</span>
                <span>14 slot (Full ngày)</span>
              </div>
            </div>
          </div>

          {/* Cột kết quả ước tính Bento */}
          <div className="lg:col-span-5 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/30 to-background p-6 space-y-5 text-center shadow-sm">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Doanh thu ước tính tăng thêm mỗi tháng
              </p>
              <div className="font-score text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
                +{monthlyBoost.toLocaleString('vi-VN')}₫
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                (~ +{(monthlyBoost * 12).toLocaleString('vi-VN')}₫ mỗi năm)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/60 text-left">
              <div className="rounded-lg bg-card/80 p-3 border border-border/60">
                <p className="text-[11px] text-muted-foreground">Đơn đặt mới tăng thêm:</p>
                <p className="font-score font-bold text-base text-foreground mt-0.5">+{bookingsBoost} lượt/tháng</p>
              </div>
              <div className="rounded-lg bg-card/80 p-3 border border-border/60">
                <p className="text-[11px] text-muted-foreground">Tỷ lệ lấp đầy giờ vắng:</p>
                <p className="font-score font-bold text-base text-emerald-600 dark:text-emerald-400 mt-0.5">+35% công suất</p>
              </div>
            </div>

            <Button asChild className="w-full font-bold shadow-xs">
              <a href="#register-form">Nhận tư vấn mở rộng doanh thu</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Form đăng ký hợp tác */}
      <section id="register-form" className="max-w-2xl mx-auto pt-6">
        <Card className="border-border/60 bg-card shadow-md">
          <CardHeader className="text-center space-y-1">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
              <Building2 className="size-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Đăng Ký Trở Thành Đối Tác</CardTitle>
            <CardDescription>
              Điền thông tin cụm sân của bạn, chuyên viên SanGo sẽ liên hệ khảo sát và kích hoạt tài khoản quản lý.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-3">
                <CheckCircle2 className="size-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-lg text-emerald-800 dark:text-emerald-300">
                  Gửi thông tin thành công!
                </h4>
                <p className="text-sm text-muted-foreground">
                  Cảm ơn bạn đã tin tưởng SanGo. Chúng tôi sẽ liên hệ lại qua SĐT {form.phone} trong thời gian sớm nhất.
                </p>
                <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                  Gửi lại biểu mẫu khác
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="venueName">Tên cụm sân *</Label>
                    <Input
                      id="venueName"
                      placeholder="VD: Sân Bóng Đá Thành Phát"
                      value={form.venueName}
                      onChange={(e) => setForm({ ...form, venueName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ownerName">Họ & tên chủ sân / đại diện *</Label>
                    <Input
                      id="ownerName"
                      placeholder="VD: Nguyễn Văn A"
                      value={form.ownerName}
                      onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Số điện thoại liên hệ *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="VD: 0912345678"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="VD: santhanhphat@gmail.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="address">Địa chỉ cụm sân *</Label>
                    <Input
                      id="address"
                      placeholder="VD: Số 2 Hoàng Cầu, Đống Đa, Hà Nội"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="courtsCount">Số lượng sân con</Label>
                    <Input
                      id="courtsCount"
                      type="number"
                      min={1}
                      max={50}
                      value={form.courtsCount}
                      onChange={(e) => setForm({ ...form, courtsCount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes">Ghi chú thêm</Label>
                  <textarea
                    id="notes"
                    rows={3}
                    placeholder="Môn thể thao chính, tiện ích có sẵn (đèn chiếu sáng, bãi đỗ ô tô)..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background p-2.5 text-xs shadow-xs focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <Button type="submit" size="lg" className="w-full font-bold">
                  Gửi yêu cầu hợp tác
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}