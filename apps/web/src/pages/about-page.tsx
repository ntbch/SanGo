import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { APP_NAME } from '@sango/shared';
import { usePageMeta } from '../lib/seo';

export function AboutPage(): ReactElement {
  usePageMeta('Về chúng tôi — Sứ mệnh & Đội ngũ', 'Khám phá sứ mệnh kết nối cộng đồng thể thao và đội ngũ phát triển nền tảng SanGo.');

  return (
    <div className="space-y-12 py-4">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-navy px-6 py-16 text-center text-white md:px-12 md:py-20 shadow-lg">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(60rem 30rem at 20% -10%, rgba(46,204,113,0.3), transparent 60%),' +
              'radial-gradient(50rem 26rem at 80% 100%, rgba(56,189,248,0.2), transparent 55%), #131b2e',
          }}
        />
        <div className="mx-auto max-w-3xl space-y-4">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-turf-bright">
            <Sparkles className="size-3.5" aria-hidden /> Sứ mệnh kết nối thể thao
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-white">
            Xây dựng nền tảng thể thao thông minh hàng đầu Việt Nam
          </h1>
          <p className="text-base text-white/80 md:text-lg leading-relaxed">
            {APP_NAME} ra đời nhằm xóa bỏ rào cản tìm sân bãi, kết nối những người đam mê thể thao
            và nâng tầm trải nghiệm đặt sân trực tuyến với công nghệ hiện đại.
          </p>
        </div>
      </section>

      {/* Giá trị cốt lõi */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Giá Trị Cốt Lõi</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Những nguyên tắc định hình sản phẩm và dịch vụ của chúng tôi mỗi ngày.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60 bg-card shadow-xs">
            <CardContent className="p-6 space-y-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="size-6" />
              </div>
              <h3 className="font-bold text-lg">Tìm sân tức thì</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Định vị GPS và bản đồ trực quan giúp bạn tìm thấy cụm sân ưng ý gần nhất chỉ trong vài giây.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card shadow-xs">
            <CardContent className="p-6 space-y-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarClock className="size-6" />
              </div>
              <h3 className="font-bold text-lg">Giữ chỗ minh bạch</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Khóa slot 10 phút chống trùng lịch tuyệt đối. Lịch trống cập nhật theo thời gian thực.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card shadow-xs">
            <CardContent className="p-6 space-y-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="size-6" />
              </div>
              <h3 className="font-bold text-lg">Cộng đồng sôi động</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ghép trận mở, quản lý đội nhóm và quỹ chia tiền minh bạch, kết nối người chơi cùng đam mê.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card shadow-xs">
            <CardContent className="p-6 space-y-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-6" />
              </div>
              <h3 className="font-bold text-lg">An toàn & Tin cậy</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Thanh toán online bảo mật, check-in mã QR nhanh gọn và chính sách hoàn tiền rõ ràng.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Đội ngũ phát triển */}
      <section className="rounded-2xl border border-border/60 bg-muted/30 p-8 sm:p-12 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Đội Ngũ Phát Triển</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Dự án Đồ án tốt nghiệp Đại học — Xây dựng hệ sinh thái phần mềm thể thao toàn diện.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
          <div className="rounded-xl border border-border/60 bg-card p-5 text-center space-y-3">
            <div className="size-16 mx-auto rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xl">
              SG
            </div>
            <div>
              <h4 className="font-bold text-base">SanGo Tech Team</h4>
              <p className="text-xs text-primary font-medium">Kỹ sư Công nghệ thông tin</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Phụ trách kiến trúc micro-frontend, backend NestJS & Prisma, bản đồ tương tác và tối ưu hóa trải nghiệm người dùng.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5 text-center space-y-3">
            <div className="size-16 mx-auto rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-xl">
              <Trophy className="size-7" />
            </div>
            <div>
              <h4 className="font-bold text-base">Cố Vấn Chuyên Môn</h4>
              <p className="text-xs text-primary font-medium">Khoa CNTT</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Định hướng phương pháp luận nghiên cứu, giải thuật gợi ý AI và tiêu chuẩn kỹ thuật phần mềm doanh nghiệp.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-4 py-6">
        <h3 className="text-xl font-bold">Sẵn sàng trải nghiệm cùng SanGo?</h3>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="font-bold">
            <Link to="/venues">Tìm sân ngay</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/partner">Trở thành đối tác chủ sân</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}